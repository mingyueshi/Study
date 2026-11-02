import hashlib
import tempfile
from pathlib import Path
from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings
from .importing import check_registry
from .models import ArchivePackage, SourceFile


class RegistryPreviewTests(TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.override = override_settings(REFERENCE_STORAGE_ROOT=self.root)
        self.override.enable()
        self.addCleanup(self.override.disable)
        self.file = {
            "path": "raw/data.txt",
            "sha256": hashlib.sha256(b"approved").hexdigest(),
            "size": 8,
            "storage_path": "",
        }
        self.package = {
            "name": "approved.zip",
            "sha256": "a" * 64,
            "size": 22,
            "files": [self.file],
        }

    def register(self):
        row = ArchivePackage.objects.create(
            name="approved.zip", sha256="a" * 64, size=22
        )
        return SourceFile.objects.create(
            package=row,
            path=self.file["path"],
            sha256=self.file["sha256"],
            size=8,
            storage_path="packages/approved/raw/data.txt",
        )

    def test_preview_can_inspect_empty_registry_without_writes(self):
        check_registry([self.package])
        self.assertEqual(ArchivePackage.objects.count(), 0)
        self.assertEqual(SourceFile.objects.count(), 0)

    def test_preview_rejects_registered_metadata_and_coverage_drift(self):
        source = self.register()
        check_registry([self.package])
        source.size = 99
        source.save(update_fields=["size"])
        with self.assertRaises(ValidationError):
            check_registry([self.package])
        source.delete()
        with self.assertRaises(ValidationError):
            check_registry([self.package])

    def test_preview_rejects_existing_private_asset_drift_without_registry(self):
        path = self.root / "packages/approved/raw/data.txt"
        path.parent.mkdir(parents=True)
        path.write_bytes(b"changed")
        with self.assertRaises(ValidationError):
            check_registry([self.package])
        self.assertEqual(path.read_bytes(), b"changed")
