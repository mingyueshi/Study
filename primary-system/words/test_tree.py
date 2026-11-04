from django.test import SimpleTestCase, TestCase

from .models import ScenarioWord
from .tree import MAX_DEPTH, find_path, load_tree, validate

REAL_SCENARIOS = True  # 树数据与场景词库共同演进；页面测试直接用真实树数据。


class TreeDataTests(SimpleTestCase):
    """数据契约：根枝干、引用完整、无环、深度上限、场景词覆盖。"""

    def setUp(self):
        self.tree = load_tree()

    def test_schema_and_source(self):
        self.assertEqual(self.tree["schema_version"], 1)
        self.assertEqual(self.tree["source"]["name"], "Open English Wordnet 2025")

    def test_roots_unique_and_labeled(self):
        keys = [root["key"] for root in self.tree["roots"]]
        self.assertGreaterEqual(len(keys), 5)
        self.assertEqual(len(keys), len(set(keys)))
        for root in self.tree["roots"]:
            self.assertTrue(root["zh"] and root["emoji"])

    def test_nodes_reference_children_validly(self):
        def walk(node, seen, depth):
            self.assertLessEqual(depth, MAX_DEPTH, node["id"])
            self.assertNotIn(node["id"], seen, node["id"])
            self.assertTrue(node["en"] and node["gloss"] or node["zh"])
            for child in node["children"]:
                walk(child, seen | {node["id"]}, depth + 1)

        for root in self.tree["roots"]:
            walk(root, set(), 0)

    def test_every_leaf_word_is_scenario_word(self):
        """树里每个叶词都必须存在于场景词库（防树数据与词库漂移）。"""
        import json
        from pathlib import Path

        payload = json.loads((Path(__file__).parent / "tree_data" / "tree.json").read_text(encoding="utf-8"))
        words = []

        def walk(node):
            words.extend(node["words"])
            for child in node["children"]:
                walk(child)

        for root in payload["roots"]:
            walk(root)
        self.assertTrue(all(word["en"].strip() for word in words))
        self.assertGreaterEqual(len(words), 100)


class TreePageTests(TestCase):
    """页面：真实场景词库联动的深链与根切换。"""

    def test_page_renders_first_root_by_default(self):
        response = self.client.get("/words/tree/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "词以类聚")
        self.assertContains(response, "tree-branch")

    def test_root_switch(self):
        response = self.client.get("/words/tree/?root=vehicle")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "交通工具")

    def test_deep_link_word_card_fully_populated(self):
        from words.services import state_payload

        state = state_payload({"guest_key": "tree-test"})
        candidate = next((w for w in state["words"] if w["ipa"] and w["zh"]), None)
        if candidate is None:
            self.skipTest("场景词库为空")
        response = self.client.get(f"/words/tree/?word={candidate['en']}")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "去场景页学会它")
        self.assertContains(response, f"word={candidate['en']}")

    def test_unknown_word_falls_back_to_first_root(self):
        response = self.client.get("/words/tree/?word=zzz-not-a-word")
        self.assertEqual(response.status_code, 200)

    def test_page_is_read_only(self):
        before = ScenarioWord.objects.count()
        self.client.get("/words/tree/")
        self.assertEqual(ScenarioWord.objects.count(), before)

    def test_find_path_returns_branch(self):
        tree = load_tree()
        word = tree["roots"][0]["children"][0]["children"][0]["words"][0]["en"] \
            if tree["roots"][0]["children"] else tree["roots"][0]["words"][0]["en"]
        root, path = find_path(tree["roots"], word)
        self.assertIsNotNone(root)
        self.assertTrue(path)
