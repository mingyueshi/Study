import unittest
from datetime import datetime, timezone
from django.db.migrations.executor import MigrationExecutor
from catalog import test_migrations as isolation


class ChineseMigrationTests(unittest.TestCase):
    databases = {'default'}
    setUp = isolation.CatalogMigrationTests.setUp
    cleanup_database = isolation.CatalogMigrationTests.cleanup_database

    def test_populated_old_links_targets_and_private_progress_keep_ids_fields_and_null_history(self):
        before = [('catalog', '0007_retire_legacy_topic_reading'), ('lexicon', '0003_sourcerecord_pronunciation_key_compact'),
                  ('words', '0004_learningtarget_editorial_snapshot'), ('learning', '0001_initial')]
        executor = MigrationExecutor(self.connection); executor.migrate(before)
        apps = executor.loader.project_state(before).apps
        def create(app, model, **data): return apps.get_model(app, model).objects.using(self.alias).create(**data)
        user = create('accounts', 'User', username='old-child', password='!')
        subject = create('catalog', 'Subject', code='english', name='英语')
        module = create('catalog', 'Module', code='english', name='教材英语', subject=subject)
        item = create('catalog', 'ContentItem', module=module, kind='word', title='bank', summary='原人工内容',
                      body='保留正文', sections=[{'title': '音标', 'text': '/b/'}], source_payload={'memo': '人工标注'})
        source = create('lexicon', 'LexiconSource', code='migration-source', name='原来源')
        release = create('lexicon', 'SourceRelease', source=source, version='old', checksum='a'*64, adapter='test', status='ready', total=1, processed=1)
        entry = create('lexicon', 'LexicalEntry', headword='bank', lookup_key='bank', language='en', kind='word')
        sense = create('lexicon', 'Sense', entry=entry, gloss_language='en', editorial_definition='preserved manual original', revision=2)
        pron = create('lexicon', 'Pronunciation', entry=entry, system='ipa', editorial_value='/b/', revision=3)
        binding = create('lexicon', 'SourceBinding', source=source, external_key='bank', sense=sense, pronunciation=pron)
        record = create('lexicon', 'SourceRecord', release=release, binding=binding, raw_hash='a'*64, lexical_hash='b'*64, headword='bank', definition='financial institution')
        link = create('lexicon', 'ContentEntryLink', content=item, sense=sense, pronunciation=pron, evidence=record, review_note='人工选择保留')
        snapshot = {'sense_revision': 2, 'definition': 'preserved manual original', 'pronunciation_revision': 3, 'pronunciation': '/b/'}
        goal = create('words', 'LearningTarget', label='bank', sense=sense, pronunciation=pron, evidence=record, editorial_snapshot=snapshot)
        scene = create('words', 'Scenario', code='old', name='Old', zh='旧场景')
        word = create('words', 'ScenarioWord', en='bank', target=goal, scenario=scene, entry=entry, memo='旧标注')
        create('words', 'WordProgress', user=user, target=goal, word=word, learned=True, revision=4)
        create('words', 'WordProgress', guest_key='old-browser', target=goal, word=word, learned=False, revision=1)
        create('learning', 'Progress', user=user, item=item, status='mastered', bookmarked=True, note='私人笔记不能丢', revision=5)
        stamp = datetime(2021, 2, 3, 4, 5, 6, tzinfo=timezone.utc)
        for app, model in [('words','WordProgress'),('learning','Progress')]:
            apps.get_model(app,model).objects.using(self.alias).update(updated_at=stamp)
        retained = [('catalog','ContentItem'),('lexicon','ContentEntryLink'),('words','LearningTarget'),('words','ScenarioWord'),('words','WordProgress'),('learning','Progress')]
        rows = {(app,model):list(apps.get_model(app,model).objects.using(self.alias).values()) for app,model in retained}
        after = [('lexicon','0005_contententrylink_semantic_established'),('words','0006_learningtarget_semantic_established'),('learning','0002_progress_seen_lexicon')]
        executor = MigrationExecutor(self.connection); executor.migrate(after)
        latest = executor.loader.project_state(after).apps
        for (app,model), originals in rows.items():
            for original in originals:
                updated = latest.get_model(app,model).objects.using(self.alias).get(pk=original['id'])
                for field,value in original.items(): self.assertEqual(getattr(updated,field),value,(model,field))
        new_link = latest.get_model('lexicon','ContentEntryLink').objects.using(self.alias).get(pk=link.pk)
        self.assertEqual(new_link.editorial_snapshot, snapshot)
        self.assertEqual(new_link.selected_headword,'bank')
        self.assertTrue(new_link.semantic_established)
        self.assertIsNone(new_link.chinese_version_id)
        self.assertEqual(latest.get_model('lexicon','ContentLinkSelection').objects.using(self.alias).count(),1)
        for progress in latest.get_model('words','WordProgress').objects.using(self.alias).all():
            self.assertIsNone(progress.seen_chinese_version_id); self.assertIsNone(progress.seen_presentation_revision)
        self.assertIsNone(latest.get_model('learning','Progress').objects.using(self.alias).get().seen_lexicon)
        self.assertEqual(latest.get_model('lexicon','ChineseSenseVersion').objects.using(self.alias).count(),0)
