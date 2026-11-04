from django.test import SimpleTestCase, TestCase
from django.db import connection
from django.test.utils import CaptureQueriesContext
from reference_library.models import Dataset
from .importing import parse_document
from .models import PoetryDocument, PoetryText


class PoetryParserTests(SimpleTestCase):
    def test_nested_anthology_preserves_subchapter_and_positions(self):
        value = {
            "title": "千家詩",
            "content": [
                {
                    "type": "七言",
                    "content": [
                        {
                            "chapter": "雪梅",
                            "content": [
                                {"subchapter": "一", "paragraphs": ["原文甲"]},
                                {"subchapter": "二", "paragraphs": ["異文乙"]},
                            ],
                        }
                    ],
                }
            ],
        }
        texts, nodes = parse_document(value)
        self.assertEqual(len(texts), 2)
        self.assertEqual(texts[0]["heading_path"], ["千家詩", "七言", "雪梅", "一"])
        self.assertEqual(texts[1]["heading_path"][-1], "二")
        self.assertEqual(texts[0]["source_data"]["subchapter"], "一")
        self.assertEqual(texts[0]["title"], "雪梅 · 一")
        self.assertEqual(texts[1]["locator"], "/content/0/content/0/content/1")
        self.assertEqual(nodes[-1]["position"], 1)

    def test_chapter_section_and_original_index_preserved(self):
        value = [
            {
                "chapter": "國風",
                "section": "周南",
                "title": "關雎",
                "source_record_index": 12,
                "content": ["甲", "乙"],
            }
        ]
        texts, nodes = parse_document(value)
        self.assertEqual(texts[0]["heading_path"], ["國風", "周南", "關雎"])
        self.assertEqual(texts[0]["body"], "甲\n乙")
        self.assertEqual(texts[0]["original_index"], 12)
        self.assertEqual(nodes[0]["source_data"]["section"], "周南")


class PoetryViewTests(TestCase):
    def setUp(self):
        Dataset.objects.create(code="poetry", state="ready")
        self.doc = PoetryDocument.objects.create(
            path="poetry/raw/蒙学/qianziwen.json",
            sha256="a" * 64,
            layer="raw",
            collection="蒙学",
            original_data={"huge": "Z" * 100000},
        )
        self.text = PoetryText.objects.create(
            document=self.doc,
            locator="/",
            title="千字文",
            paragraphs=["天地玄黃"],
            body="天地玄黃",
            source_data={"spells": ["tiān dì xuán huáng"], "section": "來源分部"},
        )

    def test_list_does_not_load_original_document_json(self):
        with CaptureQueriesContext(connection) as captured:
            response = self.client.get("/poetry/?layer=raw")
        self.assertEqual(response.status_code, 200)
        selects = [
            query["sql"]
            for query in captured.captured_queries
            if "poetry_poetrytext" in query["sql"] and "SELECT" in query["sql"]
        ]
        self.assertTrue(selects)
        self.assertFalse(any("original_data" in query for query in selects))
        row = list(response.context["page"])[0]
        self.assertIn("original_data", row.document.get_deferred_fields())

    def test_detail_displays_supplied_pinyin_and_metadata(self):
        response = self.client.get(f"/poetry/{self.text.pk}/")
        self.assertContains(response, "tiān dì xuán huáng")
        self.assertContains(response, "來源分部")
        self.assertContains(response, "原文，不是已经选定")
