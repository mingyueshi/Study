import json
from pathlib import Path
import tempfile
import time
from unittest.mock import patch

from django.contrib.sessions.models import Session
from django.core import signing
from django.db import connection
from django.test import Client, TestCase, override_settings
from django.test.utils import CaptureQueriesContext

from reference_library.models import ArchivePackage, Dataset, SourceFile
from .models import FeihualingRound, PoetryDocument, PoetryText
from . import feihualing as game
from . import feihualing_index as index

PAGE = "/poetry/feihualing/"
API = PAGE + "api/action/"


class FeihualingTests(TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "corpus.json"
        self.setting = override_settings(
            FEIHUALING_CORPUS_PATH=self.path,
            FEIHUALING_INDEX_ROOT=self.path.parent / "indexes",
        )
        self.setting.enable()
        self.addCleanup(self.setting.disable)
        self.dataset = Dataset.objects.create(
            code="poetry", version="source-v1", state="ready"
        )
        self.document = PoetryDocument.objects.create(
            version="source-v1",
            path="poetry/test.json",
            sha256="a" * 64,
            layer="derived",
            collection="全唐诗",
            original_data={},
        )
        package = ArchivePackage.objects.create(
            name="fixture.zip", sha256="b" * 64, size=1
        )
        SourceFile.objects.create(
            package=package,
            path=self.document.path,
            sha256=self.document.sha256,
            size=1,
            storage_path=self.document.path,
        )
        self.paragraphs = [
            ("床前明月光，疑是地上霜。", "牀前明月光，疑是地上霜。"),
            ("举头望明月，低头思故乡。", "舉頭望明月，低頭思故鄉。"),
            ("明月松间照，清泉石上流。", "明月松間照，清泉石上流。"),
            ("海上生明月，天涯共此时。", "海上生明月，天涯共此時。"),
            ("月出惊山鸟，时鸣春涧中。", "月出驚山鳥，時鳴春澗中。"),
            ("江清月近人，野旷天低树。", "江清月近人，野曠天低樹。"),
            ("今人不见古时月，今月曾经照古人。", "今人不見古時月，今月曾經照古人。"),
            ("人有悲欢离合，月有阴晴圆缺。", "人有悲歡離合，月有陰晴圓缺。"),
            ("风雨，月明。", "風雨，月明。"),
        ]
        self.text = PoetryText.objects.create(
            document=self.document,
            locator="/0",
            title="测试选句",
            author="测试作者",
            paragraphs=[b for a, b in self.paragraphs],
            body="\n".join(b for a, b in self.paragraphs),
        )
        self.manifest = {
            "schema_version": 1,
            "version": "test-v1",
            "poems": [
                {
                    "id": "test-poem",
                    "title": "测试选句",
                    "author": "测试作者",
                    "source": {
                        "version": "source-v1",
                        "path": self.document.path,
                        "sha256": self.document.sha256,
                        "locator": "/0",
                    },
                    "paragraphs": [
                        {"text": a, "source_text": b} for a, b in self.paragraphs
                    ],
                }
            ],
        }
        self.write_manifest()

    def write_manifest(self):
        self.path.write_text(json.dumps(self.manifest, ensure_ascii=False))

    def post(self, action, token=None, **kwargs):
        return self.client.post(
            API,
            json.dumps({"action": action, "token": token, **kwargs}),
            content_type="application/json",
        )

    def start(self):
        response = self.post("new", keyword="月")
        self.assertEqual(response.status_code, 200)
        return response.json()

    def test_page_and_single_answer_do_not_write_session_or_database(self):
        with CaptureQueriesContext(connection) as queries:
            response = self.client.get(PAGE)
            state = response.context["state"]
            result = self.post("answer", state["token"], answer="床前明月光")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(result.json()["count"], 1)
        self.assertEqual(Session.objects.count(), 0)
        self.assertFalse(
            any(
                q["sql"]
                .lstrip()
                .upper()
                .startswith(("INSERT", "UPDATE", "DELETE", "REPLACE"))
                for q in queries
            )
        )
        self.assertContains(response, "提示学习")
        self.assertContains(response, "feihualing.js")

    def test_completed_round_writes_exactly_one_record(self):
        state = self.start()
        token = state["token"]
        for sentence in ("床前明月光", "举头望明月", "明月松间照", "海上生明月", "月出惊山鸟"):
            result = self.post("answer", token, answer=sentence).json()
            token = result["token"]
        self.assertEqual(result["status"], "completed")
        self.assertEqual(FeihualingRound.objects.count(), 1)
        round_ = FeihualingRound.objects.get()
        self.assertEqual(round_.keyword, "月")
        self.assertEqual(round_.independent, 5)
        self.assertEqual(round_.learning, 0)
        self.assertEqual(round_.result, FeihualingRound.Result.COMPLETED)
        self.assertIsNone(round_.user)
        self.assertTrue(round_.guest_key)
        # 已完成后再作答（outcome=finished）不会重复记。
        self.post("answer", token, answer="明月松间照")
        self.assertEqual(FeihualingRound.objects.count(), 1)

    def test_reveal_completed_round_counts_learning_sentences(self):
        state = self.start()
        token = state["token"]
        for sentence in ("床前明月光", "举头望明月", "明月松间照", "海上生明月"):
            result = self.post("answer", token, answer=sentence).json()
            token = result["token"]
        token = self.post("hint", token).json()["token"]  # reveal 前必须先借提示笺
        result = self.post("reveal", token).json()
        self.assertEqual(result["status"], "completed")
        round_ = FeihualingRound.objects.get()
        self.assertEqual((round_.independent, round_.learning), (4, 1))

    def test_logged_in_round_attaches_user(self):
        from django.contrib.auth import get_user_model
        user = get_user_model().objects.create_user("player", password="pass")
        self.client.force_login(user)
        state = self.start()
        token = state["token"]
        for sentence in ("床前明月光", "举头望明月", "明月松间照", "海上生明月", "月出惊山鸟"):
            result = self.post("answer", token, answer=sentence).json()
            token = result["token"]
        round_ = FeihualingRound.objects.get()
        self.assertEqual(round_.user, user)
        self.assertEqual(round_.guest_key, "")

    def test_punctuation_traditional_and_mixed_forms_are_exact(self):
        token = self.start()["token"]
        for value in [
            "床前明月光",
            "牀前明月光",
            "“牀 前明月光！”",
            "床前明月光，疑是地上霜。",
        ]:
            with self.subTest(value=value):
                result = self.post("answer", token, answer=value).json()
                self.assertEqual(result["outcome"], "accepted")
                self.assertEqual(result["count"], 1)
                self.assertEqual(
                    result["history"][0]["text"], "床前明月光，疑是地上霜。"
                )
                self.assertEqual(
                    result["history"][0]["url"], f"/poetry/{self.text.pk}/"
                )
        for value in [
            "床前明月",
            "床前明月光1",
            "床前#明月光",
            "床前明月光床前明月光",
            "床前明月亮",
        ]:
            with self.subTest(value=value):
                self.assertEqual(
                    self.post("answer", token, answer=value).json()["outcome"],
                    "unknown",
                )

    def test_whole_paragraph_consumes_both_keyword_lines_without_double_count(self):
        state = self.start()
        state = self.post(
            "answer", state["token"], answer="今人不见古时月，今月曾经照古人。"
        ).json()
        self.assertEqual(state["count"], 1)
        for line in [
            "今人不见古时月",
            "今月曾经照古人",
            "今人不見古時月，今月曾經照古人。",
        ]:
            result = self.post("answer", state["token"], answer=line).json()
            self.assertEqual(result["outcome"], "duplicate")
            self.assertEqual(result["count"], 1)

    def test_six_character_and_short_lyric_clauses_are_supported(self):
        token = self.start()["token"]
        for line in ["月有阴晴圆缺", "月明", "風雨，月明。"]:
            self.assertEqual(
                self.post("answer", token, answer=line).json()["outcome"], "accepted"
            )

    def test_missing_keyword_and_unknown_have_different_feedback(self):
        token = self.start()["token"]
        missing = self.post("answer", token, answer="疑是地上霜").json()
        unknown = self.post("answer", token, answer="月亮照着小书包").json()
        self.assertEqual(missing["outcome"], "missing_keyword")
        self.assertEqual(unknown["outcome"], "unknown")
        self.assertIn("暂未收录", unknown["message"])
        self.assertEqual(unknown["count"], 0)

    def test_hint_then_reveal_is_marked_learning_and_cannot_be_reused(self):
        state = self.start()
        self.assertEqual(self.post("reveal", state["token"]).status_code, 400)
        hint = self.post("hint", state["token"]).json()
        self.assertEqual(hint["count"], 0)
        self.assertIn("□", hint["hint"]["masked"])
        self.assertNotIn("text", hint["hint"])
        repeated = self.post("hint", hint["token"]).json()
        self.assertEqual(repeated["hint"], hint["hint"])
        revealed = self.post("reveal", hint["token"]).json()
        self.assertEqual(revealed["learning"], 1)
        self.assertEqual(revealed["independent"], 0)
        self.assertEqual(revealed["history"][0]["label"], "提示学习")
        self.assertEqual(
            self.post(
                "answer", revealed["token"], answer=revealed["history"][0]["text"]
            ).json()["outcome"],
            "duplicate",
        )
        # A retry of the same signed page state does not accumulate another answer.
        self.assertEqual(self.post("reveal", hint["token"]).json()["count"], 1)

    def test_completion_has_separate_counts_and_new_round_has_new_nonce(self):
        state = self.start()
        nonce = state["nonce"]
        for line in ["床前明月光", "举头望明月", "明月松间照", "海上生明月"]:
            state = self.post("answer", state["token"], answer=line).json()
        state = self.post("hint", state["token"]).json()
        state = self.post("reveal", state["token"]).json()
        self.assertEqual(
            (state["status"], state["count"], state["independent"], state["learning"]),
            ("completed", 5, 4, 1),
        )
        self.assertEqual(
            self.post("answer", state["token"], answer="月出惊山鸟").json()["count"], 5
        )
        new = self.start()
        self.assertNotEqual(new["nonce"], nonce)
        self.assertEqual(new["count"], 0)

    def test_fewer_than_five_lines_disables_keyword(self):
        state = self.start()
        flower = next(row for row in state["keywords"] if row["char"] == "花")
        self.assertFalse(flower["enabled"])
        self.assertEqual(self.post("new", keyword="花").status_code, 503)

    def test_custom_keyword_full_flow(self):
        """「明」不在预置令字库：运行时检索，五句可成局，整句键防重复。"""
        response = self.post("new", keyword="明")
        self.assertEqual(response.status_code, 200)
        state = response.json()
        self.assertEqual(state["keyword"], "明")
        self.assertFalse(any(row["char"] == "明" for row in state["keywords"]))
        token = state["token"]
        first = self.post("answer", token, answer="床前明月光").json()
        self.assertEqual(first["outcome"], "accepted")
        token = first["token"]
        duplicate = self.post("answer", token, answer="床前明月光").json()
        self.assertEqual(duplicate["outcome"], "duplicate")
        for line in ("明月松间照", "海上生明月", "举头望明月", "风雨，月明。"):
            state = self.post("answer", token, answer=line).json()
            self.assertEqual(state["outcome"], "accepted", (line, state.get("message")))
            token = state["token"]
        self.assertEqual(state["status"], "completed", state["message"])
        self.assertEqual(state["count"], 5)
        # 恢复签名态：自定义令字在 token 里原样往返。
        restored = self.post("hint", state["token"]).status_code
        self.assertEqual(restored, 200)

    def test_custom_keyword_rejects_invalid_and_uncovered(self):
        self.assertEqual(self.post("new", keyword="ab").status_code, 400)
        self.assertEqual(self.post("new", keyword="！").status_code, 400)
        self.assertEqual(self.post("new", keyword="猫").status_code, 503)

    def test_custom_keyword_hint_uses_runtime_search(self):
        state = self.post("new", keyword="明").json()
        self.post("answer", state["token"], answer="床前明月光")
        hint = self.post("hint", state["token"]).json()
        self.assertTrue(hint["hint"])
        self.assertNotIn("床前明月光", hint["hint"]["masked"])
        revealed = self.post("reveal", hint["token"]).json()
        self.assertEqual(revealed["outcome"], "revealed")

    def test_source_not_ready_overlay_and_document_drift(self):
        token = self.start()["token"]
        self.dataset.state = "pending"
        self.dataset.save()
        self.assertEqual(
            self.post("answer", token, answer="床前明月光").status_code, 503
        )
        self.assertFalse(self.client.get(PAGE).context["state"]["available"])
        self.dataset.state = "ready"
        self.dataset.save()
        self.manifest["poems"][0]["source"]["sha256"] = "c" * 64
        self.write_manifest()
        # Losing the preferred overlay never makes the underlying valid verse unavailable.
        self.assertTrue(self.client.get(PAGE).context["state"]["available"])
        self.assertEqual(self.post("hint", token).status_code, 409)
        self.document.sha256 = "d" * 64
        self.document.save(update_fields=["sha256"])
        self.assertFalse(self.client.get(PAGE).context["state"]["available"])

    def test_changing_live_source_rejects_cached_answer_hint_and_history(self):
        state = self.start()
        history = self.post("answer", state["token"], answer="床前明月光").json()
        hint = self.post("hint", state["token"]).json()
        PoetryText.objects.filter(pk=self.text.pk).update(
            body="正文变更", paragraphs=["正文变更。"]
        )
        self.assertEqual(
            self.post("answer", state["token"], answer="床前明月光").status_code, 409
        )
        self.assertEqual(self.post("reveal", hint["token"]).status_code, 409)
        self.assertEqual(self.post("hint", history["token"]).status_code, 409)

    def test_complete_sentence_and_fragment_boundaries(self):
        self.assertEqual(
            index.sentence_units("甲月，乙。丙月，丁！尾巴，"),
            (["甲月，乙。", "丙月，丁！"], 1),
        )
        self.assertEqual(
            index.sentence_units("山中人兮芳杜若，饮石泉兮荫松柏"),
            (["山中人兮芳杜若，饮石泉兮荫松柏"], 0),
        )
        self.assertFalse(index.readable("床前明月光（注），疑是地上霜。"))
        self.assertEqual(index.sentence_units("野火烧不尽，"), ([], 1))

    def test_keyword_must_be_in_submitted_clause(self):
        token = self.start()["token"]
        wrong = self.post("answer", token, answer="疑是地上霜").json()
        self.assertEqual((wrong["outcome"], wrong["count"]), ("missing_keyword", 0))
        right = self.post("answer", token, answer="床前明月光").json()
        self.assertEqual(right["history"][0]["text"], "床前明月光，疑是地上霜。")

    def test_index_is_reusable_rebuildable_and_atomic(self):
        token = self.start()["token"]
        path = index.index_path()
        self.assertTrue(path.is_file())
        with patch.object(
            index, "build", side_effect=AssertionError("warm request rebuilt")
        ):
            with CaptureQueriesContext(connection) as queries:
                response = self.post("answer", token, answer="床前明月光")
            self.assertEqual(response.json()["outcome"], "accepted")
            self.assertLessEqual(len(queries), 4)
        original = path.read_bytes()
        with patch.object(index.os, "replace", side_effect=OSError("failed swap")):
            with self.assertRaises(OSError):
                index.ensure_index(force=True)
        self.assertEqual(path.read_bytes(), original)
        self.assertFalse(list(path.parent.glob(".build-*")))
        path.write_bytes(b"invalid cache")
        self.assertEqual(
            self.post("answer", token, answer="床前明月光").json()["outcome"],
            "accepted",
        )
        with patch.dict(
            connection.settings_dict,
            {"NAME": str(self.path.parent / "another.sqlite3")},
        ):
            self.assertNotEqual(index.index_path(), path)

    def test_signature_expiry_tampering_and_manifest_change(self):
        token = self.start()["token"]
        self.assertEqual(self.post("hint", token + "x").status_code, 409)
        with patch(
            "django.core.signing.time.time", return_value=time.time() + game.MAX_AGE + 5
        ):
            expired = self.post("hint", token)
        self.assertEqual(expired.status_code, 409)
        self.assertIn("过期", expired.json()["error"])
        self.manifest["version"] = "test-v2"
        self.write_manifest()
        self.assertEqual(self.post("hint", token).status_code, 409)

    def test_bad_input_types_lengths_unknown_action_and_signed_shapes(self):
        token = self.start()["token"]
        for value in [None, False, 1, [], {}, "", "月" * 101]:
            self.assertEqual(self.post("answer", token, answer=value).status_code, 400)
        for keyword in [None, [], {}, False, "月月"]:
            self.assertEqual(self.post("new", keyword=keyword).status_code, 400)
        # 「風」是合法的自定义汉字（繁体），语料为简体、覆盖不足 → 503 如实拒绝。
        self.assertEqual(self.post("new", keyword="風").status_code, 503)
        self.assertEqual(self.post("other", token).status_code, 400)
        self.assertEqual(self.client.get(API).status_code, 405)
        self.assertEqual(
            self.client.post(API, "[]", content_type="application/json").status_code,
            400,
        )
        self.assertEqual(
            self.client.post(API, "{", content_type="application/json").status_code, 400
        )
        with game.load_corpus() as corpus:
            state = game.fresh(corpus)
        state["history"] = [{"key": [], "mode": "independent"}]
        bad = signing.dumps(state, salt=game.SALT)
        self.assertEqual(self.post("hint", bad).status_code, 409)

    def test_csrf_is_enforced_and_cookie_is_issued_without_session(self):
        client = Client(enforce_csrf_checks=True)
        page = client.get(PAGE)
        data = json.dumps({"action": "new", "keyword": "月"})
        self.assertEqual(
            client.post(API, data, content_type="application/json").status_code, 403
        )
        cookie = client.cookies["primary_csrftoken"].value
        self.assertEqual(
            client.post(
                API, data, content_type="application/json", HTTP_X_CSRFTOKEN=cookie
            ).status_code,
            200,
        )
        self.assertEqual(Session.objects.count(), 0)
