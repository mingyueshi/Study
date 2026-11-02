import csv, gzip
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Barrier
from unittest import skipUnless
from unittest.mock import patch
from django.db import close_old_connections, connection
from django.test import TransactionTestCase
from reference_library.models import Dataset
from . import importing
from .models import CelestialRecord, NamedCelestialRecord
from .tests import COLUMNS, row


@skipUnless(connection.vendor == "postgresql", "需要PostgreSQL行锁")
class AstronomyConcurrentImportTests(TransactionTestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        folder = self.root / "package/multisubject/hyg"
        (folder / "raw").mkdir(parents=True)
        (folder / "derived").mkdir()
        records = [
            row(0, "Sol", "0"),
            row(1, "p Eridani", "10"),
            row(2, "p Eridani", "100000"),
        ]
        with gzip.open(
            folder / "raw/hygdata_v42.csv.gz", "wt", encoding="utf-8", newline=""
        ) as handle:
            writer = csv.DictWriter(handle, fieldnames=COLUMNS)
            writer.writeheader()
            writer.writerows(records)
        with (folder / "derived/named_stars.csv").open(
            "w", encoding="utf-8", newline=""
        ) as handle:
            writer = csv.DictWriter(handle, fieldnames=COLUMNS)
            writer.writeheader()
            writer.writerows(records[1:])

    def test_simultaneous_first_import_preserves_same_name_components(self):
        gate = Barrier(2)

        def worker():
            close_old_connections()
            try:
                gate.wait(timeout=10)
                return importing.import_data(self.root)["created"]
            finally:
                close_old_connections()

        with patch.multiple(
            importing,
            EXPECTED_RECORDS=3,
            EXPECTED_NAMED=2,
            EXPECTED_UNKNOWN=1,
            EXPECTED_NAMED_UNKNOWN=1,
        ):
            with ThreadPoolExecutor(max_workers=2) as pool:
                futures = [pool.submit(worker) for _ in range(2)]
                results = [future.result(timeout=30) for future in futures]
        self.assertEqual(sorted(results), [0, 3])
        self.assertEqual(CelestialRecord.objects.count(), 3)
        self.assertEqual(
            CelestialRecord.objects.filter(proper_name="p Eridani").count(), 2
        )
        self.assertEqual(NamedCelestialRecord.objects.count(), 2)
        self.assertEqual(Dataset.objects.filter(code="hyg", state="ready").count(), 1)
