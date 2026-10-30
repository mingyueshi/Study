"""Dictionary and game/API boundaries. All fixtures live in Django's test DB only."""
from django.core.cache import cache
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext

from game.models import Idiom, Round
from game.views import candidates


class DictionaryTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.normal = Idiom.objects.create(
            word='意气风发', meaning='精神振奋。', pinyin='yì qì fēng fā',
            abbreviation='yqff', derivation='测试用出处。', example='测试用例句。',
            source='test-fixture', source_version='fixture-sha', source_url='https://example.invalid/source',
            source_raw={'original': '仅测试记录，不应在公开API展开'}, reading_status='raw',
        )
        cls.long = Idiom.objects.create(word='有志者事竟成', meaning='有志向并努力，事情能够成功。', game_eligible=False)
        cls.disabled = Idiom.objects.create(word='意气相投', meaning='已禁用词条', enabled=False)
        cls.reference_only = Idiom.objects.create(word='意味深长', meaning='只供查阅。', game_eligible=False)

    def setUp(self):
        cache.clear()

    def test_search_by_word_pinyin_and_exact_abbreviation(self):
        for q in ['意气', 'YÌ QÌ', 'YQFF']:
            result = self.client.get('/api/idioms/', {'q': q}).json()
            self.assertEqual(result['total'], 1, q)
            self.assertEqual(result['results'][0]['id'], self.normal.pk)
        self.assertEqual(self.client.get('/api/idioms/', {'q': 'qff'}).json()['total'], 0)

    def test_search_whitespace_no_match_and_query_length(self):
        result = self.client.get('/api/idioms/', {'q': '  意气  '}).json()
        self.assertEqual(result['total'], 1)
        response = self.client.get('/api/idioms/', {'q': '不存在词条' * 100})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['total'], 0)
        self.assertEqual(response.json()['results'], [])
        self.assertEqual(response.json()['page'], 1)

    def test_pagination_is_bounded_stable_and_has_no_duplicates(self):
        for n in range(25):
            Idiom.objects.create(word=f'分页测试{n:02}', meaning='分页测试数据。', game_eligible=False)
        first = self.client.get('/api/idioms/', {'q': '分页测试', 'page': 1}).json()
        second = self.client.get('/api/idioms/', {'q': '分页测试', 'page': 2}).json()
        self.assertEqual((first['page'], first['pages'], first['total']), (1, 2, 25))
        self.assertEqual(len(first['results']), 20)
        self.assertEqual(len(second['results']), 5)
        words = [i['word'] for i in first['results'] + second['results']]
        self.assertEqual(words, sorted(set(words)))
        for value, expected in [('not-a-page', 1), ('999999', 2), ('-1', 2)]:
            self.assertEqual(self.client.get('/api/idioms/', {'q': '分页测试', 'page': value}).json()['page'], expected)

    def test_non_four_character_word_is_readable_but_not_playable(self):
        detail = self.client.get(f'/api/idioms/{self.long.pk}/')
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.json()['word'], '有志者事竟成')
        self.assertFalse(detail.json()['game_eligible'])
        self.assertEqual(self.client.get('/api/idioms/', {'q': '有志者'}).json()['total'], 1)
        self.long.full_clean()  # Dictionary mode explicitly accepts non-game entries.

    def test_detail_retains_original_metadata_without_invented_relations(self):
        response = self.client.get(f'/api/idioms/{self.normal.pk}/')
        data = response.json()
        for field in ['word', 'pinyin', 'meaning', 'derivation', 'example', 'abbreviation', 'source', 'source_url', 'source_version', 'reading_status']:
            self.assertEqual(data[field], getattr(self.normal, field), field)
        self.assertFalse(data['relations_available'])
        self.assertNotIn('synonyms', data)
        self.assertNotIn('antonyms', data)
        self.assertEqual(data['source_raw'], self.normal.source_raw)
        search_data = self.client.get('/api/idioms/', {'q': '意气风发'}).json()['results'][0]
        self.assertNotIn('source_raw', search_data)
        self.assertNotIn('derivation', search_data)

    def test_lookup_exact_match_and_missing_404(self):
        response = self.client.get('/api/idioms/lookup/', {'word': '意气风发'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['id'], self.normal.pk)
        for path, query in [('/api/idioms/999999/', {}), ('/api/idioms/lookup/', {'word': '意气'}), ('/api/idioms/lookup/', {})]:
            self.assertEqual(self.client.get(path, query).status_code, 404)

    def test_disabled_entries_hidden_from_all_dictionary_routes(self):
        self.assertEqual(self.client.get('/api/idioms/', {'q': self.disabled.word}).json()['total'], 0)
        self.assertEqual(self.client.get(f'/api/idioms/{self.disabled.pk}/').status_code, 404)
        self.assertEqual(self.client.get('/api/idioms/lookup/', {'word': self.disabled.word}).status_code, 404)

    def test_dictionary_reads_do_not_create_game_or_session(self):
        self.client.get('/api/idioms/')
        self.client.get(f'/api/idioms/{self.normal.pk}/')
        self.assertFalse(Round.objects.exists())
        self.assertNotIn('sessionid', self.client.cookies)

    def test_dictionary_routes_are_read_only(self):
        for path in ['/api/idioms/', '/api/idioms/lookup/', f'/api/idioms/{self.normal.pk}/']:
            self.assertEqual(self.client.post(path, {}).status_code, 405)

    def test_original_markup_is_json_data_not_server_template_markup(self):
        # This checks the server boundary, not browser execution. UI must use textContent.
        attack = '<script>alert("dictionary-xss")</script><img src=x onerror=alert(1)>'
        Idiom.objects.filter(pk=self.normal.pk).update(meaning=attack, derivation=attack, example=attack, pinyin=attack)
        response = self.client.get(f'/api/idioms/{self.normal.pk}/')
        self.assertEqual(response.headers['Content-Type'], 'application/json')
        for field in ['meaning', 'derivation', 'example', 'pinyin']:
            self.assertEqual(response.json()[field], attack)
        page = self.client.get('/')
        self.assertEqual(page.status_code, 200)
        self.assertNotContains(page, attack)

    def test_first_and_last_char_are_derived_on_save(self):
        entry = Idiom.objects.get(pk=self.normal.pk)
        self.assertEqual((entry.first_char, entry.last_char), ('意', '发'))
        entry.word = '发扬光大'
        entry.save()
        entry.refresh_from_db()
        self.assertEqual((entry.first_char, entry.last_char), ('发', '大'))


class DictionaryGameBoundaryTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.valid = Idiom.objects.create(word='意气风发', meaning='精神振奋。', pinyin='yì qì fēng fā')
        cls.reference = Idiom.objects.create(word='意味深长', meaning='供查阅。', game_eligible=False)
        Idiom.objects.create(word='意气相投', meaning='禁用。', enabled=False)
        Idiom.objects.create(word='发扬光大', meaning='发展壮大。')

    def setUp(self):
        cache.clear()
        self.state = self.client.get('/api/state/').json()

    def post(self, route, word=None, state=None):
        state = state or self.state
        data = {'round_id': state['id'], 'revision': state['revision']}
        if word is not None:
            data['word'] = word
        return self.client.post(f'/api/{route}/', data, content_type='application/json')

    def test_existing_game_state_get_avoids_write_transactions(self):
        with CaptureQueriesContext(connection) as captured:
            response = self.client.get('/api/state/')
        self.assertEqual(response.status_code, 200)
        sql = [q['sql'].strip().upper() for q in captured.captured_queries]
        self.assertTrue(sql)
        self.assertFalse(any(s.startswith(('BEGIN', 'SAVEPOINT', 'INSERT', 'UPDATE', 'DELETE')) for s in sql), sql)
        self.assertEqual(response.json()['id'], self.state['id'])

    def test_dictionary_and_playable_counts_are_distinct(self):
        self.assertEqual(self.state['dictionary_count'], 2)
        self.assertEqual(self.state['total_dictionary_count'], 3)

    def test_reference_only_entry_cannot_be_played(self):
        response = self.post('play', self.reference.word)
        self.assertEqual(response.status_code, 400)
        self.assertIn('查阅', response.json()['error'])
        game = Round.objects.get(pk=self.state['id'])
        self.assertEqual((game.score, game.revision, len(game.chain)), (0, 0, 1))

    def test_candidates_use_first_character_and_exclude_ineligible_disabled_used(self):
        game = Round.objects.get(pk=self.state['id'])
        with CaptureQueriesContext(connection) as captured:
            result = list(candidates(game).values_list('word', flat=True))
        self.assertEqual(result, ['意气风发'])
        self.assertIn('"first_char"', captured.captured_queries[0]['sql'])
        game.chain.append({'word': self.valid.word, 'meaning': self.valid.meaning})
        game.chain.append({'word': '一心一意', 'meaning': '测试末字。'})
        self.assertEqual(list(candidates(game)), [])

    def test_successful_play_retains_dictionary_identity_and_pinyin(self):
        response = self.post('play', self.valid.word)
        self.assertEqual(response.status_code, 200)
        last = response.json()['chain'][-1]
        self.assertEqual(last['idiom_id'], self.valid.pk)
        self.assertEqual(last['pinyin'], self.valid.pinyin)

    def test_stale_revision_does_not_charge_hint_or_duplicate_move(self):
        self.assertEqual(self.post('play', self.valid.word).status_code, 200)
        self.assertEqual(self.post('hint').status_code, 409)
        self.assertEqual(self.post('play', self.valid.word).status_code, 409)
        game = Round.objects.get(pk=self.state['id'])
        self.assertEqual((game.score, game.hints, game.revision), (10, 0, 1))

    def test_old_round_id_cannot_mutate_new_round_with_same_revision(self):
        response = self.post('restart')
        self.assertEqual(response.status_code, 200)
        new_state = response.json()
        self.assertEqual(new_state['revision'], self.state['revision'])
        for route in ['play', 'hint', 'restart']:
            self.assertEqual(self.post(route, self.valid.word).status_code, 409)
        self.assertEqual(self.client.get('/api/state/').json()['id'], new_state['id'])
        self.assertEqual(Round.objects.count(), 2)


class DictionaryImporterTests(TestCase):
    """Tiny local fixtures; patch only the expected fixture hash, never production data."""
    def setUp(self):
        import tempfile
        from pathlib import Path
        self.temp = tempfile.TemporaryDirectory(prefix='idiom-import-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        cache.clear()

    def fixture(self, rows):
        import hashlib
        import json
        path = self.root / 'fixture.json'
        raw = json.dumps(rows, ensure_ascii=False).encode()
        path.write_bytes(raw)
        return path, hashlib.sha256(raw).hexdigest()

    def run_fixture(self, rows, **kwargs):
        from io import StringIO
        from unittest.mock import patch
        from django.core.management import call_command
        path, digest = self.fixture(rows)
        output = StringIO()
        with patch('game.management.commands.import_xinhua.SHA256', digest):
            call_command('import_xinhua', path, stdout=output, **kwargs)
        import json
        return json.loads(output.getvalue())

    def test_hash_mismatch_rejected_without_writes(self):
        from io import StringIO
        from django.core.management import call_command, CommandError
        path, _ = self.fixture([{'word': '意气风发'}])
        with self.assertRaisesMessage(CommandError, 'SHA256 mismatch'):
            call_command('import_xinhua', path, stdout=StringIO())
        self.assertEqual(Idiom.objects.count(), 0)

    def test_import_is_idempotent_preserves_curated_meaning_disabled_status_and_rounds(self):
        curated = Idiom.objects.create(word='意气风发', meaning='人工保留的释义。', source='curated', enabled=False)
        game = Round.objects.create(owner='unit-test-owner', chain=[{'word': '一心一意', 'meaning': '保留记录。'}])
        rows = [
            {'word': '意气风发', 'explanation': '来源释义。', 'pinyin': 'yì qì fēng fā', 'derivation': '来源出处。', 'example': '来源例句。', 'abbreviation': 'yqff'},
            {'word': '有志者事竟成', 'explanation': '来源长词释义。', 'pinyin': 'yǒu zhì zhě shì jìng chéng'},
        ]
        first = self.run_fixture(rows)
        self.assertEqual((first['counts']['created'], first['counts']['updated']), (1, 1))
        curated.refresh_from_db()
        self.assertEqual(curated.meaning, '人工保留的释义。')
        self.assertEqual(curated.source, 'curated')
        self.assertFalse(curated.enabled)
        self.assertEqual(curated.source_raw, rows[0])
        self.assertEqual(curated.pinyin, rows[0]['pinyin'])
        long_word = Idiom.objects.get(word='有志者事竟成')
        self.assertFalse(long_word.game_eligible)
        second = self.run_fixture(rows)
        self.assertEqual((second['counts']['created'], second['counts']['updated'], second['counts']['unchanged']), (0, 0, 2))
        self.assertEqual(Idiom.objects.count(), 2)
        self.assertEqual(Round.objects.get(pk=game.pk).chain, game.chain)

    def test_invalid_reading_is_preserved_and_excluded_from_game(self):
        raw = {'word': '意气风发', 'explanation': '测试释义。', 'pinyin': 'yì qì BROKEN fā'}
        self.run_fixture([raw])
        item = Idiom.objects.get(word=raw['word'])
        self.assertEqual(item.pinyin, raw['pinyin'])
        self.assertEqual(item.source_raw, raw)
        self.assertEqual(item.reading_status, 'needs_review')
        self.assertFalse(item.game_eligible)

    def test_dry_run_writes_no_data_and_reports_anomalies(self):
        rows = [
            {'word': '意气风发', 'explanation': '测试。', 'pinyin': 'yì qì fēng fā'},
            {'word': '意气风发', 'explanation': '重复。'},
            {'word': ' 无效 ', 'explanation': '前后空白。'},
            {'word': '坏记录', 'pinyin': 123},
            {'word': '意味深长', 'explanation': '', 'pinyin': ''},
        ]
        result = self.run_fixture(rows, dry_run=True)
        self.assertTrue(result['dry_run'])
        self.assertEqual(result['counts']['skipped_duplicate'], 1)
        self.assertEqual(result['counts']['skipped_invalid_word'], 1)
        self.assertEqual(result['counts']['skipped_invalid_record'], 1)
        self.assertEqual(result['counts']['empty_explanation'], 1)
        self.assertFalse(Idiom.objects.exists())

    def test_reading_format_is_not_silently_repaired(self):
        from game.management.commands.import_xinhua import reading_format_ok
        self.assertTrue(reading_format_ok('yì qì fēng fā', '意气风发'))
        self.assertFalse(reading_format_ok('yìqìfēngfā', '意气风发'))
        self.assertFalse(reading_format_ok('yì qì fēng', '意气风发'))
        self.assertFalse(reading_format_ok('yì qì 123 fā', '意气风发'))
        self.assertFalse(reading_format_ok('yì qì fèēng fā', '意气风发'))

    def test_locked_admin_created_or_edited_entries_survive_import(self):
        from django.contrib.admin.sites import AdminSite
        from django.test import RequestFactory
        from game.admin import IdiomAdmin
        item=Idiom(word='意气风发',meaning='人工释义',pinyin='人工读音',example='人工例句')
        IdiomAdmin(Idiom,AdminSite()).save_model(RequestFactory().get('/'),item,None,False)
        self.assertTrue(item.import_locked)
        before={k:getattr(item,k) for k in ('meaning','pinyin','example','source_raw','source_version')}
        result=self.run_fixture([{'word':'意气风发','explanation':'外部释义','pinyin':'yì qì fēng fā','example':'外部例句'}])
        item.refresh_from_db()
        self.assertEqual(result['counts']['manual_locked_preserved'],1)
        self.assertEqual(before,{k:getattr(item,k) for k in before})

    def test_curated_overlap_keeps_summary_and_exposes_full_source_explanation(self):
        item = Idiom.objects.create(word='意气风发', meaning='人工简释。', source='curated')
        full = '这是一段完整的来源解释，含标点、换行和原始用字。\n不得用人工简释覆盖。'
        row = {'word': item.word, 'explanation': full, 'pinyin': 'yì qì fēng fā', 'derivation': '完整出处', 'example': '完整例句', 'abbreviation': 'yqff'}
        self.run_fixture([row])
        item.refresh_from_db()
        self.assertEqual(item.meaning, '人工简释。')
        self.assertEqual(item.source_explanation, full)
        for url in [f'/api/idioms/{item.pk}/', '/api/idioms/lookup/?word=意气风发']:
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data['summary'], '人工简释。')
            self.assertEqual(data['meaning'], '人工简释。')
            self.assertEqual(data['source_explanation'], full)
            self.assertEqual(data['source_raw'], row)
            self.assertFalse(data['source_missing'])

    def test_all_six_source_fields_round_trip_without_trimming_or_rewriting(self):
        row = {
            'word': '意气风发', 'explanation': '  完整解释\n第二行；“保留”空格。  ',
            'pinyin': 'yì qì fēng fā', 'derivation': ' 原始出处\n卷一 ',
            'example': ' 原始例句 <不可作为HTML>。 ', 'abbreviation': 'yqff',
        }
        self.run_fixture([row])
        item = Idiom.objects.get(word=row['word'])
        data = self.client.get(f'/api/idioms/{item.pk}/').json()
        mapping = {'word': 'word', 'explanation': 'source_explanation', 'pinyin': 'pinyin', 'derivation': 'derivation', 'example': 'example', 'abbreviation': 'abbreviation'}
        for upstream, model_field in mapping.items():
            self.assertEqual(getattr(item, model_field), row[upstream], upstream)
            self.assertEqual(data[model_field], row[upstream], upstream)
        self.assertEqual(data['source_raw'], row)
        self.assertEqual(data['summary'], '')
        self.assertFalse(data['source_missing'])

    def test_future_unknown_source_keys_are_retained_in_raw_only(self):
        row = {
            'word': '意气风发', 'explanation': '完整解释。', 'pinyin': 'yì qì fēng fā',
            'derivation': '', 'example': '', 'abbreviation': 'yqff',
            'future_field': {'nested': ['原文', 42, None], 'markup': '<img onerror=alert(1)>'},
        }
        self.run_fixture([row])
        item = Idiom.objects.get(word=row['word'])
        data = self.client.get(f'/api/idioms/{item.pk}/').json()
        self.assertEqual(item.source_raw, row)
        self.assertEqual(data['source_raw'], row)
        self.assertNotIn('future_field', data)
        self.assertFalse(hasattr(item, 'future_field'))

    def test_non_four_and_anomalous_source_rows_remain_fully_readable(self):
        rows = [
            {'word': '有志者事竟成', 'explanation': '非四字完整解释', 'pinyin': 'yǒu zhì zhě shì jìng chéng', 'derivation': '长词出处', 'example': '', 'abbreviation': 'yzzsjc'},
            {'word': '意气风发', 'explanation': '异常拼音不应删除解释', 'pinyin': 'BROKEN 拼音', 'derivation': '', 'example': '保留例句', 'abbreviation': ''},
            {'word': '意味深长', 'explanation': '', 'pinyin': '', 'derivation': '只有出处仍需保留', 'example': '', 'abbreviation': ''},
        ]
        self.run_fixture(rows)
        self.assertEqual(Idiom.objects.count(), 3)
        for row in rows:
            item = Idiom.objects.get(word=row['word'])
            self.assertFalse(item.game_eligible)
            response = self.client.get(f'/api/idioms/{item.pk}/')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['source_raw'], row)
            self.assertEqual(response.json()['source_explanation'], row['explanation'])
            self.assertFalse(response.json()['source_missing'])

    def test_import_locked_preserves_full_source_explanation_and_raw_snapshot(self):
        original = {'word': '意气风发', 'explanation': '先前完整原文', 'future': '先前字段'}
        item = Idiom.objects.create(word='意气风发', meaning='人工修订释义', source_explanation='先前完整原文', source_raw=original, source='curated', import_locked=True)
        self.run_fixture([{'word': item.word, 'explanation': '新外部解释', 'pinyin': 'yì qì fēng fā', 'future': '新字段'}])
        item.refresh_from_db()
        self.assertEqual(item.meaning, '人工修订释义')
        self.assertEqual(item.source_explanation, '先前完整原文')
        self.assertEqual(item.source_raw, original)
        data = self.client.get(f'/api/idioms/{item.pk}/').json()
        self.assertEqual(data['summary'], '人工修订释义')
        self.assertEqual(data['source_explanation'], '先前完整原文')
        self.assertEqual(data['source_raw'], original)

    def test_manually_edited_xinhua_summary_is_visible_and_source_stays_locked(self):
        original = {'word': '意气风发', 'explanation': '完整原始解释。', 'pinyin': 'yì qì fēng fā', 'derivation': '原始出处', 'example': '原始例句', 'abbreviation': 'yqff'}
        self.run_fixture([original])
        item = Idiom.objects.get(word=original['word'])
        self.assertEqual(item.source, 'chinese-xinhua')
        item.meaning = '人工修改的简明解释。'
        item.import_locked = True
        item.save(update_fields=['meaning', 'import_locked'])
        self.run_fixture([dict(original, explanation='后续来源新解释。')])
        item.refresh_from_db()
        data = self.client.get(f'/api/idioms/{item.pk}/').json()
        self.assertEqual(data['source'], 'chinese-xinhua')
        self.assertEqual(data['summary'], '人工修改的简明解释。')
        self.assertEqual(data['meaning'], '人工修改的简明解释。')
        self.assertEqual(data['source_explanation'], original['explanation'])
        self.assertEqual(data['source_raw'], original)
        self.assertEqual(item.source_explanation, original['explanation'])
        self.assertEqual(item.source_raw, original)

    def test_curated_only_word_reports_missing_source_without_fabricating_original(self):
        item = Idiom.objects.create(word='一心一意', meaning='人工简释。', source='curated')
        data = self.client.get(f'/api/idioms/{item.pk}/').json()
        self.assertEqual(data['summary'], '人工简释。')
        self.assertTrue(data['source_missing'])
        self.assertEqual(data['source_explanation'], '')
        self.assertEqual(data['source_raw'], {})


