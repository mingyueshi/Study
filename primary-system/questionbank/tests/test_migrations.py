"""在隔离连接上验证 questionbank.0001 → 0002 的旧库升级：轨别默认普通，记录保留。"""
import unittest
import uuid

from django.db.migrations.executor import MigrationExecutor

from catalog import test_migrations as isolation


class QuestionTrackMigrationTests(unittest.TestCase):
    databases = {'default'}
    setUp = isolation.CatalogMigrationTests.setUp
    cleanup_database = isolation.CatalogMigrationTests.cleanup_database

    def test_populated_bank_defaults_regular_and_records_preserved(self):
        executor = MigrationExecutor(self.connection)
        before = [('questionbank', '0001_initial')]
        executor.migrate(before)
        apps = executor.loader.project_state(before).apps

        def create(app, model, **data):
            return apps.get_model(app, model).objects.using(self.alias).create(**data)

        user = create('accounts', 'User', username='old-account', password='!')
        question = create('questionbank', 'Question',
                          uuid=uuid.uuid5(uuid.NAMESPACE_URL, 'test/migration-question'),
                          type='choice', area='math', grade=4, stem='10 个一万是多少？',
                          payload={'options': ['十万', '一万'], 'answer': 0,
                                   'explanation': '10 个一万是十万。'},
                          tags=['数学'], source_key='primary-math',
                          source_ref='math:mu1-1:example', checksum='a' * 64, active=True)
        AnswerRecord = apps.get_model('questionbank', 'AnswerRecord')
        AnswerRecord.objects.using(self.alias).create(
            guest_key='old-browser', question=question, given={'value': 0}, correct=True)
        AnswerRecord.objects.using(self.alias).create(
            user=user, question=question, given={'value': 1}, correct=False)
        old_rows = list(AnswerRecord.objects.using(self.alias)
                        .values('id', 'user_id', 'guest_key', 'question_id', 'correct', 'given'))

        after = [('questionbank', '0002_question_track')]
        executor = MigrationExecutor(self.connection)
        executor.migrate(after)
        new_apps = executor.loader.project_state(after).apps
        NewQuestion = new_apps.get_model('questionbank', 'Question')
        NewAnswer = new_apps.get_model('questionbank', 'AnswerRecord')
        reloaded = NewQuestion.objects.using(self.alias).get(pk=question.pk)
        self.assertEqual(reloaded.track, 'regular', '升级后旧题默认归普通轨。')
        self.assertEqual(reloaded.checksum, 'a' * 64, '内容指纹不因加字段重算。')
        self.assertEqual(NewAnswer.objects.using(self.alias).count(), 2)
        for old in old_rows:
            new = NewAnswer.objects.using(self.alias).get(pk=old['id'])
            for field, value in old.items():
                self.assertEqual(getattr(new, field), value)
