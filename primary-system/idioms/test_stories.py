import json
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, TestCase

from lexicon.models import SourceBinding, SourceRecord, SourceRelease, LexicalEntry, LexiconSource, \
    Pronunciation, Sense, editorial_values

from .catalog import SOURCE_CODE
from .stories import figure_clues, load_stories, story_cards, validate

STORIES = json.loads((Path(__file__).parent / "data" / "stories.json").read_text(encoding="utf-8"))


class StoryDataTests(SimpleTestCase):
    """数据契约：人物、故事卡与钉词字段齐备。"""

    def setUp(self):
        self.curriculum = load_stories()

    def test_schema_and_source(self):
        self.assertEqual(self.curriculum["schema_version"], 1)
        self.assertEqual(self.curriculum["source_code"], SOURCE_CODE)

    def test_figures_complete_and_unique(self):
        ids = [f["id"] for f in self.curriculum["figures"]]
        self.assertGreaterEqual(len(ids), 10)
        self.assertEqual(len(ids), len(set(ids)))
        for figure in self.curriculum["figures"]:
            self.assertTrue(figure["name"] and figure["era"] and figure["role"] and figure["blurb"])

    def test_stories_reference_figures_and_pins(self):
        ids = {f["id"] for f in self.curriculum["figures"]}
        seen = set()
        for story in self.curriculum["stories"]:
            self.assertNotIn(story["id"], seen)
            seen.add(story["id"])
            for field in ("headword", "source_book", "source_chapter", "quote", "story", "meaning", "clue"):
                self.assertTrue(story[field].strip(), (story["id"], field))
            self.assertGreaterEqual(len(story["story"]), 100)
            self.assertTrue(set(story["figure_ids"]) <= ids)
            for field in ("binding_id", "entry_id", "evidence_id", "lexical_hash", "editorial_snapshot"):
                self.assertTrue(story.get(field), (story["headword"], field))

    def test_validate_rejects_drift(self):
        with self.assertRaises(ImproperlyConfigured):
            validate({"schema_version": 2, "source_code": SOURCE_CODE, "figures": [], "stories": []})


class StoryPinTests(TestCase):
    """钉词校验：夹具按钉词 UUID 精确复刻词库记录，通过出卡；版本漂移降级。"""

    @classmethod
    def setUpTestData(cls):
        import uuid

        cls.source = LexiconSource.objects.get_or_create(code=SOURCE_CODE, defaults={"name": "成语测试", "url": "x-test:"})[0]
        cls.release = SourceRelease.objects.create(source=cls.source, version="stories-test", status=SourceRelease.Status.READY)
        LexiconSource.objects.filter(pk=cls.source.pk).update(active_release=cls.release)
        cls.records = {}
        for story in STORIES["stories"][:3]:
            entry = LexicalEntry.objects.create(id=uuid.UUID(story["entry_id"]), language="zh", kind="idiom", headword=story["headword"])
            sense = Sense.objects.create(id=uuid.UUID(story["sense_id"]), entry=entry)
            pronunciation = Pronunciation.objects.create(id=uuid.UUID(story["pronunciation_id"]), entry=entry, system="pinyin")
            binding = SourceBinding.objects.create(id=uuid.UUID(story["binding_id"]), source=cls.source,
                                                   sense=sense, pronunciation=pronunciation,
                                                   external_key=story["source_key"])
            record = SourceRecord.objects.create(id=uuid.UUID(story["evidence_id"]), release=cls.release, binding=binding,
                                                 headword=story["headword"], definition="测试释义",
                                                 lexical_hash=story["lexical_hash"],
                                                 properties={"derivation": story["quote"], "example": "例句。"})
            cls.records[story["headword"]] = record

    def test_first_three_cards_valid_from_fixture(self):
        cards = {c["headword"]: c for c in story_cards()[:3]}
        # 夹具记录与 stories.json 钉词完全一致 → 出卡；其余词典缺失 → 降级。
        self.assertTrue(all(c["valid"] for c in cards.values()))

    def test_hash_drift_pauses_card(self):
        # 词库记录不可修改；真实漂移路径是发布新版本，active_release 指向新记录。
        self.assertTrue(story_cards()[0]["valid"])
        drift_release = SourceRelease.objects.create(source=self.source, version="stories-drift", status=SourceRelease.Status.READY)
        record = self.records["负荆请罪"]
        drifted = SourceRecord.objects.create(release=drift_release, binding=record.binding,
                                              headword=record.headword, definition="测试释义改",
                                              lexical_hash="drifted-hash",
                                              properties={"derivation": record.properties.get("derivation", "")})
        LexiconSource.objects.filter(pk=self.source.pk).update(active_release=drift_release)
        card = next(c for c in story_cards() if c["headword"] == "负荆请罪")
        self.assertFalse(card["valid"])
        self.assertTrue(str(drifted.pk))

    def test_figure_clues_link_stories(self):
        clues = {c["id"]: c for c in figure_clues(story_cards())}
        lxr = clues["lin-xiangru"]
        self.assertEqual([s["headword"] for s in lxr["stories"]], ["负荆请罪", "完璧归赵"])
        self.assertEqual(lxr["books"], ["《史记》"])


class StoryPageTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        StoryPinTests.setUpTestData()

    def test_page_renders_hall_filters_and_clue_view(self):
        response = self.client.get("/idioms/stories/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "成语典故馆")
        self.assertContains(response, "story-card")
        self.assertContains(response, "负荆请罪")
        self.assertContains(response, "人物线索")
        clue = self.client.get("/idioms/stories/?figure=lin-xiangru")
        self.assertContains(clue, "蔺相如")
        self.assertContains(clue, "人物线索：蔺相如")
        book = self.client.get("/idioms/stories/?book=%E3%80%8A%E5%8F%B2%E8%AE%B0%E3%80%8B")
        self.assertEqual(book.status_code, 200)

    def test_page_is_read_only(self):
        before = SourceRecord.objects.count()
        self.client.get("/idioms/stories/")
        self.assertEqual(SourceRecord.objects.count(), before)
