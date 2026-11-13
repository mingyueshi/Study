"""Container lifecycle for PostgreSQL, private assets and portable backups."""
import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import sys
import tarfile
import tempfile
from uuid import uuid4

import postgres as pg

ROOT = Path(__file__).resolve().parent.parent
DATA = Path('/data')
BACKUPS = Path('/backups')
CURRENT = DATA / 'current'
sys.path.insert(0, str(ROOT))


def manage(*args, directory=None, database=None):
    env = os.environ.copy()
    if directory:
        env['PRIMARY_REFERENCE_ROOT'] = str(directory / 'reference-assets')
    if database:
        env['PRIMARY_DB_NAME'] = database
    subprocess.run([sys.executable, str(ROOT / 'manage.py'), *args], cwd=ROOT, env=env, check=True)


def digest():
    return json.loads((ROOT / 'data/baseline/manifest.json').read_text())['digest']


def read_state(directory=None, *, compatible=True):
    directory = directory or CURRENT
    if (directory / 'db.sqlite3').exists():
        raise RuntimeError('检测到旧 SQLite 数据卷，拒绝覆盖；请使用新项目名部署 PostgreSQL，个人数据需单独迁移。')
    if not (directory / 'deployment.json').is_file():
        raise RuntimeError('缺少部署记录，拒绝接管已有数据。')
    state = json.loads((directory / 'deployment.json').read_text())
    if state.get('format') != 2 or state.get('database') != 'postgresql' or not state.get('identity'):
        raise RuntimeError('部署记录不是 PostgreSQL 格式，拒绝覆盖。')
    if compatible and state.get('baseline_digest') != digest():
        raise RuntimeError('基础包身份已改变，停止自动更新；请先验证专用数据升级流程。')
    return state


def save_state(directory, state):
    temporary = directory / '.deployment.tmp'
    temporary.write_text(json.dumps(state, ensure_ascii=False) + '\n')
    temporary.replace(directory / 'deployment.json')


def write_state(directory, ready, identity=None):
    identity = identity or read_state(directory)['identity']
    save_state(directory, {
        'format': 2, 'database': 'postgresql', 'baseline_digest': digest(), 'ready': ready,
        'identity': identity, 'code_revision': os.environ.get('PRIMARY_IMAGE_REVISION', 'unknown'),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    })


def check_identity(state, database=None):
    if pg.get_identity(database) != state['identity']:
        raise RuntimeError('PostgreSQL 数据库与资料卷不配套，拒绝启动或覆盖。请检查卷配置或恢复完整备份。')


