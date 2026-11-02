import hashlib
import tempfile
from pathlib import Path
from unittest.mock import patch

from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings
from .retirement import cleanup_retired_assets


class RetiredAssetCleanupTests(TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.settings = override_settings(REFERENCE_STORAGE_ROOT=self.root)
        self.settings.enable()
        self.addCleanup(self.settings.disable)
        self.file = self.root / "science/retired/images/known.jpg"
        self.file.parent.mkdir(parents=True)
        self.file.write_bytes(b"approved")
        manifest = {
            "scope": "test",
            "roots": ["science/retired"],
            "files": [
                {
                    "path": "science/retired/images/known.jpg",
                    "size": 8,
                    "sha256": hashlib.sha256(b"approved").hexdigest(),
                }
            ],
        }
        self.patch = patch(
            "reference_library.retirement.load_manifest", return_value=manifest
        )
        self.patch.start()
        self.addCleanup(self.patch.stop)

    def test_preview_and_repeat_preserve_other_science_assets(self):
        other = self.root / "science/future/retained.txt"
        other.parent.mkdir(parents=True)
        other.write_bytes(b"keep")
        preview = cleanup_retired_assets()
        self.assertEqual(preview["planned_files"], 1)
        self.assertEqual(preview["deleted_files"], 0)
        self.assertTrue(self.file.exists())
        self.assertEqual(cleanup_retired_assets(apply=True)["deleted_files"], 1)
        self.assertEqual(cleanup_retired_assets(apply=True)["deleted_files"], 0)
        self.assertEqual(other.read_bytes(), b"keep")

    def test_drift_or_unknown_files_abort_before_deletion(self):
        unknown = self.file.parent / "user-note.txt"
        unknown.write_bytes(b"do not remove")
        with self.assertRaises(ValidationError):
            cleanup_retired_assets(apply=True)
        self.assertTrue(self.file.exists())
        unknown.unlink()
        self.file.write_bytes(b"modified")
        with self.assertRaises(ValidationError):
            cleanup_retired_assets(apply=True)
        self.assertEqual(self.file.read_bytes(), b"modified")

    def test_symlink_rejected_and_target_preserved(self):
        outside = self.root / "outside.txt"
        outside.write_bytes(b"approved")
        self.file.unlink()
        self.file.symlink_to(outside)
        with self.assertRaises(ValidationError):
            cleanup_retired_assets(apply=True)
        self.assertEqual(outside.read_bytes(), b"approved")

    def test_migration_required_before_deleting_assets(self):
        with patch(
            "reference_library.retirement.connection.introspection.table_names",
            return_value=["science_sciencebook"],
        ):
            with self.assertRaises(ValidationError):
                cleanup_retired_assets(apply=True)
        self.assertTrue(self.file.exists())
