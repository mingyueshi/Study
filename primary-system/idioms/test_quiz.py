import random

from django.test import TestCase

from lexicon.models import LexicalEntry, LexiconSource, Pronunciation, Sense, SourceBinding, \
    SourceRecord, SourceRelease

from .catalog import SOURCE_CODE
from .quiz import LEVEL_LABELS, build_round, char_bank, question_pool

GOOD_IDIOMS = {
    "画蛇添足": "比喻做多余的事，反而弄巧成拙，把好事办坏。",
    "守株待兔": "比喻不主动努力，妄想靠运气不劳而获。",
    "井底之蛙": "比喻见识短浅、眼界狭窄的人。",
}


class QuizPoolTests(TestCase):
    """题池契约：四字成语、释义合格、不泄漏词头；出题与提示位正确。"""

    @classmethod
    def setUpTestData(cls):
        cls.source = LexiconSource.objects.get_or_create(
            code=SOURCE_CODE, defaults={"name": "成语测试", "url": "x-test:"})[0]
        cls.release = SourceRelease.objects.create(
            source=cls.source, version="quiz-test", status=SourceRelease.Status.READY)
        LexiconSource.objects.filter(pk=cls.source.pk).update(active_release=cls.release)
        items = dict(GOOD_IDIOMS)
        items["画龙点睛"] = "画龙点睛比喻在关键处加上精辟语句。"  # 释义泄漏词头 → 弃用
        items["一心一意"] = "很好。"  # 释义太短 → 弃用
        for headword, definition in items.items():
            entry = LexicalEntry.objects.create(language="zh", kind="idiom", headword=headword)
            sense = Sense.objects.create(entry=entry)
            pronunciation = Pronunciation.objects.create(entry=entry, system="pinyin")
            binding = SourceBinding.objects.create(
                source=cls.source, sense=sense, pronunciation=pronunciation,
                external_key="test-" + headword)
            SourceRecord.objects.create(
                release=cls.release, binding=binding, headword=headword,
                definition=definition, lexical_hash="hash-" + headword, properties={})
        cls.pool = question_pool()

    def test_pool_keeps_only_clean_idioms(self):
        self.assertEqual(set(self.pool), set(GOOD_IDIOMS))
        for item in self.pool.values():
            self.assertEqual(len(item["headword"]), 4)
            self.assertGreaterEqual(len(item["definition"]), 8)
            self.assertNotIn(item["headword"], item["definition"])
            self.assertIn("entry_id", item)

    def test_char_bank_covers_headwords(self):
        bank = set(char_bank())
        self.assertTrue({char for headword in GOOD_IDIOMS for char in headword} <= bank)

    def test_round_levels_control_blanks(self):
        items = list(self.pool.values())
        rng = random.Random("quiz")
        for level, blanks in ((3, 1), (2, 2), (1, 3), (0, 4)):
            round_ = build_round(random.Random("quiz"), items, level)
            empty = [slot for slot in round_["slots"] if not slot["shown"]]
            shown = [slot for slot in round_["slots"] if slot["shown"]]
            self.assertEqual(len(empty), blanks, (level, round_["headword"]))
            self.assertEqual(len(shown), 4 - blanks)
            for slot in shown:
                self.assertIn(slot["shown"], round_["headword"])
            answers = {slot["answer"] for slot in empty}
            self.assertTrue(answers <= set(round_["keys"]))
            self.assertLessEqual(len(round_["keys"]), len(answers) + 8)

    def test_hint_chars_match_headword(self):
        items = list(self.pool.values())
        for seed in ("a", "b", "c"):
            round_ = build_round(random.Random(seed), items, 2)
            for slot in round_["slots"]:
                if slot["shown"]:
                    self.assertIn(slot["shown"], round_["headword"])

    def test_seeded_round_is_reproducible(self):
        items = list(self.pool.values())
        first = build_round(random.Random("seed-x"), items, 2)
        second = build_round(random.Random("seed-x"), items, 2)
        self.assertEqual(first["headword"], second["headword"])
        self.assertEqual([s["answer"] for s in first["slots"]], [s["answer"] for s in second["slots"]])
        self.assertEqual(first["keys"], second["keys"])

    def test_level_labels_cover_all_levels(self):
        self.assertEqual(set(LEVEL_LABELS), {0, 1, 2, 3})


class QuizPageTests(TestCase):
    """页面：默认渲染、级别空位数、参数回退与只读保证。"""

    @classmethod
    def setUpTestData(cls):
        QuizPoolTests.setUpTestData()

    def test_page_renders_board(self):
        response = self.client.get("/idioms/quiz/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "看释义猜成语")
        self.assertContains(response, "quiz-slot")
        self.assertContains(response, "data-quiz-key")
        self.assertContains(response, "检查")
        self.assertContains(response, "quiz-result")

    def test_level_controls_blank_count(self):
        easy = self.client.get("/idioms/quiz/?level=3&seed=page1")
        self.assertEqual(easy.status_code, 200)
        self.assertEqual(easy.content.decode().count("data-quiz-slot"), 1)
        hard = self.client.get("/idioms/quiz/?level=0&seed=page1")
        self.assertEqual(hard.content.decode().count("data-quiz-slot"), 4)

    def test_invalid_level_falls_back(self):
        response = self.client.get("/idioms/quiz/?level=9")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content.decode().count("data-quiz-slot"), 1)

    def test_source_all_uses_full_pool(self):
        response = self.client.get("/idioms/quiz/?source=all&seed=page1")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "data-quiz-key")

    def test_seeded_page_is_reproducible(self):
        first = self.client.get("/idioms/quiz/?seed=same&source=all")
        second = self.client.get("/idioms/quiz/?seed=same&source=all")
        self.assertEqual(first.context["round"]["headword"], second.context["round"]["headword"])

    def test_page_is_read_only(self):
        before = SourceRecord.objects.count()
        self.client.get("/idioms/quiz/")
        self.assertEqual(SourceRecord.objects.count(), before)
