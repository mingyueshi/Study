"""Small SQLite fixtures covering restore identity and destructive-operation guards."""

import contextlib
import io
import json
from pathlib import Path
import sqlite3
import subprocess
import tempfile
import unittest
from unittest.mock import patch
from uuid import uuid4

import bootstrap
from config import base_data as base


class PackageTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.source = self.root / "source.sqlite3"
        self.package = self.root / "baseline"
        self.tables = patch.object(base, "TABLES", ("catalog_grade",))
        self.tables.start()
        self.addCleanup(self.tables.stop)
        self.make_database(self.source, [(1, "primary-4"), (2, "primary-5")])
        base.export_package(self.source, self.package)

    def make_database(self, path, grades):
        with sqlite3.connect(path) as db:
            db.executescript(
                """
                CREATE TABLE django_migrations (app TEXT, name TEXT);
                INSERT INTO django_migrations VALUES ('catalog', '0001');
                CREATE TABLE catalog_grade (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL);
                CREATE TABLE accounts_user (id INTEGER PRIMARY KEY, grade_id INTEGER REFERENCES catalog_grade(id), name TEXT);
                CREATE TABLE learning_progress (id INTEGER PRIMARY KEY, grade_id INTEGER REFERENCES catalog_grade(id));
                CREATE TABLE django_session (key TEXT, value TEXT);
                INSERT INTO django_session VALUES ('session', 'preserve');
            """
            )
            db.executemany("INSERT INTO catalog_grade VALUES (?,?)", grades)

    def test_deterministic_export_preserves_source_and_allows_valid_replace(self):
        before = base.sha_file(self.source)
        other = self.root / "second"
        base.export_package(self.source, other)
        self.assertEqual(before, base.sha_file(self.source))
        expected = {p.name: p.read_bytes() for p in self.package.iterdir()}
        self.assertEqual(expected, {p.name: p.read_bytes() for p in other.iterdir()})
        self.assertEqual(next(self.package.glob("*.gz")).read_bytes()[4:8], b"\0" * 4)
        base.export_package(self.source, self.package, replace=True)
        self.assertEqual(
            expected, {p.name: p.read_bytes() for p in self.package.iterdir()}
        )

    def test_replace_rejects_ordinary_directory_symlink_and_extra_files(self):
        ordinary = self.root / "project"
        ordinary.mkdir()
        keep = ordinary / "keep.txt"
        keep.write_text("user data")
        with self.assertRaises((base.BaselineError, OSError)):
            base.export_package(self.source, ordinary, replace=True)
        self.assertEqual(keep.read_text(), "user data")
        alias = self.root / "alias"
        alias.symlink_to(self.package, target_is_directory=True)
        with self.assertRaises(base.BaselineError):
            base.export_package(self.source, alias, replace=True)
        extra = self.package / "local-note.txt"
        extra.write_text("keep")
        with self.assertRaises(base.BaselineError):
            base.export_package(self.source, self.package, replace=True)
        self.assertEqual(extra.read_text(), "keep")

    def test_empty_restore_repeat_and_missing_only_with_personal_records(self):
        target = self.root / "target.sqlite3"
        self.make_database(target, [])
        self.assertEqual(
            base.restore_package(target, self.package)["status"], "completed_missing"
        )
        with sqlite3.connect(target) as db:
            db.execute("INSERT INTO accounts_user VALUES (1,1,'learner')")
            db.execute("INSERT INTO learning_progress VALUES (1,1)")
        before = base.sha_file(target)
        self.assertEqual(
            base.restore_package(target, self.package)["status"], "unchanged"
        )
        self.assertEqual(before, base.sha_file(target))
        with sqlite3.connect(target) as db:
            db.execute("DELETE FROM catalog_grade WHERE id=2")
        result = base.restore_package(
            target, self.package, refresh=True, backup_dir=self.root / "backups"
        )
        self.assertEqual(result["status"], "completed_missing")
        self.assertTrue(Path(result["backup"]).is_file())
        with sqlite3.connect(target) as db:
            self.assertEqual(
                db.execute("SELECT * FROM accounts_user").fetchall(),
                [(1, 1, "learner")],
            )
            self.assertEqual(
                db.execute("SELECT * FROM learning_progress").fetchall(), [(1, 1)]
            )
            self.assertEqual(
                db.execute("SELECT * FROM django_session").fetchall(),
                [("session", "preserve")],
            )

    def test_default_refuses_and_explicit_replace_maps_account_grade(self):
        target = self.root / "old.sqlite3"
        self.make_database(target, [(3, "primary-4"), (4, "primary-5")])
        with sqlite3.connect(target) as db:
            db.execute("INSERT INTO accounts_user VALUES (1,3,'administrator')")
        before = base.sha_file(target)
        with self.assertRaisesRegex(base.BaselineError, "--refresh-data"):
            base.restore_package(target, self.package)
        self.assertEqual(before, base.sha_file(target))
        with patch.object(base, "replacement_blockers", return_value=[]):
            result = base.restore_package(
                target, self.package, refresh=True, backup_dir=self.root / "backups"
            )
        self.assertEqual(result["status"], "refreshed")
        with sqlite3.connect(target) as db:
            self.assertEqual(
                db.execute("SELECT * FROM accounts_user").fetchone(),
                (1, 1, "administrator"),
            )
            self.assertFalse(db.execute("PRAGMA foreign_key_check").fetchall())

    def test_corruption_rejects_before_target_creation(self):
        part = next(self.package.glob("*.gz"))
        part.write_bytes(part.read_bytes() + b"corrupt")
        target = self.root / "never-created.sqlite3"
        with self.assertRaises(base.BaselineError):
            base.restore_package(target, self.package, refresh=True)
        self.assertFalse(target.exists())


class InitialSelectionTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.addCleanup(self.db.close)
        (
            self.content,
            self.sense,
            self.pron,
            self.evidence,
            self.binding,
            self.source,
        ) = [uuid4().hex for _ in range(6)]
        self.editorial = {
            "sense_revision": 0,
            "definition": "",
            "pronunciation_revision": 0,
            "pronunciation": "",
        }
        self.db.executescript(
            """
            CREATE TABLE catalog_contentitem (id TEXT, source_key TEXT);
            CREATE TABLE lexicon_sense (id TEXT, revision INTEGER, editorial_definition TEXT);
            CREATE TABLE lexicon_pronunciation (id TEXT, revision INTEGER, editorial_value TEXT);
            CREATE TABLE lexicon_lexiconsource (id TEXT, code TEXT);
            CREATE TABLE lexicon_sourcebinding (id TEXT, source_id TEXT, external_key TEXT, sense_id TEXT, pronunciation_id TEXT);
            CREATE TABLE lexicon_sourcerecord (id TEXT, binding_id TEXT, headword TEXT, lexical_hash TEXT);
            CREATE TABLE lexicon_contentlinkselection (id INTEGER, link_id INTEGER);
            CREATE TABLE lexicon_contententrylink (id INTEGER, content_id TEXT, slot TEXT, sense_id TEXT, pronunciation_id TEXT,
                evidence_id TEXT, editorial_snapshot TEXT, selected_headword TEXT, selection_revision INTEGER,
                chinese_version_id TEXT, presentation_revision INTEGER, method TEXT, review_note TEXT);
        """
        )
        self.db.execute(
            "INSERT INTO catalog_contentitem VALUES (?,?)",
            (self.content, "primary:test"),
        )
        self.db.execute("INSERT INTO lexicon_sense VALUES (?,0,'')", (self.sense,))
        self.db.execute(
            "INSERT INTO lexicon_pronunciation VALUES (?,0,'')", (self.pron,)
        )
        self.db.execute(
            "INSERT INTO lexicon_lexiconsource VALUES (?,?)",
            (self.source, "primary-english"),
        )
        self.db.execute(
            "INSERT INTO lexicon_sourcebinding VALUES (?,?,?,?,?)",
            (self.binding, self.source, "primary:test", self.sense, self.pron),
        )
        self.db.execute(
            "INSERT INTO lexicon_sourcerecord VALUES (?,?,?,?)",
            (self.evidence, self.binding, "test", "hash"),
        )
        self.db.execute(
            "INSERT INTO lexicon_contententrylink VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (
                1,
                self.content,
                "main",
                self.sense,
                self.pron,
                self.evidence,
                json.dumps(self.editorial),
                "test",
                1,
                None,
                0,
                "inherited",
                "沿用现有教学词卡的释义与读音；不代表权威词典审校。",
            ),
        )
        self.db.execute("INSERT INTO lexicon_contentlinkselection VALUES (1,1)")
        self.selection = {
            "sense_id": str(base.UUID(self.sense)),
            "pronunciation_id": str(base.UUID(self.pron)),
            "evidence_id": str(base.UUID(self.evidence)),
            "editorial_snapshot": self.editorial,
            "headword": "test",
            "chinese_version_id": None,
            "presentation_revision": 0,
        }
        self.history = {
            "revision": 1,
            "reason": "首次明确选择／继承教学关联",
            "link_id": 1,
            "selection": json.dumps(self.selection),
        }
        self.equivalent = {
            ("primary:test", "main", "primary-english", "primary:test", "hash")
        }

    def allowed(self):
        return base.initial_inherited_selection(self.db, self.history, self.equivalent)

    def test_initial_code_and_migration_records(self):
        self.assertTrue(self.allowed())
        self.history["reason"] = "继承旧关联：冻结迁移时选择，不逆推历史学习版本"
        self.assertTrue(self.allowed())

    def test_changed_history_and_snapshot_are_blocked(self):
        for field, value in [("reason", "人工确认"), ("revision", 2)]:
            old = self.history[field]
            self.history[field] = value
            self.assertFalse(self.allowed())
            self.history[field] = old
        for field, value in [
            ("presentation_revision", 1),
            ("chinese_version_id", str(uuid4())),
            ("sense_id", str(uuid4())),
            ("headword", "other"),
        ]:
            self.history["selection"] = json.dumps(
                dict(self.selection, **{field: value})
            )
            self.assertFalse(self.allowed())
        self.history["selection"] = json.dumps(self.selection)
        self.db.execute("INSERT INTO lexicon_contentlinkselection VALUES (2,1)")
        self.assertFalse(self.allowed())

    def test_changed_link_provenance_and_editorial_are_blocked(self):
        cases = [
            ("lexicon_contententrylink", "slot", "extra"),
            ("lexicon_contententrylink", "selection_revision", 2),
            ("lexicon_contententrylink", "chinese_version_id", uuid4().hex),
            ("lexicon_contententrylink", "presentation_revision", 1),
            ("lexicon_contententrylink", "sense_id", uuid4().hex),
            ("lexicon_contententrylink", "method", "manual"),
            ("lexicon_contententrylink", "review_note", "changed"),
            ("lexicon_lexiconsource", "code", "other"),
            ("lexicon_sourcebinding", "external_key", "other"),
            ("lexicon_sourcerecord", "lexical_hash", "other"),
            ("lexicon_sense", "editorial_definition", "changed"),
        ]
        for table, field, value in cases:
            with self.subTest(table=table, field=field):
                self.db.execute("SAVEPOINT change")
                self.db.execute(f"UPDATE {table} SET {field}=?", (value,))
                self.assertFalse(self.allowed())
                self.db.execute("ROLLBACK TO change")
                self.db.execute("RELEASE change")