class SourceExplanationBackfillTests(TestCase):
    def test_backfill_copies_original_not_curated_summary_and_preserves_other_fields(self):
        import importlib
        from django.apps import apps
        original = '  来源长解释。\n包含换行与原始空格。  '
        item = Idiom.objects.create(word='意气风发', meaning='人工短解释', source_raw={'word': '意气风发', 'explanation': original}, import_locked=True, enabled=False)
        populate = importlib.import_module('game.migrations.0007_backfill_source_explanation').populate
        populate(apps, None)
        item.refresh_from_db()
        self.assertEqual(item.source_explanation, original)
        self.assertEqual(item.meaning, '人工短解释')
        self.assertTrue(item.import_locked)
        self.assertFalse(item.enabled)
        self.assertEqual(item.source_raw['explanation'], original)
        populate(apps, None)
        item.refresh_from_db()
        self.assertEqual(item.source_explanation, original)

    def test_backfill_missing_or_malformed_raw_does_not_invent_explanation(self):
        import importlib
        from django.apps import apps
        for n, raw in enumerate([{}, [], {'explanation': None}, {'explanation': 123}]):
            Idiom.objects.create(word=f'回填测试{n}', meaning='人工释义并非来源原文', source_raw=raw, game_eligible=False)
        importlib.import_module('game.migrations.0007_backfill_source_explanation').populate(apps, None)
        self.assertEqual(set(Idiom.objects.values_list('source_explanation', flat=True)), {''})
