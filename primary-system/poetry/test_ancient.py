"""古文经典（ancient-classics）来源登记与解析契约测试。

覆盖：62 册 collection 映射完整性、与既有诗词 collection 的隔离（详情页
按 collection+locator 配对，重名会串册）、canonical 树规范化规则、以及
parse_document 对规范化产物的解析结果。导入器计数常量与来源登记的一致性
一并钉死，防止单边改动造成导入守卫漂移。
"""

from django.test import SimpleTestCase

from poetry.ancient_importing import ANCIENT_FILES, MARKER, VERSION
from poetry.ancient_sources import BOOK_COUNT, book_collection, normalize
from poetry.importing import parse_document

UPSTREAM_COMMIT = "01a1183cd9bbc243bb156967043c32b6685c0d2f"
# 既有诗词管线（poetry.importing）登记的 collection；古文经典不得复用。
EXISTING_COLLECTIONS = {"全唐诗", "宋词", "诗经", "楚辞", "蒙学"}


class AncientSourceTests(SimpleTestCase):
    def test_collection_mapping_complete_and_fresh(self):
        mapping = book_collection()
        self.assertEqual(len(mapping), BOOK_COUNT)
        self.assertFalse(EXISTING_COLLECTIONS & set(mapping.values()))

    def test_normalize_single_article_uses_book_title(self):
        tree = normalize(
            {
                "name": "三字经",
                "description": "三大国学启蒙读物之一",
                "articles": [{"title": "全文", "content": ["人之初，性本善。"]}],
            },
            "三字经",
        )
        self.assertEqual(tree["title"], "三字经")
        self.assertEqual(tree["description"], "三大国学启蒙读物之一")
        self.assertEqual(tree["content"], [{"title": "三字经", "content": ["人之初，性本善。"]}])

    def test_normalize_keeps_distinct_article_titles(self):
        tree = normalize(
            {
                "name": "论语",
                "articles": [
                    {"title": "学而篇", "content": "子曰：学而时习之。"},
                    {"title": "为政篇", "content": ["子曰：为政以德。"]},
                ],
            },
            "论语",
        )
        self.assertEqual([row["title"] for row in tree["content"]], ["学而篇", "为政篇"])
        # 单字符串正文视为一段
        self.assertEqual(tree["content"][0]["content"], ["子曰：学而时习之。"])

    def test_normalize_rejects_bad_articles(self):
        with self.assertRaises(ValueError):
            normalize({"name": "残卷", "articles": []}, "残卷")
        with self.assertRaises(ValueError):
            normalize(
                {"name": "残卷", "articles": [{"title": "a", "content": [1, 2]}]}, "残卷"
            )
        with self.assertRaises(ValueError):
            normalize(
                {"name": "残卷", "articles": [{"title": "a", "content": ["", "  "]}]},
                "残卷",
            )

    def test_parse_document_canonical_tree(self):
        tree = {
            "title": "论语",
            "description": "d",
            "content": [
                {"title": "学而篇", "content": ["子曰：学而时习之。", "有朋自远方来。"]}
            ],
        }
        texts, nodes = parse_document(tree)
        self.assertEqual(len(texts), 1)
        row = texts[0]
        self.assertEqual(row["title"], "学而篇")
        # heading_path 含书名与篇名全链（parse_document 通用规则）
        self.assertEqual(row["heading_path"], ["论语", "学而篇"])
        self.assertEqual(row["locator"], "/content/0")
        self.assertEqual(row["paragraphs"], ["子曰：学而时习之。", "有朋自远方来。"])
        self.assertEqual(row["body"], "子曰：学而时习之。\n有朋自远方来。")
        kinds = {node["locator"]: node["kind"] for node in nodes}
        self.assertEqual(kinds["/"], "group")
        self.assertEqual(kinds["/content/0"], "text")


class AncientImportContractTests(SimpleTestCase):
    def test_importer_constants_match_source_registry(self):
        mapping = book_collection()
        self.assertEqual(ANCIENT_FILES, len(mapping))
        self.assertEqual(MARKER, "ancient_text/source_selection.json")
        self.assertEqual(VERSION, f"{UPSTREAM_COMMIT}+native")

    def test_importer_marker_suffix_stays_distinct(self):
        # 旧诗词导入器以 "poetry/source_selection.json" 结尾定位；
        # 本数据集标记必须保持独立后缀，否则 locate 计数互相污染。
        self.assertFalse(MARKER.endswith("poetry/source_selection.json"))