@contextmanager
def operation_lock():
    DATA.mkdir(parents=True, exist_ok=True)
    with (DATA / '.operation.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise RuntimeError('另一个数据维护操作正在运行。') from exc
        with pg.maintenance_lock():
            yield


def preflight():
    pg.validate_config()
    if CURRENT.exists():
        check_identity(read_state())
    elif not pg.is_empty():
        raise RuntimeError('数据库非空但没有部署记录，拒绝接管或覆盖。')
    manage('check', '--deploy', '--fail-level', 'ERROR')


def verify_assets(directory=None, database=None):
    manage('verify_deployment_assets', directory=directory, database=database)


def load_questions(directory=None, database=None):
    for batch in sorted((ROOT / 'questionbank/data/questions').glob('*.json')):
        manage('import_questions', '--input', str(batch), directory=directory, database=database)


def check_existing(*, allow_pending=False, require_ready=True):
    if not CURRENT.exists():
        raise RuntimeError('快捷命令只用于已部署站点；首次请运行 make deploy。')
    state = read_state()
    if require_ready and not state.get('ready'):
        raise RuntimeError('上次部署未完成，请先用 make update 或 make db-migrate 修复。')
    preflight()
    manage('check_deployment_database', *(['--allow-pending'] if allow_pending else []))


def migrate_only():
    check_existing(allow_pending=True, require_ready=False)
    write_state(CURRENT, ready=False)
    manage('migrate', '--noinput')
    manage('check_deployment_database')
    manage('check')
    write_state(CURRENT, ready=True)


def maintenance(action):
    check_existing()
    if action == 'rewards-preview':
        manage('import_rewards', '--dry-run')
    elif action == 'index-rebuild':
        manage('build_feihualing_index')
    else:
        # 单项数据维护仍保留恢复点，不停应用、不重复初始化和扫描全部资料。
        backup()
        if action == 'rewards-import':
            manage('import_rewards')
        elif action == 'questions-import':
            load_questions()
        elif action == 'permissions-sync':
            manage('seed_platform')
            manage('seed_lexicon_roles')


def promote(stage, database):
    previous_db = pg.STAGE_PREFIX + uuid4().hex
    previous_files = DATA / ('.previous-' + uuid4().hex)
    old_state = read_state() if CURRENT.exists() else None
    if old_state:
        write_state(CURRENT, ready=False)
    try:
        pg.swap_database(database, previous_db)
    except BaseException:
        if old_state:
            save_state(CURRENT, old_state)
        raise
    try:
        if CURRENT.exists():
            CURRENT.rename(previous_files)
        stage.rename(CURRENT)
    except BaseException:
        # SQL 更名在同一事务中完成；文件发布失败则将完整旧库切回。
        pg.swap_database(previous_db, database)
        if previous_files.exists():
            previous_files.rename(CURRENT)
        if old_state:
            save_state(CURRENT, old_state)
        raise
    pg.drop_stage(previous_db)
    if previous_files.exists():
        shutil.rmtree(previous_files)


def prepare():
    preflight()
    if not CURRENT.exists():
        staged_db = pg.create_stage()
        try:
            with tempfile.TemporaryDirectory(prefix='.initialize-', dir=DATA) as scratch:
                stage = Path(scratch) / 'current'
                stage.mkdir()
                manage('prepare_deployment_schema', database=staged_db)
                manage('restore_postgres_baseline', directory=stage, database=staged_db)
                manage('migrate', '--noinput', database=staged_db)
                manage('seed_platform', database=staged_db)
                manage('seed_lexicon_roles', database=staged_db)
                load_questions(stage, staged_db)
                identity = uuid4().hex
                pg.set_identity(staged_db, identity)
                write_state(stage, ready=False, identity=identity)
                promote(stage, staged_db)
        finally:
            pg.drop_stage(staged_db)
    else:
        write_state(CURRENT, ready=False)
        manage('migrate', '--noinput')
        manage('seed_platform')
        manage('seed_lexicon_roles')
        load_questions()
        verify_assets()
    manage('build_feihualing_index', '--if-needed')
    manage('check')
    write_state(CURRENT, ready=True)
    print('PostgreSQL 部署数据已就绪。', flush=True)


def sha256(path):
    with path.open('rb') as source:
        return hashlib.file_digest(source, 'sha256').hexdigest()


def backup():
    if not CURRENT.exists():
        if not pg.is_empty():
            raise RuntimeError('未知的非空数据库，拒绝跳过备份。')
        print('首次部署，无现有数据库需要备份。', flush=True)
        return
    state = read_state(compatible=False)
    check_identity(state)
    BACKUPS.mkdir(parents=True, exist_ok=True)
    name = 'primary-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ-') + uuid4().hex[:8] + '.tar.gz'
    with tempfile.TemporaryDirectory(prefix='.backup-', dir=BACKUPS) as scratch:
        scratch = Path(scratch)
        dump = scratch / 'database.dump'
        pg.dump(dump)
        state_file = CURRENT / 'deployment.json'
        checksums = scratch / 'backup.json'
        checksums.write_text(json.dumps({'format': 2, 'database_sha256': sha256(dump), 'state_sha256': sha256(state_file)}) + '\n')
        archive_path = scratch / name
        with tarfile.open(archive_path, 'w:gz', compresslevel=1) as archive:
            archive.add(dump, arcname='current/database.dump')
            archive.add(state_file, arcname='current/deployment.json')
            archive.add(checksums, arcname='current/backup.json')
            archive.add(CURRENT / 'reference-assets', arcname='current/reference-assets')
        archive_path.chmod(0o600)
        archive_path.replace(BACKUPS / name)
    print('备份完成：' + name, flush=True)


def checked_name(name):
    if not name or Path(name).name != name or not name.startswith('primary-') or not name.endswith('.tar.gz'):
        raise RuntimeError('BACKUP 必须是 primary-*.tar.gz 备份文件名。')
    return name


def backup_path(name):
    path = BACKUPS / checked_name(name)
    if not path.is_file() or path.is_symlink():
        raise RuntimeError('找不到指定备份。')
    return path


