import os
import subprocess
import sys
from unittest.mock import patch

from django.db import DatabaseError
from django.db import models
from django.core.management import call_command, CommandError
from django.test import SimpleTestCase, override_settings


@override_settings(ALLOWED_HOSTS=['testserver'])
class HealthTests(SimpleTestCase):
    def test_baseline_schema_command_cannot_touch_development_database(self):
        with self.assertRaisesRegex(CommandError, '只能用于'):
            call_command('prepare_deployment_schema')

    @patch('config.health.connection')
    def test_health_has_no_private_details_or_cache(self, connection):
        connection.cursor.return_value.__enter__.return_value.fetchone.return_value = (1,)
        response = self.client.get('/healthz/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'status': 'ok'})
        self.assertIn('no-store', response['Cache-Control'])

    @patch('config.health.connection')
    def test_database_failure_is_503_without_exception_details(self, connection):
        connection.cursor.side_effect = DatabaseError('private path or password')
        response = self.client.get('/healthz/')
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {'status': 'unavailable'})

    @override_settings(SECURE_SSL_REDIRECT=True, SECURE_REDIRECT_EXEMPT=[r'^healthz/$'])
    @patch('config.health.connection')
    def test_probe_works_without_disabling_site_https(self, connection):
        connection.cursor.return_value.__enter__.return_value.fetchone.return_value = (1,)
        self.assertEqual(self.client.get('/healthz/').status_code, 200)
        self.assertEqual(self.client.get('/').status_code, 301)

    def test_production_requires_secret_debug_off_and_explicit_hosts(self):
        clean = {k: v for k, v in os.environ.items() if not k.startswith('PRIMARY_')}
        base = dict(clean, PRIMARY_PRODUCTION='1', PRIMARY_SECRET_KEY='a1' * 40,
                    PRIMARY_ALLOWED_HOSTS='localhost,study.test')
        for extra in [{'PRIMARY_SECRET_KEY': ''}, {'PRIMARY_DEBUG': '1'},
                      {'PRIMARY_ALLOWED_HOSTS': '*'}, {'PRIMARY_ALLOWED_HOSTS': ''},
                      {'PRIMARY_HTTPS': 'false'}, {'PRIMARY_TRUST_PROXY': 'yes'}]:
            result = subprocess.run([sys.executable, '-c', 'import config.settings'],
                                    env={**base, **extra}, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
        result = subprocess.run([sys.executable, '-c',
            'from config import settings as s; assert s.SESSION_COOKIE_SECURE; '
            'assert s.SECURE_PROXY_SSL_HEADER == ("HTTP_X_FORWARDED_PROTO", "https")'],
            env={**base, 'PRIMARY_TRUST_PROXY': '1'}, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr.decode())


class PostgresBaselineValueTests(SimpleTestCase):
    def test_uuid_boolean_and_utc_datetime_keep_their_meaning(self):
        from config.postgres_baseline import normalized, pg_value
        from datetime import datetime, timezone
        from uuid import UUID
        identifier = '12345678123456781234567812345678'
        self.assertEqual(pg_value(models.UUIDField(), identifier), UUID(identifier))
        self.assertEqual(normalized(models.UUIDField(), UUID(identifier)), identifier)
        self.assertIs(pg_value(models.BooleanField(), 0), False)
        self.assertEqual(pg_value(models.DateTimeField(), '2026-11-14 01:02:03'), datetime(2026, 11, 14, 1, 2, 3, tzinfo=timezone.utc))
        with self.assertRaises(ValueError):
            pg_value(models.BooleanField(), 2)

    def test_json_semantics_preserve_sql_null_and_json_null(self):
        from config.postgres_baseline import normalized
        field = models.JSONField()
        self.assertEqual(normalized(field, '{"b": 2, "a": "汉字"}'), normalized(field, '{"a":"汉字","b":2}'))
        self.assertIsNone(normalized(field, None))
        self.assertEqual(normalized(field, 'null'), 'null')
        self.assertNotEqual(normalized(field, '"null"'), normalized(field, 'null'))
