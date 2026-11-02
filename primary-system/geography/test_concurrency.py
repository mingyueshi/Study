from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from unittest import skipUnless
from django.db import close_old_connections, connection
from django.test import TransactionTestCase
from reference_library.models import Dataset
from .importing import import_data
from .models import CountryRegion
from . import tests as fixtures


@skipUnless(connection.vendor == "postgresql", "需要PostgreSQL行锁")
class CountryConcurrentImportTests(TransactionTestCase):
    def setUp(self):
        fixtures.CountryImportTests.setUp(self)

    def test_simultaneous_first_import_is_created_then_unchanged(self):
        gate = Barrier(2)

        def worker():
            close_old_connections()
            try:
                gate.wait(timeout=10)
                return import_data(self.root)["created"]
            finally:
                close_old_connections()

        with ThreadPoolExecutor(max_workers=2) as pool:
            futures = [pool.submit(worker) for _ in range(2)]
            results = [future.result(timeout=30) for future in futures]
        self.assertEqual(sorted(results), [0, 250])
        self.assertEqual(CountryRegion.objects.count(), 250)
        self.assertEqual(
            Dataset.objects.filter(code="countries", state="ready").count(), 1
        )
