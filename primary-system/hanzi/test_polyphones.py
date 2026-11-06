"""多音字专题测试：数据契约、出题确定性、页面与只读保证。"""
import json
import random
import re
from pathlib import Path

from django.test import SimpleTestCase, TestCase

from lexicon.reference_models import CedictRecord

from .models import PolyphoneAnswer
from .polyphones import DATA_PATH, practice_items, practice_round, validate

TONE_MARK_PATTERN = re.compile(r"^[a-zü]*[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]?[a-zü]*$")
DATA = json.loads(DATA_PATH.read_text(encoding="utf-8"))


class PolyphoneDataTests(SimpleTestCase):
    """数据契约：字数、读音数、组词与拼音格式。"""

    def test_schema_and_source(self):
        self.assertEqual(DATA["schema_version"], 1)
        self.assertEqual(DATA["source"]["name"], "CC-CEDICT")
        self.assertEqual(DATA["source"]["license"], "CC-BY-4.0")

    def test_char_count_and_uniqueness(self):
        chars = DATA["chars"]
        self.assertGreaterEqual(len(chars), 800)
        keys = [item["char"] for item in chars]
        self.assertEqual(len(keys), len(set(keys)))

    def test_every_char_has_multiple_readings_with_words(self):
        for item in DATA["chars"][:200]:
            readings = item["readings"]
            self.assertGreaterEqual(len(readings), 2, item["char"])
            for reading in readings:
                self.assertTrue(reading["pinyin"])
                self.assertGreaterEqual(reading["count"], 1)
                self.assertTrue(reading["words"], (item["char"], reading["pinyin"]))
                for word in reading["words"]:
                    self.assertIn(item["char"], word["word"])
                    self.assertIn(" ", word["pinyin"])  # 组词拼音至少两个音节
                    self.assertIn(reading["pinyin"], word["pinyin"])
                    self.assertLess(word["position"], len(word["word"]))

    def test_pinyin_uses_tone_marks(self):
        for item in DATA["chars"][:200]:
            for reading in item["readings"]:
                self.assertTrue(TONE_MARK_PATTERN.match(reading["pinyin"]), reading["pinyin"])
                for word in reading["words"]:
                    for part in word["pinyin"].split():
                        self.assertTrue(TONE_MARK_PATTERN.match(part), word["pinyin"])

    def test_validate_rejects_bad_schema(self):
        with self.assertRaises(Exception):
            validate({"schema_version": 2, "chars": DATA["chars"]})

    def test_practice_options_contain_answer(self):
        for item in practice_items()[:100]:
            self.assertIn(item["answer"], [option["pinyin"] for option in item["options"]])


class PolyphoneRoundTests(SimpleTestCase):
    """出题：确定性、选项齐全、选项被打乱。"""

    def test_seeded_round_is_reproducible(self):
        first = practice_round(random.Random("x1"))
        second = practice_round(random.Random("x1"))
        self.assertEqual(first["word"], second["word"])
        self.assertEqual(first["answer"], second["answer"])
        self.assertEqual(first["options"], second["options"])

    def test_round_fields(self):
        round_ = practice_round(random.Random("x2"))
        self.assertIn(round_["target"], round_["word"])
        self.assertEqual(round_["syllables"][round_["position"]], round_["answer"])
        self.assertEqual(len(round_["syllables"]), len(round_["word"]))
        self.assertGreaterEqual(len(round_["options"]), 2)


class PolyphonePageTests(TestCase):
    """页面：渲染、char 深链与回退、只读保证。"""

    def test_page_renders(self):
        response = self.client.get("/hanzi/polyphones/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "多音字")
        self.assertContains(response, "poly-chip")
        self.assertContains(response, "data-poly-option")

    def test_char_deep_link(self):
        response = self.client.get("/hanzi/polyphones/?char=乐")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "poly-reading-pinyin")
        self.assertContains(response, "yuè")

    def test_unknown_char_falls_back(self):
        response = self.client.get("/hanzi/polyphones/?char=zz")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "poly-chip")

    def test_seeded_round_reproducible_on_page(self):
        first = self.client.get("/hanzi/polyphones/?q_seed=same")
        second = self.client.get("/hanzi/polyphones/?q_seed=same")
        self.assertEqual(first.context["round"]["word"], second.context["round"]["word"])

    def test_page_is_read_only(self):
        before = CedictRecord.objects.count()
        self.client.get("/hanzi/polyphones/")
        self.assertEqual(CedictRecord.objects.count(), before)


class PolyphoneReportTests(TestCase):
    """逐题上报：服务端按读音表复核并重算对错，不信任前端结论。"""

    @classmethod
    def setUpTestData(cls):
        from .polyphones import char_index, common_chars
        cls.item = common_chars()[0]
        cls.readings = [reading["pinyin"] for reading in char_index()[cls.item["char"]]["readings"]]

    def post_report(self, **overrides):
        payload = {"char": self.item["char"], "word": self.item["readings"][0]["words"][0]["word"],
                   "chosen": self.readings[0], "answer": self.readings[0]}
        payload.update(overrides)
        return self.client.post("/hanzi/polyphones/api/report/", payload, content_type="application/json")

    def test_valid_reports_record_with_server_recomputed_correctness(self):
        # chosen 与 answer 一致：服务端重算为答对，前端的 correct 字段被忽略。
        response = self.post_report(correct=False)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"ok": True})
        record = PolyphoneAnswer.objects.get()
        self.assertEqual(record.char, self.item["char"])
        self.assertTrue(record.correct)
        # 选了另一个真实读音：落一条答错。
        self.post_report(chosen=self.readings[-1])
        wrong = PolyphoneAnswer.objects.latest("pk")
        self.assertFalse(wrong.correct)
        self.assertEqual(wrong.answer, self.readings[0])

    def test_report_rejects_unknown_char_or_reading(self):
        outside = DATA["chars"][-1]["char"]  # 练习池只取证据最厚的前 60 字，取末位字必在池外
        for overrides in ({"char": outside}, {"chosen": "bùzàidewèi"}, {"answer": "bùzàidewèi"}):
            with self.subTest(overrides=overrides):
                response = self.post_report(**overrides)
                self.assertEqual(response.status_code, 400)
        self.assertEqual(PolyphoneAnswer.objects.count(), 0)

    def test_report_is_post_only_and_guest_rows_carry_session_key(self):
        self.assertEqual(self.client.get("/hanzi/polyphones/api/report/").status_code, 405)
        self.post_report()
        self.post_report()
        guest_keys = {record.guest_key for record in PolyphoneAnswer.objects.all()}
        self.assertEqual(len(guest_keys), 1)
        self.assertTrue(next(iter(guest_keys)))
