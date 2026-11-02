"""在隔离连接/PG schema 上验证有数据的 words.0002 → 0003。"""
import unittest
from datetime import datetime, timezone
from django.db.migrations.executor import MigrationExecutor
from catalog import test_migrations as isolation


class WordMigrationTests(unittest.TestCase):
    databases = {'default'}
    setUp = isolation.CatalogMigrationTests.setUp
    cleanup_database = isolation.CatalogMigrationTests.cleanup_database

    def test_old_cards_true_false_owner_and_timestamp_preserved(self):
        executor = MigrationExecutor(self.connection)
        before = [('words', '0002_relatedgloss')]
        executor.migrate(before)
        apps = executor.loader.project_state(before).apps
        def create(app, model, **data):
            return apps.get_model(app, model).objects.using(self.alias).create(**data)
        user = create('accounts', 'User', username='old-account', password='!')
        source = create('lexicon', 'LexiconSource', code='primary-words', name='场景')
        release = create('lexicon', 'SourceRelease', source=source, version='old', checksum='a'*64,
                         adapter='test', status='ready', total=3, processed=3)
        apps.get_model('lexicon', 'LexiconSource').objects.using(self.alias).filter(pk=source.pk).update(active_release=release)
        scenario = create('words', 'Scenario', code='old', name='Old', zh='旧场景')
        cards = []
        for n in range(3):
            entry = create('lexicon', 'LexicalEntry', headword=f'word{n}', lookup_key=f'word{n}', language='en', kind='word')
            card = create('words', 'ScenarioWord', en=f'word{n}', scenario=scenario, entry=entry,
                          memo='人工修改', segments=[{'t': 'word', 'd': '保留'}])
            cards.append(card)
            # 0=唯一明确证据，1=多义，2=无证据。后两者须保留待复核，不能猜选。
            for k in range(1 if n == 0 else 2 if n == 1 else 0):
                sense = create('lexicon', 'Sense', entry=entry, editorial_definition='保留人工释义', revision=2)
                binding = create('lexicon', 'SourceBinding', source=source, external_key=f'{n}:{k}', sense=sense)
                create('lexicon', 'SourceRecord', release=release, binding=binding, raw_hash='b'*64,
                       lexical_hash='c'*64, headword=f'word{n}', definition=f'义项{k}')
        stamp = datetime(2023, 4, 5, 6, 7, 8, tzinfo=timezone.utc)
        old_rows = []
        Progress = apps.get_model('words', 'WordProgress')
        for i, card in enumerate(cards):
            for owner in ({'user': user}, {'guest_key': 'old-browser'}):
                p = create('words', 'WordProgress', word=card, learned=i != 1, **owner)
                Progress.objects.using(self.alias).filter(pk=p.pk).update(updated_at=stamp)
        old_rows = list(Progress.objects.using(self.alias).values('id', 'user_id', 'guest_key', 'word_id', 'learned', 'updated_at'))
        old_cards = list(apps.get_model('words', 'ScenarioWord').objects.using(self.alias).values())
        after = [('words', '0004_learningtarget_editorial_snapshot')]
        executor = MigrationExecutor(self.connection)
        executor.migrate(after)
        new_apps = executor.loader.project_state(after).apps
        NewProgress = new_apps.get_model('words', 'WordProgress')
        NewCard = new_apps.get_model('words', 'ScenarioWord')
        Target = new_apps.get_model('words', 'LearningTarget')
        for old in old_rows:
            new = NewProgress.objects.using(self.alias).get(pk=old['id'])
            for field, value in old.items():
                self.assertEqual(getattr(new, field), value)
            self.assertEqual(new.legacy_word_id, old['word_id'])
            self.assertEqual(new.target_id, NewCard.objects.using(self.alias).get(pk=old['word_id']).target_id)
            self.assertEqual(new.revision, 0)
        for old in old_cards:
            new = NewCard.objects.using(self.alias).get(pk=old['id'])
            for field, value in old.items():
                self.assertEqual(getattr(new, field), value)
        chosen = Target.objects.using(self.alias).get(sense__isnull=False)
        self.assertEqual(chosen.editorial_snapshot['sense_revision'], 2)
        self.assertEqual(chosen.editorial_snapshot['definition'], '保留人工释义')
        self.assertEqual(Target.objects.using(self.alias).count(), 3)
        self.assertEqual(Target.objects.using(self.alias).filter(sense__isnull=True).count(), 2)
        self.assertEqual(NewProgress.objects.using(self.alias).count(), 6)