def extract_backup(path, destination):
    required = {'current/database.dump', 'current/deployment.json', 'current/backup.json', 'current/reference-assets'}
    with tarfile.open(path, 'r:gz') as archive:
        members, seen = archive.getmembers(), set()
        for member in members:
            name = PurePosixPath(member.name)
            if (member.name in seen or name.is_absolute() or '..' in name.parts
                    or not (member.isfile() or member.isdir())
                    or not (member.name in required or member.name.startswith('current/reference-assets/'))):
                raise RuntimeError('备份包含非法路径、链接或重复文件。')
            seen.add(member.name)
        if not required <= seen:
            raise RuntimeError('备份缺少必要文件，或属于旧 SQLite 格式。')
        archive.extractall(destination, filter='data')
    stage = destination / 'current'
    state = read_state(stage)
    if not state.get('ready'):
        raise RuntimeError('该备份来自未完成的部署，不能自动恢复。')
    checksums = json.loads((stage / 'backup.json').read_text())
    if (checksums.get('format') != 2 or checksums.get('database_sha256') != sha256(stage / 'database.dump')
            or checksums.get('state_sha256') != sha256(stage / 'deployment.json')):
        raise RuntimeError('备份摘要校验失败。')
    pg.client('pg_restore', '--list', stage / 'database.dump', stdout=subprocess.DEVNULL)
    return stage


@contextmanager
def validated_backup(path):
    with tempfile.TemporaryDirectory(prefix='.restore-', dir=DATA) as scratch:
        stage = extract_backup(path, Path(scratch))
        database = pg.create_stage()
        try:
            pg.restore_dump(stage / 'database.dump', database)
            check_identity(read_state(stage), database)
            manage('check_deployment_database', database=database)
            verify_assets(stage, database)
            yield stage, database
        finally:
            pg.drop_stage(database)


def import_backup(name):
    destination = BACKUPS / checked_name(name)
    BACKUPS.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        raise RuntimeError('同名备份已存在，拒绝覆盖。')
    with tempfile.TemporaryDirectory(prefix='.import-', dir=BACKUPS) as scratch:
        archive = Path(scratch) / name
        with archive.open('wb') as output:
            shutil.copyfileobj(sys.stdin.buffer, output)
        with validated_backup(archive):
            pass
        archive.chmod(0o600)
        archive.replace(destination)
    print('已导入并验证 PostgreSQL 备份：' + name, flush=True)


def restore(name, validate_only=False):
    with validated_backup(backup_path(name)) as (stage, database):
        if validate_only:
            print('备份已在临时 PostgreSQL 库中完整恢复并通过校验。', flush=True)
            return
        write_state(stage, ready=False)
        (stage / 'database.dump').unlink()
        (stage / 'backup.json').unlink()
        promote(stage, database)
        shutil.rmtree(DATA / 'cache', ignore_errors=True)
        manage('build_feihualing_index', '--if-needed')
        write_state(CURRENT, ready=True)
    print('恢复完成：' + name, flush=True)


def main():
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    maintenance_actions = ['rewards-preview', 'rewards-import', 'questions-import', 'permissions-sync', 'index-rebuild']
    parser.add_argument('action', choices=['preflight', 'prepare', 'backup', 'backups', 'export', 'import', 'validate-backup', 'restore', 'serve', 'check-app', 'check-migrate', 'migrate', 'mark-release', *maintenance_actions])
    parser.add_argument('name', nargs='?')
    args = parser.parse_args()
    if args.action == 'serve':
        state = read_state()
        if not state.get('ready'):
            raise RuntimeError('部署尚未完成，请运行 make deploy 并检查输出。')
        check_identity(state)
        manage('check_deployment_database')
        os.execvp('gunicorn', ['gunicorn', '--config', 'deploy/gunicorn.conf.py', 'config.wsgi:application'])
    elif args.action == 'backups':
        for path in sorted(BACKUPS.glob('primary-*.tar.gz')):
            print(f'{path.name}\t{path.stat().st_size // 1024 // 1024} MiB')
    elif args.action == 'export':
        with backup_path(args.name).open('rb') as source:
            shutil.copyfileobj(source, sys.stdout.buffer)
    else:
        with operation_lock():
            if args.action == 'preflight': preflight()
            elif args.action == 'prepare': prepare()
            elif args.action == 'backup': backup()
            elif args.action == 'import': import_backup(args.name)
            elif args.action == 'check-app': check_existing()
            elif args.action == 'check-migrate': check_existing(allow_pending=True, require_ready=False)
            elif args.action == 'migrate': migrate_only()
            elif args.action == 'mark-release':
                check_existing()
                write_state(CURRENT, ready=True)
            elif args.action in maintenance_actions: maintenance(args.action)
            else: restore(args.name, validate_only=args.action == 'validate-backup')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'部署操作失败：{error}', file=sys.stderr)
        raise SystemExit(1)
