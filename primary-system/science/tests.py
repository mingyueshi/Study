"""Retained element imports and routes do not depend on the retired textbook."""

import json
import tempfile
from pathlib import Path
from django.core.exceptions import ValidationError
from django.db import connection
from django.test import TestCase
from reference_library.models import Dataset
from reference_library.retirement import RETIRED_TABLES
from .importing import import_data
from .models import Element


class ElementRetentionTests(TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.elements = [
            {"number": number, "symbol": f"E{number}", "name": f"Element {number}"}
            for number in range(1, 120)
        ]
        self.elements[0].update(density_unit="g/L", density_g_cm3=0.00008988)
        (self.root / "PeriodicTableJSON.json").write_text(
            json.dumps({"elements": self.elements})
        )
        (self.root / "elements_1_118.json").write_text(json.dumps(self.elements[:118]))

    def test_independent_preview_import_repeat_and_element_pages(self):
        self.assertFalse(import_data(self.root, dry_run=True)["unchanged"])
        self.assertEqual(Element.objects.count(), 0)
        self.assertEqual(Dataset.objects.count(), 0)
        self.assertEqual(import_data(self.root)["created"], 119)
        original = list(Element.objects.order_by("number").values())
        self.assertTrue(import_data(self.root)["unchanged"])
        self.assertTrue(import_data(self.root, dry_run=True)["unchanged"])
        self.assertEqual(list(Element.objects.order_by("number").values()), original)
        self.assertEqual(
            list(Dataset.objects.values_list("code", flat=True)), ["periodic-elements"]
        )
        for route in [
            "/science/elements/",
            "/science/elements/1/",
            "/science/elements/?q=氢",
        ]:
            self.assertEqual(self.client.get(route).status_code, 200)
        self.assertEqual(self.client.get("/science/elements/119/").status_code, 404)

    def test_existing_fields_are_never_overwritten(self):
        import_data(self.root)
        Element.objects.filter(number=1).update(chinese_name="人工修改")
        for dry_run in [True, False]:
            with self.assertRaises(ValidationError):
                import_data(self.root, dry_run=dry_run)
        self.assertEqual(Element.objects.get(number=1).chinese_name, "人工修改")

    def test_missing_rows_and_orphans_fail_in_preview_and_apply(self):
        import_data(self.root)
        Element.objects.filter(number=119).delete()
        for dry_run in [True, False]:
            with self.assertRaises(ValidationError):
                import_data(self.root, dry_run=dry_run)
        Dataset.objects.all().delete()
        with self.assertRaises(ValidationError):
            import_data(self.root)

    def test_retired_routes_and_tables_are_absent(self):
        for route in [
            "/arithmetic/",
            "/arithmetic/1/",
            "/science/",
            "/science/book/",
            "/science/sections/1/",
            "/science/images/1/",
            "/science/teacher/1/",
            "/science/source/1/",
            "/science/source-book.epub",
        ]:
            self.assertEqual(self.client.get(route).status_code, 404, route)
        self.assertFalse(
            RETIRED_TABLES.intersection(connection.introspection.table_names())
        )
        response = self.client.get("/references/")
        self.assertEqual(response.content.count(b'class="book-card"'), 5)
