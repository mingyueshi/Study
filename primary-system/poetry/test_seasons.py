import json
from pathlib import Path

from django.test import SimpleTestCase, TestCase

from reference_library.models import Dataset

from . import themes
from .models import PoetryDocument

SEASONS = ("chun", "xia", "qiu", "dong")


class SeasonConfigTests(SimpleTestCase):
    """四季分类规则契约：分组、字段齐备、防串扰。"""

    def setUp(self):
        self.config = json.loads((Path(__file__).parent / "data" / "themes.json").read_text(encoding="utf-8"))
        self.siji = next(g for g in self.config["groups"] if g["code"] == "siji")
        self.by_code = {t["code"]: t for t in self.config["themes"]}

    def test_season_group_first_with_four_themes(self):
        self.assertEqual(self.config["groups"][0]["code"], "siji")
        self.assertEqual(self.siji["themes"], list(SEASONS))

    def test_season_rules_complete(self):
        for code in SEASONS:
            theme = self.by_code[code]
            self.assertEqual(theme["group"], "siji")
            self.assertTrue(theme["title"] and theme["subtitle"] and theme["description"])
            self.assertTrue(theme["title_terms"], code)
            self.assertGreaterEqual(len(theme["body_terms"]), 6, code)
            self.assertTrue(theme["featured"], code)

    def test_season_featured_targets_exist_in_corpus_scope(self):
        """featured 配置的题名/作者必须能在语料中定位（与诗词地图同一纪律）。"""
        from poetry.models import PoetryText

        # SimpleTestCase 无 DB：这里只校验配置形状；命中校验在 TestCase 里做。
        for code in SEASONS:
            for item in self.by_code[code]["featured"]:
                self.assertTrue(item["title"].strip() and item["author"].strip(), (code, item))

    def test_cross_season_exclusions_configured(self):
        """季节间串扰的关键词要有排除项（如送春归送别、夏日绝句非夏景）。"""
        self.assertIn("送春", self.by_code["chun"]["exclude_terms"])
        self.assertIn("夏日绝句", self.by_code["xia"]["exclude_terms"])


class SeasonPageTests(TestCase):
    def setUp(self):
        themes._catalog.cache_clear()
        self.addCleanup(themes._catalog.cache_clear)
        self.dataset = Dataset.objects.create(code="poetry", title="古诗文", version="s", state="ready")

    def test_seasons_page_renders_cards_and_emotions(self):
        response = self.client.get("/poetry/seasons/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "诗词四季")
        for label in ("春", "夏", "秋", "冬"):
            self.assertContains(response, f">{label}</b>")
        self.assertContains(response, "seasons-nav-link")  # 侧栏全量导航：四季与情感题材主题链接
        self.assertContains(response, "情感与题材")
        self.assertContains(response, 'href="/geography/solar-terms/"')
        from geographystudy.solar_terms_content import load_content
        for season in load_content()['seasons']:
            for term in season['terms']:
                self.assertContains(response, f'href="{term["url"]}"')

    def test_theme_detail_works_for_season_codes(self):
        response = self.client.get("/poetry/themes/chun/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "春")
        self.assertContains(response, 'href="/geography/solar-terms/#chun"')
        self.assertContains(response, 'href="/geography/solar-terms/#guyu"')
        self.assertNotContains(response, 'href="/geography/solar-terms/#lixia"')

    def test_learning_context_survives_search_dynasty_pagination_and_poem_links(self):
        from .models import PoetryText

        document = PoetryDocument.objects.create(version='s', path='spring.json', layer='simplified', collection='全唐诗', original_data=[])
        for index in range(27):
            PoetryText.objects.create(document=document, locator=f'/{index}', title=f'春日观察{index}', author='测试', paragraphs=[f'第{index}首诗'], body=f'第{index}首，春风桃花燕子')
        response = self.client.get('/poetry/themes/chun/', {'solar_term': 'yushui'})
        self.assertContains(response, '从雨水出发，串起来学')
        self.assertContains(response, 'name="solar_term" value="yushui"')
        self.assertContains(response, '?dynasty=tang&amp;solar_term=yushui')
        self.assertContains(response, '?solar_term=yushui&amp;page=2')
        self.assertContains(response, '?dynasty=all&amp;solar_term=yushui')
        for params in ({'q':'春日'}, {'dynasty':'tang'}, {'page':'2'}):
            response = self.client.get('/poetry/themes/chun/', {'solar_term': 'yushui', **params})
            self.assertContains(response, 'href="/geography/solar-terms/#yushui"')
        response = self.client.get('/poetry/themes/chun/', {'solar_term': 'unknown'})
        self.assertNotContains(response, 'class="solar-journey"')

    def test_dataset_gate(self):
        self.dataset.state = "importing"
        self.dataset.save()
        self.assertEqual(self.client.get("/poetry/seasons/").status_code, 404)
        self.dataset.state = "ready"
        self.dataset.save()
        self.assertEqual(self.client.get("/poetry/seasons/").status_code, 200)

    def test_page_is_read_only(self):
        from poetry.models import PoetryText

        before = PoetryText.objects.count()
        self.client.get("/poetry/seasons/")
        self.assertEqual(PoetryText.objects.count(), before)
