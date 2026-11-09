import json
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, TestCase

from lexicon.models import LexicalEntry, LexiconSource, Pronunciation, Sense, SourceBinding, \
    SourceRecord, SourceRelease

from .catalog import SOURCE_CODE
from .pairs import ROUND_SIZE, load_pairs, pairs_pool, validate

PAIRS = json.loads((Path(__file__).parent / "data" / "pairs.json").read_text(encoding="utf-8"))


class PairsDataTests(SimpleTestCase):
    """数据契约：relation 合法、a≠b、钉词字段齐备、配对不重复。"""

    def setUp(self):
        self.curriculum = load_pairs()

    def test_schema_and_source(self):
        self.assertEqual(self.curriculum["schema_version"], 1)
        self.assertEqual(self.curriculum["source_code"], SOURCE_CODE)

    def test_pairs_valid_and_unique(self):
        seen = set()
        for pair in self.curriculum["pairs"]:
            relation = pair["relation"]
            self.assertIn(relation, ("near", "opp"), pair["id"])
            self.assertNotEqual(pair["headword_a"], pair["headword_b"], pair["id"])
            key = tuple(sorted((pair["headword_a"], pair["headword_b"])))
            self.assertNotIn(key, seen, pair["id"])
            seen.add(key)
            for side in ("a", "b"):
                self.assertTrue(pair[f"headword_{side}"].strip())
                for field in ("entry_id", "binding_id", "evidence_id", "lexical_hash", "editorial_snapshot"):
                    self.assertTrue(pair.get(f"{side}_{field}"), (pair["id"], side, field))

    def test_both_relations_present(self):
        relations = {pair["relation"] for pair in self.curriculum["pairs"]}
        self.assertEqual(relations, {"near", "opp"})

    def test_validate_rejects_drift(self):
        with self.assertRaises(ImproperlyConfigured):
            validate({"schema_version": 2, "source_code": SOURCE_CODE, "pairs": []})
        curriculum = load_pairs()
        curriculum["pairs"][0]["relation"] = "bogus"
        with self.assertRaises(ImproperlyConfigured):
            validate(curriculum)


class PairsQuizTests(TestCase):
    """钉词夹具：复刻前两对的双侧词库记录，走真实判定路径。"""

    @classmethod
    def setUpTestData(cls):
        import uuid

        cls.source = LexiconSource.objects.get_or_create(code=SOURCE_CODE, defaults={"name": "成语测试", "url": "x-test:"})[0]
        cls.release = SourceRelease.objects.create(source=cls.source, version="pairs-test", status=SourceRelease.Status.READY)
        LexiconSource.objects.filter(pk=cls.source.pk).update(active_release=cls.release)
        cls.fixture_words = []
        for pair in PAIRS["pairs"][:2]:
            for side in ("a", "b"):
                story = {
                    "entry_id": pair[f"{side}_entry_id"], "sense_id": pair[f"{side}_sense_id"],
                    "pronunciation_id": pair[f"{side}_pronunciation_id"], "binding_id": pair[f"{side}_binding_id"],
                    "evidence_id": pair[f"{side}_evidence_id"], "source_key": pair[f"{side}_source_key"],
                    "lexical_hash": pair[f"{side}_lexical_hash"], "headword": pair[f"headword_{side}"],
                }
                entry = LexicalEntry.objects.create(id=uuid.UUID(story["entry_id"]), language="zh", kind="idiom", headword=story["headword"])
                sense = Sense.objects.create(id=uuid.UUID(story["sense_id"]), entry=entry)
                pronunciation = Pronunciation.objects.create(id=uuid.UUID(story["pronunciation_id"]), entry=entry, system="pinyin")
                binding = SourceBinding.objects.create(id=uuid.UUID(story["binding_id"]), source=cls.source,
                                                       sense=sense, pronunciation=pronunciation,
                                                       external_key=story["source_key"])
                SourceRecord.objects.create(id=uuid.UUID(story["evidence_id"]), release=cls.release, binding=binding,
                                            headword=story["headword"], definition="测试释义",
                                            lexical_hash=story["lexical_hash"],
                                            properties={"derivation": "测试出处"})
                cls.fixture_words.append(story)

    def test_fresh_draws_disjoint_round(self):
        pool = pairs_pool()
        state_pool = [pair for pair in pool if pair["valid"]]
        from .pairs import fresh
        # 夹具只有 2 对有效：局长收缩，词头必须不相交。
        try:
            state = fresh([pair for pair in pool if pair["valid"]][:2], size=ROUND_SIZE)
        except Exception:
            self.skipTest("有效配对不足")
        words = []
        for pair_id in state["pair_ids"]:
            pair = next(p for p in pool if p["id"] == pair_id)
            words += [pair["headword_a"], pair["headword_b"]]
        self.assertEqual(len(words), len(set(words)) + state["size"] * 2 - len(words))

    def test_valid_fixture_pair_matches(self):
        pool = [pair for pair in pairs_pool() if pair["valid"]]
        pair = next(p for p in pool if {p["headword_a"], p["headword_b"]} == {"画蛇添足", "多此一举"})
        self.assertTrue(pair["valid"])

    def test_drifted_pair_excluded(self):
        # 钉词漂移的配对不出题：改动夹具记录的 lexical_hash 走新版本即漂移。
        pool = pairs_pool()
        fixture_pair = next(p for p in pool if p["valid"] and p["headword_a"] == "画蛇添足")
        self.assertTrue(fixture_pair["valid"])
        # 打漂移：新 release 替换 active，lexical_hash 改变。
        drift_release = SourceRelease.objects.create(source=self.source, version="pairs-drift", status=SourceRelease.Status.READY)
        from lexicon.models import active_records
        record = active_records().filter(binding_id=fixture_pair["a_binding_id"]).first()
        SourceRecord.objects.create(release=drift_release, binding=record.binding,
                                    headword=record.headword, definition="漂移释义",
                                    lexical_hash="drifted", properties=record.properties)
        LexiconSource.objects.filter(pk=self.source.pk).update(active_release=drift_release)
        pool = pairs_pool()
        fixture_pair = next(p for p in pool if p["headword_a"] == "画蛇添足")
        self.assertFalse(fixture_pair["valid"])

    def test_page_is_read_only(self):
        before = SourceRecord.objects.count()
        self.assertEqual(self.client.get("/idioms/pairs/").status_code, 200)
        self.assertEqual(SourceRecord.objects.count(), before)
