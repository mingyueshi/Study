"""Exercise upgrades with populated historical models, in an isolated database/schema.

SQLite uses a separate in-memory connection; PostgreSQL uses a disposable schema inside
the runner's test database. Neither path downgrades the application or the runner's schema.
"""
from copy import deepcopy
import unittest
import uuid

from django.db import connections
from django.db.migrations.executor import MigrationExecutor


class CatalogMigrationTests(unittest.TestCase):
    databases = {'default'}

    def setUp(self):
        self.alias = f'catalog_migration_{uuid.uuid4().hex}'
        self.schema = None
        base = connections['default']
        config = deepcopy(base.settings_dict)
        if base.vendor == 'sqlite':
            config['NAME'] = ':memory:'
        elif base.vendor == 'postgresql':
            self.schema = self.alias
            with base.cursor() as cursor:
                cursor.execute(f'CREATE SCHEMA {base.ops.quote_name(self.schema)}')
            config['OPTIONS']['options'] = (
                config['OPTIONS'].get('options', '') + f' -c search_path={self.schema}').strip()
        else:
            self.skipTest('Supported application databases are SQLite and PostgreSQL.')
        connections.databases[self.alias] = config
        self.connection = connections[self.alias]
        self.addCleanup(self.cleanup_database)

    def cleanup_database(self):
        self.connection.close()
        del connections[self.alias]
        del connections.databases[self.alias]
        if self.schema:
            base = connections['default']
            with base.cursor() as cursor:
                cursor.execute(f'DROP SCHEMA {base.ops.quote_name(self.schema)} CASCADE')

    def migrate(self, catalog_migration):
        targets = [
            ('catalog', catalog_migration),
            ('learning', '0001_initial'),
            ('lexicon', '0003_sourcerecord_pronunciation_key_compact'),
            ('words', '0002_relatedgloss'),
            ('chain', '0003_gameround_guest_key_alter_gameround_user_and_more'),
        ]
        executor = MigrationExecutor(self.connection)
        executor.migrate(targets)
        return executor.loader.project_state(targets).apps

    def seed(self, apps, legacy):
        def create(app, model, **values):
            return apps.get_model(app, model).objects.using(self.alias).create(**values)

        stage = create('catalog', 'Stage', code='primary', name='小学')
        grade = create('catalog', 'Grade', code='primary-4', name='四年级', stage=stage)
        subject = create('catalog', 'Subject', code='math', name='数学')
        math = create('catalog', 'Module', code='math', name='数学', subject=subject)
        words = create('catalog', 'Module', code='words', name='场景单词', subject=subject)
        create('catalog', 'Module', code='chain', name='成语接龙', subject=subject)
        geo = create('catalog', 'Module', code='geo', name='旧地理阅读', subject=subject)
        edition = create('catalog', 'TextbookEdition', code='math-edition', name='教材',
                         subject=subject, publisher='出版社', version='v1')
        textbook = create('catalog', 'Textbook', code='math-4a', name='四上', edition=edition,
                          grade=grade, term='first')
        book = create('catalog', 'Collection' if legacy else 'TextbookBook', code='math-book',
                      name='人工命名的教材册', module=math, textbook=textbook, is_published=True,
                      description='保留目录说明', order=7)
        unit = create('catalog', 'Unit', code='u1', title='人工单元名称', order=3,
                      **{'collection' if legacy else 'textbook_book': book})
        curriculum = create('catalog', 'ContentItem', module=math, title='人工教材内容',
                            status='published', import_locked=True,
                            sections=[{'title': '要点', 'text': '保留人工修订'}])
        placement = create('catalog', 'Placement', unit=unit, item=curriculum, order=8)
        old_word = create('catalog', 'ContentItem', module=words, title='旧场景阅读词卡')
        orphan = create('catalog', 'ContentItem', module=geo, title='旧专题孤儿内容')
        if legacy:
            topic = create('catalog', 'Collection', code='topic-book', name='旧专题册', module=math)
            topic.grades.add(grade)
            topic_unit = create('catalog', 'Unit', collection=topic, code='topic-u', title='专题单元')
            create('catalog', 'Placement', unit=topic_unit, item=curriculum)
            create('catalog', 'Placement', unit=topic_unit, item=old_word)
            topic_only = create('catalog', 'ContentItem', module=math, title='只在专题阅读的数学卡')
            create('catalog', 'Placement', unit=topic_unit, item=topic_only)
        user = create('accounts', 'User', username='migration-learner', password='!')
        progress = create('learning', 'Progress', user=user, item=curriculum, status='mastered',
                          bookmarked=True, note='必须保留的私人笔记', revision=5)
        create('learning', 'Progress', user=user, item=old_word, note='随旧专题清理')
        create('learning', 'Progress', user=user, item=orphan)
        source = create('lexicon', 'LexiconSource', code='retained-source', name='保留词库')
        release = create('lexicon', 'SourceRelease', source=source, version='v1', checksum='a' * 64,
                         adapter='test', status='ready')
        entry = create('lexicon', 'LexicalEntry', language='en', kind='word',
                       headword='test', lookup_key='test')
        sense = create('lexicon', 'Sense', entry=entry)
        binding = create('lexicon', 'SourceBinding', source=source, external_key='test', sense=sense)
        record = create('lexicon', 'SourceRecord', release=release, binding=binding,
                        raw_hash='b' * 64, lexical_hash='c' * 64, headword='test')
        link = create('lexicon', 'ContentEntryLink', content=curriculum, sense=sense, evidence=record)
        create('lexicon', 'ContentEntryLink', content=old_word, sense=sense, evidence=record)
        scenario = create('words', 'Scenario', code='study', name='Study', zh='学习')
        word = create('words', 'ScenarioWord', scenario=scenario, entry=entry, en='test')
        create('words', 'WordProgress', user=user, word=word, learned=True)
        idiom = create('lexicon', 'LexicalEntry', language='zh', kind='idiom',
                       headword='一心一意', lookup_key='一心一意')
        create('chain', 'ChainWord', entry=idiom, game_eligible=True)
        create('chain', 'GameRound', user=user, chain=['一心一意'], score=10)
        self.curriculum_id, self.unit_id = curriculum.pk, unit.pk
        self.placement_id, self.progress_id, self.link_id = placement.pk, progress.pk, link.pk
        self.book_values = {field: getattr(book, field) for field in
                            ('code', 'name', 'description', 'order', 'module_id', 'textbook_id', 'is_published')}
        self.protected_models = [('lexicon', name) for name in
                                 ('LexiconSource', 'SourceRelease', 'LexicalEntry', 'Sense',
                                  'SourceBinding', 'SourceRecord')]
        self.protected_models += [('words', 'Scenario'), ('words', 'ScenarioWord'),
                                  ('words', 'WordProgress'), ('chain', 'ChainWord'), ('chain', 'GameRound')]
        self.protected_data = self.snapshot(apps)

    def snapshot(self, apps):
        return {key: list(apps.get_model(*key).objects.using(self.alias).order_by('pk').values())
                for key in self.protected_models}

    def assert_upgrade(self, apps):
        def rows(app, model):
            return apps.get_model(app, model).objects.using(self.alias)

        self.assertEqual(list(rows('catalog', 'ContentItem').values_list('pk', flat=True)), [self.curriculum_id])
        item = rows('catalog', 'ContentItem').get()
        self.assertEqual((item.title, item.import_locked, item.sections),
                         ('人工教材内容', True, [{'title': '要点', 'text': '保留人工修订'}]))
        self.assertEqual(rows('catalog', 'Unit').get().pk, self.unit_id)
        self.assertEqual(rows('catalog', 'Placement').get().pk, self.placement_id)
        self.assertEqual(rows('catalog', 'Placement').get().order, 8)
        progress = rows('learning', 'Progress').get()
        self.assertEqual((progress.pk, progress.note, progress.revision, progress.status, progress.bookmarked),
                         (self.progress_id, '必须保留的私人笔记', 5, 'mastered', True))
        self.assertEqual(rows('lexicon', 'ContentEntryLink').get().pk, self.link_id)
        book = rows('catalog', 'TextbookBook').get()
        self.assertEqual({field: getattr(book, field) for field in self.book_values}, self.book_values)
        self.assertEqual(self.snapshot(apps), self.protected_data)
        self.assertTrue(rows('catalog', 'Module').get(code='words').is_active)
        self.assertTrue(rows('catalog', 'Module').get(code='chain').is_active)
        self.assertFalse(rows('catalog', 'Module').filter(code='geo').exists())
        self.connection.check_constraints()

    def upgrade_from(self, migration, legacy=True):
        self.seed(self.migrate(migration), legacy=legacy)
        self.assert_upgrade(self.migrate('0007_retire_legacy_topic_reading'))

    def test_populated_initial_database_preserves_curriculum_and_independent_apps(self):
        self.upgrade_from('0001_initial')

    def test_populated_v2_database_preserves_curriculum_and_independent_apps(self):
        self.upgrade_from('0002_alter_contentitem_sections')

    def test_forward_repair_cleans_orphans_after_original_topic_table_removal(self):
        self.upgrade_from('0006_remove_unit_unit_textbook_code_unique_and_more', legacy=False)
