import csv, gzip
from pathlib import Path
from tempfile import TemporaryDirectory
from django.core.exceptions import ValidationError
from django.test import TestCase
from reference_library.models import Dataset
from .importing import typed_row, import_data, VERSION
from .models import CelestialRecord, NamedCelestialRecord

COLUMNS = "id hip hd hr gl bf proper ra dec dist pmra pmdec rv mag absmag spect ci x y z vx vy vz rarad decrad pmrarad pmdecrad bayer flam con comp comp_primary base lum var var_min var_max".split()


def row(ident=0, proper="Sol", distance="0"):
    result = dict.fromkeys(COLUMNS, "")
    result.update(
        id=str(ident),
        proper=proper,
        ra="0",
        dec="0",
        dist=distance,
        mag="-26.7",
        con="Ori",
        comp="1",
        comp_primary="0",
    )
    return result


class AstronomyImportTests(TestCase):
    def test_sun_units_sentinel_same_names_and_curated_labels(self):
        sun = typed_row(row(), 2)
        self.assertEqual(sun.name_zh, "太阳")
        self.assertEqual(sun.distance_pc, 0)
        self.assertIn("太阳", sun.object_kind)
        sentinel = typed_row(row(1, "Unreviewed", "100000"), 3)
        self.assertIsNone(sentinel.distance_pc)
        self.assertTrue(sentinel.distance_unknown)
        self.assertEqual(sentinel.raw_distance_pc, 100000)
        self.assertEqual(sentinel.name_zh, "")
        first = typed_row(row(2, "p Eridani", "10"), 4)
        second = typed_row(row(3, "p Eridani", "10"), 5)
        first.save()
        second.save()
        self.assertEqual(
            CelestialRecord.objects.filter(proper_name="p Eridani").count(), 2
        )
        bad = row()
        bad["dec"] = "91"
        with self.assertRaises(ValidationError):
            typed_row(bad, 2)

    def test_partial_stream_never_publishes_or_leaves_bulk_rows(self):
        with TemporaryDirectory() as temp:
            root = Path(temp)
            folder = root / "package/multisubject/hyg"
            (folder / "raw").mkdir(parents=True)
            (folder / "derived").mkdir()
            records = [
                row(i, "Sol" if i == 0 else f"Star{i}", "0" if i == 0 else "10")
                for i in range(1001)
            ]
            with gzip.open(
                folder / "raw/hygdata_v42.csv.gz", "wt", encoding="utf-8", newline=""
            ) as f:
                writer = csv.DictWriter(f, fieldnames=COLUMNS)
                writer.writeheader()
                writer.writerows(records)
            with (folder / "derived/named_stars.csv").open(
                "w", encoding="utf-8", newline=""
            ) as f:
                writer = csv.DictWriter(f, fieldnames=COLUMNS)
                writer.writeheader()
                writer.writerows(records[:499])
            with self.assertRaises(ValidationError):
                import_data(root)
            self.assertFalse(CelestialRecord.objects.exists())
            self.assertFalse(NamedCelestialRecord.objects.exists())
            self.assertFalse(Dataset.objects.exists())
            with self.assertRaises(ValidationError):
                import_data(root, True)
            self.assertFalse(Dataset.objects.exists())

    def test_chinese_search_filters_detail_and_readiness(self):
        Dataset.objects.create(code="hyg", title="HYG", version=VERSION, state="ready")
        sun = typed_row(row(), 2)
        sun.save()
        NamedCelestialRecord.objects.create(
            record=sun, source_path="named", source_row=2, source_hash="a" * 64
        )
        self.assertContains(
            self.client.get("/astronomy/?q=太阳&named=1&con=Ori"), "太阳"
        )
        response = self.client.get("/astronomy/0/")
        self.assertContains(response, "J2000.0")
        self.assertContains(response, "小时")
        self.assertEqual(self.client.get("/astronomy/?con=bad").status_code, 400)
        self.assertEqual(self.client.get("/astronomy/?q=²").status_code, 200)
        Dataset.objects.filter(pk="hyg").update(state="pending")
        self.assertEqual(self.client.get("/astronomy/0/").status_code, 404)

    def test_untranslated_name_uses_chinese_catalogue_label(self):
        Dataset.objects.create(code="hyg", title="HYG", version=VERSION, state="ready")
        record = typed_row(row(42, "Unreviewed", "100000"), 2)
        record.save()
        self.assertEqual(record.display_name, "HYG 42号天体 · Unreviewed")
        response = self.client.get("/astronomy/42/")
        self.assertContains(response, "HYG 42号天体")
        self.assertContains(response, "Unreviewed")
        self.assertContains(response, "距离")
        self.assertNotContains(response, "大距离哨兵")
        self.assertNotContains(response, "逐项分类核对")
