"""成语小游戏学习记录（idioms.models.PlayRecord）的写入测试。

覆盖：quiz 上报端点的校验与双轨归属；配对与表情一局完成时由 action
服务端落库恰好一次；游客数据挂会话键且只发生在 POST 写入路径。
"""
import json
from pathlib import Path
import uuid

from django.contrib.sessions.models import Session
from django.test import TestCase

from lexicon.models import LexicalEntry, LexiconSource, Pronunciation, Sense, SourceBinding, \
    SourceRecord, SourceRelease

from .catalog import SOURCE_CODE
from .models import PlayRecord

PAIRS = json.loads((Path(__file__).parent / "data" / "pairs.json").read_text(encoding="utf-8"))

GOOD_IDIOMS = {
    "画蛇添足": "比喻做多余的事，反而弄巧成拙，把好事办坏。",
    "守株待兔": "比喻不主动努力，妄想靠运气不劳而获。",
    "井底之蛙": "比喻见识短浅、眼界狭窄的人。",
}


def build_lexicon_fixture(source, release, rows):
    """按 (headword, definition) 复刻词库生效记录，供题池与钉词校验使用。"""
    for headword, definition in rows:
        entry = LexicalEntry.objects.create(id=uuid.uuid4(), language="zh", kind="idiom", headword=headword)
        sense = Sense.objects.create(id=uuid.uuid4(), entry=entry)
        pronunciation = Pronunciation.objects.create(id=uuid.uuid4(), entry=entry, system="pinyin")
        binding = SourceBinding.objects.create(id=uuid.uuid4(), source=source, sense=sense,
                                               pronunciation=pronunciation,
                                               external_key="test-" + headword)
        SourceRecord.objects.create(id=uuid.uuid4(), release=release, binding=binding,
                                    headword=headword, definition=definition,
                                    lexical_hash="hash-" + headword, properties={})


class QuizReportTests(TestCase):
    """看释义猜成语逐题上报：对错都记、校验拒绝、双轨归属。"""

    @classmethod
    def setUpTestData(cls):
        cls.source = LexiconSource.objects.get_or_create(
            code=SOURCE_CODE, defaults={"name": "成语测试", "url": "x-test:"})[0]
        cls.release = SourceRelease.objects.create(
            source=cls.source, version="records-quiz-test", status=SourceRelease.Status.READY)
        LexiconSource.objects.filter(pk=cls.source.pk).update(active_release=cls.release)
        build_lexicon_fixture(cls.source, cls.release, sorted(GOOD_IDIOMS.items()))

    def setUp(self):
        from .quiz import char_bank, question_pool
        question_pool.cache_clear()
        char_bank.cache_clear()

    def post_report(self, **overrides):
        payload = {"headword": "守株待兔", "level": 3, "source": "common",
                   "correct": True, "used_hint": False}
        payload.update(overrides)
        return self.client.post("/idioms/quiz/api/report/", payload, content_type="application/json")

    def test_valid_report_records_one_row(self):
        response = self.post_report(correct=False, used_hint=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"ok": True})
        record = PlayRecord.objects.get()
        self.assertEqual(record.game, PlayRecord.Game.QUIZ)
        self.assertEqual((record.size, record.correct), (1, 0))
        self.assertEqual(record.extra["headword"], "守株待兔")
        self.assertTrue(record.extra["used_hint"])

    def test_report_rejects_unknown_headword_and_bad_types(self):
        for overrides in ({"headword": "不存在的成语"}, {"level": "3"}, {"level": 9},
                          {"source": "bogus"}, {"correct": "yes"}, {"used_hint": 1}):
            with self.subTest(overrides=overrides):
                response = self.post_report(**overrides)
                self.assertEqual(response.status_code, 400)
        self.assertEqual(PlayRecord.objects.count(), 0)

    def test_report_is_post_only(self):
        self.assertEqual(self.client.get("/idioms/quiz/api/report/").status_code, 405)
        self.assertEqual(PlayRecord.objects.count(), 0)

    def test_guest_reports_share_one_session_key(self):
        self.post_report()
        self.post_report()
        self.assertEqual(PlayRecord.objects.count(), 2)
        guest_keys = {record.guest_key for record in PlayRecord.objects.all()}
        self.assertEqual(len(guest_keys), 1)
        self.assertTrue(next(iter(guest_keys)))
        self.assertEqual(Session.objects.count(), 1)

    def test_logged_in_report_attaches_user_without_new_session(self):
        from django.contrib.auth import get_user_model
        user = get_user_model().objects.create_user("player", password="pass")
        self.client.force_login(user)
        sessions_before = Session.objects.count()  # force_login 自带一条会话
        self.post_report()
        record = PlayRecord.objects.get()
        self.assertEqual(record.user, user)
        self.assertEqual(record.guest_key, "")
        self.assertEqual(Session.objects.count(), sessions_before)


