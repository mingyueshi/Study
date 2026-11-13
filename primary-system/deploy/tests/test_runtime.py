from contextlib import nullcontext
import io
import json
from pathlib import Path
import shutil
import sys
import tarfile
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import runtime


class RuntimeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.data, self.backups = root / 'data', root / 'backups'
        self.current = self.data / 'current'
        self.current.mkdir(parents=True)
        for name, value in [('DATA', self.data), ('CURRENT', self.current), ('BACKUPS', self.backups)]:
            self.mock(runtime, name, new=value)
        self.mock(runtime, 'digest', return_value='baseline-v1')
        self.manage = self.mock(runtime, 'manage')
        self.databases = {'live': {'identity': 'installation-1', 'note': '学习记录', 'revision': 7}}
        self.mock(runtime.pg, 'validate_config')
        self.mock(runtime.pg, 'maintenance_lock', side_effect=nullcontext)
        self.mock(runtime.pg, 'get_identity', side_effect=lambda name=None: self.databases[name or 'live'].get('identity'))
        self.mock(runtime.pg, 'is_empty', side_effect=lambda name=None: not self.databases[name or 'live'])
        self.mock(runtime.pg, 'create_stage', side_effect=self.create_stage)
        self.mock(runtime.pg, 'drop_stage', side_effect=lambda name: self.databases.pop(name, None))
        self.mock(runtime.pg, 'swap_database', side_effect=self.swap_database)
        self.mock(runtime.pg, 'dump', side_effect=lambda path: path.write_text(json.dumps(self.databases['live'])))
        self.mock(runtime.pg, 'restore_dump', side_effect=lambda path, name: self.databases.__setitem__(name, json.loads(path.read_text())))
        self.mock(runtime.pg, 'client')
        runtime.write_state(self.current, ready=True, identity='installation-1')
        (self.current / 'reference-assets').mkdir()
        (self.current / 'reference-assets/source.txt').write_text('固定来源')

    def mock(self, target, name, **kwargs):
        patcher = patch.object(target, name, **kwargs)
        self.addCleanup(patcher.stop)
        return patcher.start()

    def create_stage(self):
        name = runtime.pg.STAGE_PREFIX + uuid4().hex
        self.databases[name] = {}
        return name

    def swap_database(self, staged, previous):
        self.databases[previous] = self.databases.pop('live')
        self.databases['live'] = self.databases.pop(staged)

    def backup(self):
        runtime.backup()
        return next(self.backups.glob('*.tar.gz'))

    def test_snapshot_restore_preserves_records_assets_and_cleans_staging(self):
        archive = self.backup()
        self.assertEqual(archive.stat().st_mode & 0o777, 0o600)
        self.databases['live']['note'] = '恢复前修改'
        runtime.restore(archive.name)
        self.assertEqual(self.databases['live']['note'], '学习记录')
        self.assertEqual(self.databases['live']['revision'], 7)
        self.assertEqual(set(self.databases), {'live'})
        self.assertEqual((self.current / 'reference-assets/source.txt').read_text(), '固定来源')
        self.assertTrue(runtime.read_state()['ready'])

    def test_existing_update_never_restores_baseline_or_replaces_records(self):
        runtime.prepare()
        self.assertNotIn('restore_postgres_baseline', [call.args[0] for call in self.manage.call_args_list])
        self.assertEqual(self.databases['live']['note'], '学习记录')

    def test_changed_baseline_refuses_before_any_migration(self):
        with patch.object(runtime, 'digest', return_value='changed'):
            with self.assertRaisesRegex(RuntimeError, '基础包身份'):
                runtime.prepare()
        self.manage.assert_not_called()
        self.assertTrue(runtime.read_state()['ready'])

    def test_failed_update_is_not_ready(self):
        def fail(*args, **kwargs):
            if args[0] == 'migrate': raise RuntimeError('模拟迁移失败')
        self.manage.side_effect = fail
        with self.assertRaisesRegex(RuntimeError, '模拟迁移失败'):
            runtime.prepare()
        self.assertFalse(runtime.read_state()['ready'])

    def test_unknown_populated_database_is_not_adopted(self):
        shutil.rmtree(self.current)
        with self.assertRaisesRegex(RuntimeError, '数据库非空'):
            runtime.prepare()
        self.manage.assert_not_called()
        self.assertEqual(self.databases['live']['note'], '学习记录')

    def test_sqlite_volume_is_refused_without_overwriting_it(self):
        old = self.current / 'db.sqlite3'
        old.write_bytes(b'old sqlite data')
        with self.assertRaisesRegex(RuntimeError, '旧 SQLite'):
            runtime.prepare()
        self.assertEqual(old.read_bytes(), b'old sqlite data')
        self.manage.assert_not_called()

    def test_mismatched_postgres_and_asset_volumes_are_refused(self):
        self.databases['live']['identity'] = 'another-installation'
        with self.assertRaisesRegex(RuntimeError, '不配套'):
            runtime.prepare()
        self.manage.assert_not_called()

    def test_failed_pg_restore_never_switches_live_database(self):
        archive = self.backup()
        with patch.object(runtime.pg, 'restore_dump', side_effect=RuntimeError('损坏的 dump')):
            with self.assertRaisesRegex(RuntimeError, '损坏的 dump'):
                runtime.restore(archive.name)
        self.assertTrue(runtime.read_state()['ready'])
        self.assertEqual(set(self.databases), {'live'})

    def test_incompatible_schema_refuses_before_replacing_current(self):
        archive = self.backup()
        self.manage.side_effect = RuntimeError('需要匹配的代码版本')
        with self.assertRaisesRegex(RuntimeError, '代码版本'):
            runtime.restore(archive.name)
        self.assertTrue(runtime.read_state()['ready'])
        self.assertEqual(set(self.databases), {'live'})

    def test_failed_file_promotion_rolls_back_database_switch(self):
        archive = self.backup()
        self.databases['live']['note'] = '应当保留的当前记录'
        rename = Path.rename
        def fail(path, target):
            if path.name == 'current' and path.parent.name.startswith('.restore-'):
                raise OSError('模拟文件发布失败')
            return rename(path, target)
        with patch.object(Path, 'rename', fail):
            with self.assertRaisesRegex(OSError, '文件发布失败'):
                runtime.restore(archive.name)
        self.assertEqual(self.databases['live']['note'], '应当保留的当前记录')
        self.assertTrue(runtime.read_state()['ready'])
        self.assertEqual(set(self.databases), {'live'})

    def test_import_validates_without_changing_live_database_or_overwriting_backup(self):
        archive = self.backup()
        payload = archive.read_bytes()
        archive.unlink()
        self.databases['live']['note'] = '导入时的新记录'
        with patch.object(runtime.sys, 'stdin', SimpleNamespace(buffer=io.BytesIO(payload))):
            runtime.import_backup(archive.name)
        self.assertEqual(self.databases['live']['note'], '导入时的新记录')
        self.assertEqual(archive.stat().st_mode & 0o777, 0o600)
        with self.assertRaisesRegex(RuntimeError, '拒绝覆盖'):
            runtime.import_backup(archive.name)

    def test_dump_checksum_is_verified_before_restoring(self):
        archive = self.backup()
        with tarfile.open(archive, 'r:gz') as source:
            members = [(member, source.extractfile(member).read() if member.isfile() else None) for member in source.getmembers()]
        with tarfile.open(archive, 'w:gz') as target:
            for member, payload in members:
                if member.name == 'current/database.dump': payload = b'tampered'
                if payload is not None: member.size = len(payload)
                target.addfile(member, io.BytesIO(payload) if payload is not None else None)
        with self.assertRaisesRegex(RuntimeError, '摘要校验失败'):
            runtime.restore(archive.name)
        self.assertTrue(runtime.read_state()['ready'])

    def test_archive_traversal_and_symlinks_are_rejected(self):
        for name, kind in [('../escape', tarfile.REGTYPE), ('current/reference-assets/link', tarfile.SYMTYPE)]:
            archive = self.data / 'bad.tar.gz'
            with tarfile.open(archive, 'w:gz') as output:
                item = tarfile.TarInfo(name)
                item.type = kind
                item.linkname = '/etc/passwd' if kind == tarfile.SYMTYPE else ''
                output.addfile(item, io.BytesIO(b''))
            with self.assertRaisesRegex(RuntimeError, '非法路径'):
                runtime.extract_backup(archive, self.data / 'extract')

    def test_backup_path_cannot_escape_volume(self):
        with self.assertRaises(RuntimeError): runtime.backup_path('../primary-other.tar.gz')

    def test_concurrent_maintenance_is_rejected(self):
        with runtime.operation_lock():
            with self.assertRaisesRegex(RuntimeError, '正在运行'):
                with runtime.operation_lock(): pass

    def test_failed_initialization_preserves_empty_target_and_cleans_staging(self):
        shutil.rmtree(self.current)
        self.databases['live'] = {}
        def fail(*args, **kwargs):
            if args[0] == 'restore_postgres_baseline': raise RuntimeError('模拟基础包损坏')
        self.manage.side_effect = fail
        with self.assertRaisesRegex(RuntimeError, '模拟基础包损坏'):
            runtime.prepare()
        self.assertFalse(self.current.exists())
        self.assertEqual(self.databases, {'live': {}})
        self.assertFalse(list(self.data.glob('.initialize-*')))
