"""PostgreSQL lifecycle primitives. Maintenance credentials never reach Gunicorn."""
from contextlib import contextmanager
import os
import re
import subprocess
from uuid import uuid4

STAGE_PREFIX = 'primary_stage_'


@contextmanager
def maintenance_lock():
    with connect('postgres', admin=True) as connection:
        key = 'primary-deploy:' + os.environ['PRIMARY_DB_NAME']
        if not connection.execute('SELECT pg_try_advisory_lock(hashtextextended(%s, 0))', (key,)).fetchone()[0]:
            raise RuntimeError('另一个 PostgreSQL 运维操作正在运行。')
        yield


def connect(database=None, *, admin=False):
    import psycopg
    return psycopg.connect(
        host=os.environ['PRIMARY_DB_HOST'], port=os.environ.get('PRIMARY_DB_PORT', '5432'),
        dbname=database or os.environ['PRIMARY_DB_NAME'],
        user='postgres' if admin else os.environ['PRIMARY_DB_USER'],
        password=os.environ['PRIMARY_PG_ADMIN_PASSWORD'] if admin else os.environ['PRIMARY_DB_PASSWORD'],
        autocommit=True, connect_timeout=10,
    )


def validate_config():
    if os.environ.get('PRIMARY_DB_ENGINE') != 'postgres':
        raise RuntimeError('Docker 生产部署必须使用 PostgreSQL。')
    for key in ('PRIMARY_DB_NAME', 'PRIMARY_DB_USER'):
        value = os.environ.get(key, '')
        if not re.fullmatch(r'[a-z][a-z0-9_]{0,39}', value) or value.startswith('primary_stage_') or value == 'postgres':
            raise RuntimeError(f'{key} 应为非保留的小写字母、数字和下划线名称，最长 40 字符。')
    with connect() as connection:
        version = int(connection.execute('SHOW server_version_num').fetchone()[0])
        if not 160000 <= version < 170000:
            raise RuntimeError('本部署固定 PostgreSQL 16；跨主版本升级需要独立迁移。')
        if connection.execute('SELECT rolsuper FROM pg_roles WHERE rolname = current_user').fetchone()[0]:
            raise RuntimeError('应用账号不应具有 PostgreSQL 超级用户权限。')


def is_empty(database=None):
    with connect(database) as connection:
        return not connection.execute("SELECT 1 FROM pg_tables WHERE schemaname='public' LIMIT 1").fetchone()


def get_identity(database=None):
    with connect(database) as connection:
        if not connection.execute("SELECT to_regclass('public.primary_deployment_identity')").fetchone()[0]:
            return None
        row = connection.execute('SELECT identity FROM primary_deployment_identity WHERE singleton=1').fetchone()
        return row[0] if row else None


def set_identity(database, identity):
    with connect(database) as connection:
        connection.execute('CREATE TABLE primary_deployment_identity (singleton integer PRIMARY KEY CHECK (singleton=1), identity text NOT NULL)')
        connection.execute('INSERT INTO primary_deployment_identity VALUES (1, %s)', (identity,))


def create_stage():
    from psycopg import sql
    name = STAGE_PREFIX + uuid4().hex
    with connect('postgres', admin=True) as connection:
        connection.execute(sql.SQL('CREATE DATABASE {} OWNER {} TEMPLATE template0').format(
            sql.Identifier(name), sql.Identifier(os.environ['PRIMARY_DB_USER'])))
    return name


def drop_stage(name):
    from psycopg import sql
    if not re.fullmatch(STAGE_PREFIX + r'[0-9a-f]{32}', name):
        raise RuntimeError('拒绝删除非临时数据库。')
    with connect('postgres', admin=True) as connection:
        connection.execute(sql.SQL('DROP DATABASE IF EXISTS {} WITH (FORCE)').format(sql.Identifier(name)))


def swap_database(staged, previous):
    """Both renames commit together; the original database remains available for rollback."""
    from psycopg import sql
    live = os.environ['PRIMARY_DB_NAME']
    with connect('postgres', admin=True) as connection:
        connection.execute('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname IN (%s, %s) AND pid <> pg_backend_pid()', (live, staged))
        with connection.transaction():
            connection.execute(sql.SQL('ALTER DATABASE {} RENAME TO {}').format(sql.Identifier(live), sql.Identifier(previous)))
            connection.execute(sql.SQL('ALTER DATABASE {} RENAME TO {}').format(sql.Identifier(staged), sql.Identifier(live)))


def client(tool, *args, database=None, **kwargs):
    env = {**os.environ, 'PGHOST': os.environ['PRIMARY_DB_HOST'],
           'PGPORT': os.environ.get('PRIMARY_DB_PORT', '5432'),
           'PGUSER': os.environ['PRIMARY_DB_USER'], 'PGPASSWORD': os.environ['PRIMARY_DB_PASSWORD'],
           'PGDATABASE': database or os.environ['PRIMARY_DB_NAME'], 'PGCONNECT_TIMEOUT': '10'}
    subprocess.run([tool, *map(str, args)], env=env, check=True, **kwargs)


def dump(path):
    client('pg_dump', '--format=custom', '--compress=1', '--no-owner', '--no-privileges', '--file', path)


def restore_dump(path, database):
    if not database.startswith(STAGE_PREFIX) or not is_empty(database):
        raise RuntimeError('只能恢复到空的临时 PostgreSQL 数据库。')
    client('pg_restore', '--exit-on-error', '--single-transaction', '--no-owner', '--no-privileges',
           '--dbname', database, path, database=database)
