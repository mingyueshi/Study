import json
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, TestCase

from lexicon.models import LexicalEntry, LexiconSource, Pronunciation, Sense, SourceBinding, \
    SourceRecord, SourceRelease

from .catalog import SOURCE_CODE
from .emoji import ROUND_SIZE, load_entries, quiz_pool, validate

ENTRIES = json.loads((Path(__file__).parent / "data" / "emoji.json").read_text(encoding="utf-8"))


class EmojiDataTests(SimpleTestCase):
    """数据契约：headword 唯一、emoji/hint 非空、钉词字段齐备。"""

    def setUp(self):
        self.curriculum = load_entries()

    def test_schema_and_source(self):
        self.assertEqual(self.curriculum["schema_version"], 1)
        self.assertEqual(self.curriculum["source_code"], SOURCE_CODE)

    def test_entries_unique_and_complete(self):
        headwords = [e["headword"] for e in self.curriculum["entries"]]
        self.assertGreaterEqual(len(headwords), 40)
        self.assertEqual(len(headwords), len(set(headwords)))
        for entry in self.curriculum["entries"]:
            self.assertTrue(entry["emoji"].strip(), entry["headword"])
            self.assertTrue(entry["hint"].strip(), entry["headword"])
            for field in ("binding_id", "entry_id", "evidence_id", "lexical_hash", "editorial_snapshot"):
                self.assertTrue(entry.get(field), (entry["headword"], field))

    def test_validate_rejects_drift(self):
        with self.assertRaises(ImproperlyConfigured):
            validate({"schema_version": 2, "source_code": SOURCE_CODE, "entries": []})


class EmojiQuizTests(TestCase):
    """钉词夹具：按钉词 UUID 精确复刻前三个条目的词库记录。"""

    @classmethod
    def setUpTestData(cls):
        import uuid

        cls.source = LexiconSource.objects.get_or_create(code=SOURCE_CODE, defaults={"name": "成语测试", "url": "x-test:"})[0]
        cls.release = SourceRelease.objects.create(source=cls.source, version="emoji-test", status=SourceRelease.Status.READY)
        LexiconSource.objects.filter(pk=cls.source.pk).update(active_release=cls.release)
        # 夹具只建前 3 条；question 的干扰项不足时由题库其余条目兜底（测试库为空）。
        cls.fixture_headwords = [e["headword"] for e in ENTRIES["entries"][:3]]
        for story in ENTRIES["entries"][:3]:
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

    def test_pool_marks_missing_records_invalid(self):
        pool = quiz_pool()
        valid = [e for e in pool if e["valid"]]
        self.assertEqual([e["headword"] for e in valid], self.fixture_headwords)

    def test_api_round_flow(self):
        client = self.client
        page = client.get("/idioms/emoji/")
        self.assertEqual(page.status_code, 200)
        response = client.post("/idioms/emoji/api/action/", {"action": "new"}, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        state = response.json()
        # 夹具只有 3 条有效记录：局长收缩为 3，正式题库为 ROUND_SIZE。
        self.assertEqual(state["size"], 3)
        token = state["token"]
        for index in range(state["size"]):
            question = client.post("/idioms/emoji/api/action/",
                                   {"action": "question", "token": token, "index": index},
                                   content_type="application/json").json()
            options = question["current"]["options"]
            self.assertTrue(2 <= len(options) <= 4)
            self.assertEqual(len({o["text"] for o in options}), len(options))
            answer = client.post("/idioms/emoji/api/action/",
                                 {"action": "answer", "token": token, "chosen": options[0]["text"]},
                                 content_type="application/json")
            self.assertEqual(answer.status_code, 200)
            result = answer.json()
            token = result["token"]
        self.assertTrue(result["finished"])

    def test_wrong_answer_shows_correct_answer(self):
        client = self.client
        token = client.post("/idioms/emoji/api/action/", {"action": "new"}, content_type="application/json").json()["token"]
        question = client.post("/idioms/emoji/api/action/",
                               {"action": "question", "token": token, "index": 0},
                               content_type="application/json").json()["current"]
        wrong = next(o["text"] for o in question["options"] if o["text"] != question["options"][0]["text"])
        result = client.post("/idioms/emoji/api/action/",
                             {"action": "answer", "token": token, "chosen": wrong},
                             content_type="application/json")
        # 夹具内三个条目都有词典记录：判定与正确答案回显正常。
        self.assertEqual(result.status_code, 200)
        self.assertIn(result.json()["card"]["outcome"], ("correct", "wrong"))

    def test_page_is_read_only(self):
        before = SourceRecord.objects.count()
        self.assertEqual(self.client.get("/idioms/emoji/").status_code, 200)
        self.assertEqual(SourceRecord.objects.count(), before)
