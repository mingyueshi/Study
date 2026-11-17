from copy import deepcopy

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from .morphology import load_data, load_morphology_root, validate
from .tree import iter_words


class MorphologyDataTests(SimpleTestCase):
    def test_families_have_traceable_examples_and_stable_ids(self):
        root = load_morphology_root()
        words = list(iter_words([root]))
        self.assertEqual(root["family_count"], 24)
        self.assertEqual(root["total"], 96)
        self.assertEqual(len({word["morph_id"] for word in words}), 96)
        self.assertEqual(len({word["en"] for word in words}), 94)
        self.assertTrue(all(word["sources"] for word in words))

    def test_rejects_broken_spelling_focus_reference_and_example(self):
        changes = [
            lambda data: data.update(schema_version=2),
            lambda data: data["categories"][0].update(id=[]),
            lambda data: data["sources"][0].update(url="javascript:alert(1)"),
            lambda data: data["categories"][0]["families"][0].update(sources=["missing"]),
            lambda data: data["categories"][0]["families"][0]["words"][0].update(id="unstable"),
            lambda data: data["categories"][0]["families"][0]["words"][0]["parts"][0].update(text="xx"),
            lambda data: data["categories"][0]["families"][0]["words"][0]["parts"][0].update(kind="suffix"),
            lambda data: data["categories"][0]["families"][0]["words"][0]["parts"][0].update(kind=[]),
            lambda data: data["categories"][0]["families"][0]["words"][0]["example"].update(en="A different word."),
            lambda data: data["categories"][0]["families"][0]["words"][0].update(note='<script>bad</script>'),
        ]
        for change in changes:
            with self.subTest(change=change):
                data = deepcopy(load_data())
                change(data)
                with self.assertRaises(ImproperlyConfigured):
                    validate(data)

    def test_spelling_changes_and_multiple_family_membership_are_explicit(self):
        words = {word["morph_id"]: word for word in iter_words([load_morphology_root()])}
        self.assertEqual([part["text"] for part in words["suffix-ion-action"]["parts"]], ["act", "ion"])
        self.assertIn("y", words["suffix-ness-happiness"]["note"])
        self.assertIn("双写", words["suffix-er-runner"]["note"])
        self.assertEqual(words["root-phon-telephone"]["family_form"], "phon／phone")
        self.assertEqual(words["root-tele-telephone"]["family_form"], "tele-")
        self.assertEqual([part["text"] for part in words["root-phon-telephone"]["parts"] if part["focus"]], ["phone"])
        self.assertEqual([part["text"] for part in words["root-tele-telephone"]["parts"] if part["focus"]], ["tele"])


class MorphologyPageTests(SimpleTestCase):
    """构词数据独立于数据库，访客 GET 不需要场景词导入或创建会话。"""

    def test_index_is_available_without_database_queries(self):
        response = self.client.get("/words/tree/?root=morphology")
        self.assertContains(response, "24 个家族 · 96 条例词")
        self.assertContains(response, 'id="word-morphology-data"', count=1)
        self.assertContains(response, 'aria-current="page"', count=1)
        self.assertNotIn("sessionid", response.cookies)
        self.assertNotContains(response, "去场景页学会它")

    def test_branch_and_entry_deep_links_open_the_right_family(self):
        response = self.client.get("/words/tree/?branch=morph-suffix-ness")
        self.assertTrue(response.context["is_morphology"])
        self.assertFalse(response.context["is_spelling"])
        self.assertEqual(response.context["path_ids"], ["morphology", "morph-suffix", "morph-suffix-ness"])
        for entry, form in (("root-phon-telephone", "phon／phone"), ("root-tele-telephone", "tele-")):
            with self.subTest(entry=entry):
                response = self.client.get("/words/tree/", {"entry": entry})
                self.assertEqual(response.context["selected_word"]["morph_id"], entry)
                self.assertEqual(response.context["selected_word"]["family_form"], form)
                self.assertContains(response, 'aria-label="构词解析"')
                self.assertContains(response, '?q=telephone')

    def test_word_lookup_and_invalid_links_have_safe_fallbacks(self):
        response = self.client.get("/words/tree/?root=morphology&word=HAPPINESS")
        self.assertEqual(response.context["selected_word"]["morph_id"], "suffix-ness-happiness")
        for query in ("root=morphology&entry=unknown", "root=morphology&branch=unknown",
                      "root=spelling&entry=root-tele-telephone", "branch=spelling-at&entry=root-tele-telephone"):
            with self.subTest(query=query):
                response = self.client.get("/words/tree/?" + query)
                self.assertEqual(response.status_code, 200)
                self.assertFalse(response.context["is_spelling"] and response.context["is_morphology"])