class BootstrapProtectionTests(unittest.TestCase):
    def test_pending_migration_and_personal_records_refuse_before_backup_or_migrate(
        self,
    ):
        with tempfile.TemporaryDirectory() as directory:
            database = Path(directory) / "personal.sqlite3"
            with sqlite3.connect(database) as db:
                db.executescript(
                    "CREATE TABLE learning_progress (id INTEGER); INSERT INTO learning_progress VALUES (1);"
                )
            before = base.sha_file(database)
            calls = []

            def run(command, **kwargs):
                calls.append(command)
                return subprocess.CompletedProcess(
                    command, 1 if "--check" in command else 0
                )

            with patch(
                "sys.argv",
                [
                    "bootstrap.py",
                    "--skip-install",
                    "--refresh-data",
                    "--database",
                    str(database),
                ],
            ), patch.object(bootstrap.subprocess, "run", side_effect=run), patch.object(
                base, "backup_database"
            ) as backup, contextlib.redirect_stdout(
                io.StringIO()
            ):
                with self.assertRaisesRegex(SystemExit, "原库未改动"):
                    bootstrap.main()
                backup.assert_not_called()
            self.assertEqual(before, base.sha_file(database))
            self.assertFalse(
                any("migrate" in call and "--noinput" in call for call in calls)
            )


if __name__ == "__main__":
    unittest.main()