class EmojiFinishRecordTests(TestCase):
    """表情猜猜看：一局猜满由服务端在 answer/reveal 后落一条记录。"""

    @classmethod
    def setUpTestData(cls):
        from .test_emoji import ENTRIES
        cls.source = LexiconSource.objects.get_or_create(
            code=SOURCE_CODE, defaults={"name": "成语测试", "url": "x-test:"})[0]
        cls.release = SourceRelease.objects.create(
            source=cls.source, version="records-emoji-test", status=SourceRelease.Status.READY)
        LexiconSource.objects.filter(pk=cls.source.pk).update(active_release=cls.release)
        for story in ENTRIES["entries"][:3]:
            entry = LexicalEntry.objects.create(id=uuid.UUID(story["entry_id"]), language="zh",
                                                kind="idiom", headword=story["headword"])
            sense = Sense.objects.create(id=uuid.UUID(story["sense_id"]), entry=entry)
            pronunciation = Pronunciation.objects.create(id=uuid.UUID(story["pronunciation_id"]),
                                                         entry=entry, system="pinyin")
            binding = SourceBinding.objects.create(id=uuid.UUID(story["binding_id"]), source=cls.source,
                                                   sense=sense, pronunciation=pronunciation,
                                                   external_key=story["source_key"])
            SourceRecord.objects.create(id=uuid.UUID(story["evidence_id"]), release=cls.release,
                                        binding=binding, headword=story["headword"],
                                        definition="测试释义", lexical_hash=story["lexical_hash"],
                                        properties={"derivation": "测试出处"})

    def setUp(self):
        from .emoji import quiz_pool
        quiz_pool.cache_clear()

    def test_finished_round_writes_exactly_one_record(self):
        client = self.client
        token = client.post("/idioms/emoji/api/action/", {"action": "new"},
                            content_type="application/json").json()["token"]
        size = None
        for index in range(8):
            question = client.post("/idioms/emoji/api/action/",
                                   {"action": "question", "token": token, "index": index},
                                   content_type="application/json").json()
            result = client.post("/idioms/emoji/api/action/",
                                 {"action": "answer", "token": token, "chosen": question["current"]["options"][0]["text"]},
                                 content_type="application/json").json()
            token = result["token"]
            size = result["size"]
            if result["finished"]:
                break
        self.assertTrue(result["finished"])
        record = PlayRecord.objects.get()
        self.assertEqual(record.game, PlayRecord.Game.EMOJI)
        self.assertEqual(record.size, size)
        self.assertEqual(record.correct, result["correct"])
        self.assertEqual(record.extra["revealed"], result["revealed"])
        # 已完成后再请求不会重复落库。
        client.post("/idioms/emoji/api/action/", {"action": "question", "token": token, "index": 0},
                    content_type="application/json")
        self.assertEqual(PlayRecord.objects.count(), 1)


class PairsFinishRecordTests(TestCase):
    """成语配对：一局配满由服务端在 match 后落一条记录。"""

    @classmethod
    def setUpTestData(cls):
        cls.source = LexiconSource.objects.get_or_create(
            code=SOURCE_CODE, defaults={"name": "成语测试", "url": "x-test:"})[0]
        cls.release = SourceRelease.objects.create(
            source=cls.source, version="records-pairs-test", status=SourceRelease.Status.READY)
        LexiconSource.objects.filter(pk=cls.source.pk).update(active_release=cls.release)
        # 一局要 5 对词头不相交：复刻前 5 对的双侧钉词记录。
        for pair in PAIRS["pairs"][:5]:
            for side in ("a", "b"):
                entry = LexicalEntry.objects.create(id=uuid.UUID(pair[f"{side}_entry_id"]), language="zh",
                                                    kind="idiom", headword=pair[f"headword_{side}"])
                sense = Sense.objects.create(id=uuid.UUID(pair[f"{side}_sense_id"]), entry=entry)
                pronunciation = Pronunciation.objects.create(id=uuid.UUID(pair[f"{side}_pronunciation_id"]),
                                                             entry=entry, system="pinyin")
                binding = SourceBinding.objects.create(id=uuid.UUID(pair[f"{side}_binding_id"]), source=cls.source,
                                                       sense=sense, pronunciation=pronunciation,
                                                       external_key=pair[f"{side}_source_key"])
                SourceRecord.objects.create(id=uuid.UUID(pair[f"{side}_evidence_id"]), release=cls.release,
                                            binding=binding, headword=pair[f"headword_{side}"],
                                            definition="测试释义", lexical_hash=pair[f"{side}_lexical_hash"],
                                            properties={"derivation": "测试出处"})

    def setUp(self):
        from .pairs import pairs_pool
        pairs_pool.cache_clear()

    def test_finished_round_writes_one_record_with_attempts(self):
        client = self.client
        state = client.post("/idioms/pairs/api/action/", {"action": "new"},
                            content_type="application/json").json()
        token = state["token"]
        for _ in range(60):
            left = state["tiles"]["left"][0]
            for right in list(state["tiles"]["right"]):
                result = client.post("/idioms/pairs/api/action/",
                                     {"action": "match", "token": token, "left": left, "right": right},
                                     content_type="application/json").json()
                token = result["token"]  # 未命中也是一次尝试，token 随响应更新。
                if result.get("matched_pair"):
                    state = result
                    break
            else:
                self.fail("右侧没有可配对的成语，夹具或判定路径异常。")
            if state["finished"]:
                break
        self.assertTrue(state["finished"])
        record = PlayRecord.objects.get()
        self.assertEqual(record.game, PlayRecord.Game.PAIRS)
        self.assertEqual((record.size, record.correct), (5, 5))
        self.assertGreater(record.extra["attempts"], 0)
        self.assertEqual(PlayRecord.objects.count(), 1)
