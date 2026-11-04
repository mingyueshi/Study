from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, TestCase

from reference_library.models import Dataset

from .map import load_places, load_projection, place_panels, resolve_links, validate
from .models import PoetryDocument, PoetryText


class MapDataTests(SimpleTestCase):
    """数据契约：地点、坐标、诗篇链接与代表诗唯一性。"""

    def setUp(self):
        self.curriculum = load_places()

    def test_schema_and_source(self):
        self.assertEqual(self.curriculum["schema_version"], 1)
        self.assertEqual(self.curriculum["source_code"], "primary-poetry-map")

    def test_places_complete_and_unique(self):
        ids = [p["id"] for p in self.curriculum["places"]]
        self.assertGreaterEqual(len(ids), 10)
        self.assertEqual(len(ids), len(set(ids)))
        for place in self.curriculum["places"]:
            self.assertTrue(place["name"] and place["city"] and place["blurb"])
            self.assertTrue(15 <= place["lat"] <= 55 and 70 <= place["lng"] <= 140)

    def test_links_reference_places_with_single_featured(self):
        ids = {p["id"] for p in self.curriculum["places"]}
        featured = {}
        for link in self.curriculum["links"]:
            self.assertIn(link["place_id"], ids)
            self.assertTrue(link["title"] and link["author"] and link["note"])
            if link.get("featured"):
                self.assertNotIn(link["place_id"], featured)
                featured[link["place_id"]] = True
        self.assertEqual(set(featured), ids)  # 每个地点恰一首代表诗

    def test_validate_rejects_drift(self):
        with self.assertRaises(ImproperlyConfigured):
            validate({"schema_version": 2, "source_code": "primary-poetry-map", "places": [], "links": []})
        curriculum = load_places()
        curriculum["links"][0]["featured"] = True
        curriculum["links"][1]["featured"] = True
        curriculum["links"][1]["place_id"] = curriculum["links"][0]["place_id"]
        with self.assertRaises(ImproperlyConfigured):
            validate(curriculum)


class ProjectionTests(SimpleTestCase):
    def test_projection_params_match_svg_frame(self):
        params = load_projection()
        self.assertEqual(params["projection"], "albers-equal-area-conic")
        self.assertGreater(params["width"], 0)
        self.assertGreater(params["height"], 0)

    def test_markers_land_inside_viewbox(self):
        from .map import _project_albers

        params = load_projection()
        for place in load_places()["places"]:
            x, y = _project_albers(place["lng"], place["lat"], params)
            self.assertTrue(0 <= x <= params["width"], place["id"])
            self.assertTrue(0 <= y <= params["height"], place["id"])


class MapPageTests(TestCase):
    """页面与解析：夹具语料中能定位的诗出跳转，其余如实降级。"""

    @classmethod
    def setUpTestData(cls):
        cls.dataset = Dataset.objects.create(code="poetry", title="古诗文测试", version="map-test", state="ready")
        cls.document = PoetryDocument.objects.create(
            version="map-test", path="poetry/simplified/蒙学/qianjiashi.json",
            sha256="a" * 64, layer="simplified", collection="蒙学", original_data={},
        )
        cls.guanquelou = PoetryText.objects.create(
            document=cls.document, locator="/0/0", original_index=0,
            title="登鹳雀楼", author="王之涣", paragraphs=["白日依山尽，黄河入海流。"], body="白日依山尽，黄河入海流。",
        )

    def test_place_panels_resolve_featured_only_from_corpus(self):
        panels = {p["id"]: p for p in place_panels()}
        self.assertEqual(panels["guanquelou"]["featured"]["pk"], self.guanquelou.pk)
        # 测试库没有其余语料：其他诗篇如实降级，不猜不换来源。
        missing = [p for p in panels.values() if p["featured"] is None or (p["featured"] or {}).get("pk") is None]
        self.assertTrue(all(p["featured"] is None for p in panels.values() if p["id"] != "guanquelou"))
        self.assertFalse(missing and any(m["featured"] for m in missing))

    def test_page_renders_map_search_and_selected_place(self):
        response = self.client.get("/poetry/map/?place=guanquelou")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "诗词地图")
        self.assertContains(response, "map-search")
        self.assertContains(response, "map-marker")
        self.assertContains(response, "登鹳雀楼")
        self.assertContains(response, "王之涣")
        self.assertContains(response, f"/poetry/{self.guanquelou.pk}/")

    def test_page_gated_on_dataset(self):
        self.dataset.state = "importing"
        self.dataset.save()
        self.assertEqual(self.client.get("/poetry/map/").status_code, 404)
        self.dataset.state = "ready"
        self.dataset.save()
        self.assertEqual(self.client.get("/poetry/map/").status_code, 200)

    def test_page_is_read_only(self):
        before = PoetryText.objects.count()
        self.assertEqual(self.client.get("/poetry/map/").status_code, 200)
        self.assertEqual(PoetryText.objects.count(), before)
