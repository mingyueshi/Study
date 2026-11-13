"""Import the published JSONL baseline into an empty historical PostgreSQL schema."""
from datetime import datetime, timezone
import hashlib
import json
from uuid import UUID

from django.core.management.color import no_style
from django.db import connection, transaction
from django.db.migrations.executor import MigrationExecutor
from config.base_data import BaselineError, encoded, package_rows, verify_package


def value_type(field):
    return (field.target_field if field.is_relation else field).get_internal_type()


def normalized(field, value):
    if value is None:
        return None
    kind = value_type(field)
    if kind == 'JSONField':
        return json.dumps(json.loads(value), ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    if kind == 'UUIDField':
        return UUID(str(value)).hex
    if kind == 'BooleanField':
        if value not in (0, 1, False, True):
            raise BaselineError('布尔字段必须为 0 或 1。')
        return int(value)
    if kind == 'DateTimeField':
        value = value if isinstance(value, datetime) else datetime.fromisoformat(value)
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).isoformat(timespec='microseconds')
    return value


def pg_value(field, value):
    if value is None:
        return None
    kind = value_type(field)
    if kind == 'JSONField':
        from psycopg.types.json import Jsonb
        return Jsonb(json.loads(value))
    if kind == 'UUIDField':
        return UUID(str(value))
    if kind == 'BooleanField':
        return bool(normalized(field, value))
    if kind == 'DateTimeField':
        return datetime.fromisoformat(normalized(field, value))
    return value


def restore_postgres_package(root, output):
    from psycopg import sql
    manifest = verify_package(root)
    executor = MigrationExecutor(connection)
    required = {tuple(item) for item in manifest['required_migrations']}
    if set(executor.loader.applied_migrations) != required:
        raise BaselineError('迁移状态与基础包不匹配，拒绝导入。')
    historical = executor.loader.project_state(nodes=list(required)).apps
    models = {model._meta.db_table: model for model in historical.get_models()}
    table_models = []
    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute('SET CONSTRAINTS ALL DEFERRED')
            for table in manifest['tables']:
                name = table['name']
                model = models[name]
                fields = {field.column: field for field in model._meta.local_fields}
                names = [col[0] for col in table['columns']]
                if set(names) != set(fields):
                    raise BaselineError('基础包列与历史模型不匹配：' + name)
                cursor.execute(sql.SQL('SELECT EXISTS(SELECT 1 FROM {})').format(sql.Identifier(name)))
                if cursor.fetchone()[0]:
                    raise BaselineError('基础表非空，拒绝覆盖：' + name)
                selected = [fields[column] for column in names]
                expected = hashlib.sha256()
                with cursor.copy(sql.SQL('COPY {} ({}) FROM STDIN').format(
                        sql.Identifier(name), sql.SQL(',').join(map(sql.Identifier, names)))) as copy:
                    for row in package_rows(root, table):
                        expected.update(encoded([normalized(field, value) for field, value in zip(selected, row)]) + b'\n')
                        copy.write_row([pg_value(field, value) for field, value in zip(selected, row)])
                pk = next(col[0] for col in table['columns'] if col[3])
                select = sql.SQL(',').join(
                    sql.SQL('{}::text').format(sql.Identifier(column)) if value_type(fields[column]) == 'JSONField'
                    else sql.Identifier(column) for column in names)
                order = sql.Identifier(pk)
                if value_type(fields[pk]) in ('CharField', 'SlugField', 'TextField'):
                    order = sql.SQL('{} COLLATE "C"').format(order)
                actual, count = hashlib.sha256(), 0
                with connection.connection.cursor(name='baseline_verify') as verifier:
                    verifier.itersize = 2000
                    verifier.execute(sql.SQL('SELECT {} FROM {} ORDER BY {}').format(select, sql.Identifier(name), order))
                    for row in verifier:
                        actual.update(encoded([normalized(field, value) for field, value in zip(selected, row)]) + b'\n')
                        count += 1
                if count != table['rows'] or actual.digest() != expected.digest():
                    raise BaselineError('PostgreSQL 导入后语义摘要不一致：' + name)
                table_models.append(model)
                output(f'{name}：{count} 行校验通过。')
            cursor.execute('SET CONSTRAINTS ALL IMMEDIATE')
            for statement in connection.ops.sequence_reset_sql(no_style(), table_models):
                cursor.execute(statement)
    return manifest
