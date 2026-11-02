import json
from pathlib import Path
from tempfile import TemporaryDirectory
from django.core.exceptions import ValidationError
from django.test import TestCase
from reference_library.models import Dataset
from .models import CountryRegion
from .importing import import_data


class CountryImportTests(TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        folder = self.root / "package/multisubject/countries"
        (folder / "raw").mkdir(parents=True)
        (folder / "derived").mkdir()
        raw = []
        derived = []
        for i in range(250):
            code = "CHN" if i == 0 else f"X{i:03}"
            raw.append(
                {
                    "cca3": code,
                    "name": {"official": f"Country {i}"},
                    "borders": [],
                    "languages": {},
                    "currencies": {},
                }
            )
            derived.append(
                {
                    "cca3": code,
                    "cca2": "CN" if i == 0 else "",
                    "name_en": f"Country {i}",
                    "name_zh": "中国" if i == 0 else f"地区{i}",
                    "capital": ["Beijing", "Other"] if i == 0 else [],
                    "region": "Asia",
                    "subregion": "Eastern Asia",
                    "latlng": [0, 0],
                    "area_km2": i,
                    "independent": True,
                    "un_member": True,
                }
            )
        (folder / "raw/countries.json").write_text(json.dumps(raw))
        (folder / "derived/countries_core.json").write_text(json.dumps(derived))

    def test_full_raw_derived_preview_repeat_manual_and_multicapitals(self):
        self.assertEqual(import_data(self.root, True)["count"], 250)
        self.assertFalse(Dataset.objects.exists())
        self.assertEqual(import_data(self.root)["created"], 250)
        row = CountryRegion.objects.get(code="CHN")
        row.editorial_name_zh = "人工核定名称"
        row.notes = "保留"
        row.save()
        self.assertEqual(import_data(self.root)["created"], 0)
        self.assertEqual(import_data(self.root, True)["created"], 0)
        row.refresh_from_db()
        self.assertEqual(row.display_name, "人工核定名称")
        self.assertEqual(row.notes, "保留")
        self.assertEqual(len(row.capitals), 2)
        self.assertContains(self.client.get("/geography/CHN/"), "北京")
        self.assertContains(self.client.get("/geography/CHN/"), "中文名暂缺")
        self.assertContains(self.client.get("/geography/?q=人工核定"), "人工核定名称")

    def test_raw_or_typed_drift_is_detected(self):
        import_data(self.root)
        row = CountryRegion.objects.get(code="CHN")
        row.raw = {"altered": True}
        row.save()
        with self.assertRaises(ValidationError):
            import_data(self.root, True)

    def test_incomplete_existing_rejected_and_pending_hidden(self):
        import_data(self.root)
        CountryRegion.objects.last().delete()
        with self.assertRaises(ValidationError):
            import_data(self.root)
        Dataset.objects.filter(pk="countries").update(state="pending")
        self.assertEqual(self.client.get("/geography/CHN/").status_code, 404)
        self.assertEqual(self.client.get("/geography/?region=bad").status_code, 400)

    def test_entire_missing_ready_dataset_is_not_silently_rebuilt(self):
        import_data(self.root)
        CountryRegion.objects.all().delete()
        for dry in (True, False):
            with self.assertRaises(ValidationError):
                import_data(self.root, dry)
        self.assertFalse(CountryRegion.objects.exists())

    def test_language_currency_chinese_original_and_unknown_fallback(self):
        import_data(self.root)
        row = CountryRegion.objects.get(code="CHN")
        row.languages = {"zho": "Chinese", "eng": "English", "unknown": "Unreviewed"}
        row.currencies = {
            "CNY": {"name": "Chinese yuan", "symbol": "¥"},
            "CKD": {"name": "Cook Islands dollar", "symbol": "$"},
            "UNK": {"name": "Unreviewed"},
        }
        row.save()
        response = self.client.get("/geography/CHN/")
        for text in [
            "中文",
            "英语",
            "Chinese",
            "English",
            "人民币",
            "Chinese yuan",
            "库克群岛元",
            "Cook Islands dollar",
            "中文名暂缺",
        ]:
            self.assertContains(response, text)
        self.assertNotContains(response, "未覆盖人工字段")
        self.assertNotContains(response, "中文对照尚待逐项补齐")
