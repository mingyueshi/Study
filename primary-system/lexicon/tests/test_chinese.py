import io
import json
from copy import deepcopy
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management import call_command
from catalog.tests import PlatformFixture
from catalog.models import ContentItem, Placement
from lexicon.models import ChineseSenseVersion, ContentEntryLink, ContentLinkSelection, EntryMatch, LexicalEntry, editorial_values
from lexicon.chinese import create_chinese, review_chinese, adopt_chinese, content_presentation, reconfirm_link
from lexicon.services import revise, merge_match
from words.models import LearningTarget, Scenario, ScenarioWord, WordProgress
from words.services import state_payload, set_learned, ProgressConflict
from words.test_targets import release, target
from words.tests import word_row
from learning.models import Progress
from learning.services import save_progress, effective_status, ProgressConflict as LessonConflict


class ChineseTests(PlatformFixture):
    def setUp(self):
        rows = [word_row('bank', '/bæŋk/', 'a financial institution'), word_row('river', '/r/', 'a watercourse')]
        for r in rows: r['gloss_language'] = 'en'
        self.release = release('chinese', rows)
        self.record = self.release.records.get(headword='bank')
        self.goal = target(self.record)
        self.scene = Scenario.objects.create(code='bank', name='Money', zh='钱')
        self.word = ScenarioWord.objects.create(en='bank', scenario=self.scene, target=self.goal)
        self.owner = {'guest_key': 'reader'}
        self.lesson = ContentItem.objects.create(module=self.item.module, kind='word', title='bank', status='published',
            summary='旧副本中文哨兵', body='旧正文哨兵', sections=[{'title': '音标', 'text': '/OLD_SENTINEL/'}],
            source_payload={'ipa': '/RAW_SENTINEL/', 'zh': '原始释义哨兵', 'memo': '独立记忆提示', 'parts': [{'t': 'bank', 'd': '/PART_SENTINEL/'}]})
        Placement.objects.create(item=self.lesson, unit=self.unit)
        self.link = ContentEntryLink.objects.create(content=self.lesson, sense=self.goal.sense,
            pronunciation=self.goal.pronunciation, evidence=self.record)
        self.user = get_user_model().objects.create_user('chinese-student')

    def version(self, text='银行：办理存取款等业务的机构。', previous=None, effect='same', evidence=None, confirm=True):
        record = evidence or self.record
        record.binding.sense.refresh_from_db()
        if record.binding.pronunciation_id: record.binding.pronunciation.refresh_from_db()
        version = create_chinese(evidence_id=record.pk,
            expected_snapshot=editorial_values(record.binding.sense, record.binding.pronunciation),
            text=text, kind='teaching', learning_effect=effect, author_label='样例核对者',
            provenance='隔离测试：核对选定英文义项', change_reason='逐项核对，不改变原始词义', previous_id=previous.pk if previous else None)
        if confirm:
            version = review_chinese(version.pk, expected_revision=0, decision='confirmed', reviewer='测试维护者', note='核对选定义项及中文表达')
        return version

    def adopt(self, version, goal=None):
        goal = goal or self.goal
        goal.refresh_from_db()
        return adopt_chinese(target_id=goal.pk, version_id=version.pk, expected_revision=goal.presentation_revision,
            expected_review_revision=version.review_revision, reason='明确选择所见版本')

    def adopt_link(self, version):
        self.link.refresh_from_db()
        return adopt_chinese(link_id=self.link.pk, version_id=version.pk, expected_revision=self.link.presentation_revision,
            expected_review_revision=version.review_revision, reason='教材同义中文采用')

    def lesson_data(self, **changes):
        data = {'revision': 0, 'status': 'mastered', 'bookmarked': True, 'note': '私人笔记',
                'presentation': content_presentation(self.lesson)[1], 'update_learning': True}
        return {**data, **changes}

    def test_body_is_immutable_and_never_writes_source_language(self):
        version = self.version()
        version.text = '改写正文'
        with self.assertRaises(ValidationError): version.save()
        with self.assertRaises(ValidationError): version.delete()
        self.goal.sense.refresh_from_db()
        self.assertEqual(self.goal.sense.editorial_definition, '')
        self.assertEqual(self.goal.sense.gloss_language, 'en')  # fixture language remains exactly its declared source value
        self.assertEqual(self.record.definition, 'a financial institution')

    def test_draft_withdrawn_other_evidence_and_unknown_not_adoptable(self):
        draft = self.version(confirm=False)
        with self.assertRaises(ValidationError): self.adopt(draft)
        unknown = self.version(effect='unknown', confirm=False)
        with self.assertRaises(ValidationError): review_chinese(unknown.pk, expected_revision=0, decision='confirmed', reviewer='a', note='未判定')
        valid = self.version()
        other = self.version(evidence=self.release.records.get(headword='river'))
        with self.assertRaises(ValidationError): self.adopt(other)
        review_chinese(valid.pk, expected_revision=1, decision='withdrawn', reviewer='核对者', note='撤回保留正文')
        valid.refresh_from_db()
        with self.assertRaises(ValidationError): self.adopt(valid)
        self.assertTrue(ChineseSenseVersion.objects.get(pk=valid.pk).text)

    def test_shared_goal_homograph_isolation_and_seen_version(self):
        version = self.version()
        goal = self.adopt(version)
        scene = Scenario.objects.create(code='second', name='Second', zh='复用')
        ScenarioWord.objects.create(en='bank', target=goal, scenario=scene)
        another = target(self.record)
        ScenarioWord.objects.create(en='bank', target=another, scenario=scene)
        set_learned(self.owner, goal.pk, True, 0, chinese_version_id=version.pk, presentation_revision=1)
        cards = state_payload(self.owner)['words']
        shared = [w for w in cards if w['target_id'] == str(goal.pk)]
        self.assertEqual(len(shared), 2)
        self.assertTrue(all(w['zh'] == version.text and w['learned'] for w in shared))
        self.assertFalse(next(w for w in cards if w['target_id'] == str(another.pk))['learned'])
        row = WordProgress.objects.get()
        self.assertEqual((row.seen_chinese_version_id, row.seen_presentation_revision), (version.pk, 1))
        self.assertFalse(any(w['learned'] for w in state_payload({'user': self.user})['words']))

    def test_same_upgrade_old_page_cas_and_withdrawal_no_fallback(self):
        a = self.version(); goal = self.adopt(a)
        set_learned(self.owner, goal.pk, True, 0, chinese_version_id=a.pk, presentation_revision=1)
        b = self.version('办理存取款等业务的银行。', previous=a); self.adopt(b)
        with self.assertRaises(ProgressConflict):
            set_learned(self.owner, goal.pk, False, 1, chinese_version_id=a.pk, presentation_revision=1)
        row = WordProgress.objects.get(); self.assertEqual(row.seen_chinese_version_id, a.pk)
        self.assertTrue(row.learned)
        review_chinese(b.pk, expected_revision=1, decision='withdrawn', reviewer='a', note='撤回')
        card = state_payload(self.owner)['words'][0]
        self.assertEqual((card['zh'], card['ipa']), ('', ''))
        self.assertNotIn(b.text, json.dumps(card, ensure_ascii=False))
        with self.assertRaises(ProgressConflict):
            set_learned(self.owner, goal.pk, False, 1, chinese_version_id=b.pk, presentation_revision=2)

    def test_changed_chain_cannot_be_laundered_by_same_tail_or_first_adoption(self):
        a = self.version(); self.adopt(a)
        b = self.version('河岸（纠错变义）', previous=a, effect='changed')
        c = self.version('河流的岸边', previous=b)
        with self.assertRaises(ValidationError): self.adopt(b)
        with self.assertRaises(ValidationError): self.adopt(c)
        # A genuinely unused new identity may start at C without inheriting any A/B progress.
        fresh_c = self.adopt(c, target(self.record))
        self.assertFalse(fresh_c.progress_rows.exists())
        fresh = self.adopt(b, target(self.record))
        self.adopt(c, fresh)
        self.assertFalse(fresh.progress_rows.exists())
        # Removing layout doesn't turn an old semantic target back into a new one.
        self.word.delete()
        with self.assertRaises(ValidationError): self.adopt(b)
        unused_version = self.version('旧词卡变义', effect='changed')
        self.goal.refresh_from_db()
        with self.assertRaises(ValidationError): self.adopt(unused_version)

    def test_unadopted_old_goal_cannot_reset_semantics_after_deleting_all_layout(self):
        self.word.delete()
        self.goal.refresh_from_db()
        self.assertTrue(self.goal.semantic_established)
        with self.assertRaises(ValidationError): self.adopt(self.version(effect='changed'))
        self.lesson.placements.all().delete()
        with self.assertRaises(ValidationError): self.adopt_link(self.version(effect='changed'))

    def test_creation_confirmation_adoption_cas_on_editorial_change(self):
        snapshot = deepcopy(self.goal.editorial_snapshot)
        draft = self.version(confirm=False)
        revise(self.goal.sense, value='source correction', note='并发修订', expected_revision=0)
        with self.assertRaises(ValidationError):
            create_chinese(evidence_id=self.record.pk, expected_snapshot=snapshot, text='旧页中文', kind='translation',
                learning_effect='same', author_label='a', provenance='a', change_reason='a')
        with self.assertRaises(ValidationError):
            review_chinese(draft.pk, expected_revision=0, decision='confirmed', reviewer='a', note='旧页核对')
        new = self.version()
        with self.assertRaises(ValidationError): self.adopt(new)

    def test_cross_headword_merge_keeps_fixed_word_and_progress(self):
        version = self.version(); goal = self.adopt(version)
        set_learned(self.owner, goal.pk, True, 0, chinese_version_id=version.pk, presentation_revision=1)
        keep = LexicalEntry.objects.create(language='en', headword='bank-new-headword', kind='word')
        match = EntryMatch.objects.create(left=keep, right=self.goal.sense.entry)
        merge_match(match.pk, reason='稳定Sense归属变化，不更换词卡词形')
        card = state_payload(self.owner)['words'][0]
        self.assertEqual((card['en'], card['zh'], card['learned']), ('bank', version.text, True))
        self.assertEqual(self.client.get(f'/api/v1/items/{self.lesson.pk}/').json()['word_selection']['headword'], 'bank')

    def test_lesson_snapshot_history_and_all_raw_copy_paths_are_sealed(self):
        a = self.version(); self.adopt_link(a)
        self.client.force_login(self.user)
        progress = save_progress(self.user, self.lesson, self.lesson_data())
        self.assertEqual(effective_status(progress), 'mastered')
        self.assertContains(self.client.get(f'/items/{self.lesson.pk}/'), a.text)
        review_chinese(a.pk, expected_revision=1, decision='withdrawn', reviewer='a', note='撤回')
        for url in (f'/items/{self.lesson.pk}/', f'/api/v1/items/{self.lesson.pk}/',
                    f'/api/v1/items/{self.lesson.pk}/lexicon/', '/api/v1/items/', f'/books/{self.collection.code}/'):
            response = self.client.get(url)
            for forbidden in ('旧副本中文哨兵', '旧正文哨兵', '/OLD_SENTINEL/', '/RAW_SENTINEL/', '/PART_SENTINEL/', a.text):
                self.assertNotIn(forbidden, response.content.decode(), url)
        self.assertEqual(effective_status(progress), 'needs_confirmation')
        self.assertContains(self.client.get('/me/'), '依据待确认')
        # 首页学习总览与详情页共用当前有效状态口径：撤回后不计入已掌握。
        textbook = next(area for area in self.client.get('/').context['digest']['areas'] if area['key'] == 'textbook')
        self.assertEqual(textbook['headlines'][1][0], 0)
        self.assertEqual(ContentLinkSelection.objects.filter(link=self.link).count(), 2)

    def test_notes_do_not_recertify_legacy_mastery_or_new_presentation(self):
        old = Progress.objects.create(user=self.user, item=self.lesson, status='mastered', note='旧笔记')
        a = self.version(); self.adopt_link(a)
        row = save_progress(self.user, self.lesson, self.lesson_data(update_learning=False, note='只改笔记'))
        self.assertEqual(row.status, 'mastered'); self.assertIsNone(row.seen_lexicon)
        self.assertEqual(effective_status(row), 'needs_confirmation')
        row = save_progress(self.user, self.lesson, self.lesson_data(revision=1))
        self.assertEqual(effective_status(row), 'mastered')
        seen = deepcopy(row.seen_lexicon)
        b = self.version('银行机构，办理存取款。', previous=a); self.adopt_link(b)
        row = save_progress(self.user, self.lesson, self.lesson_data(revision=2, update_learning=False, status='new'))
        self.assertEqual(row.seen_lexicon, seen); self.assertEqual(row.status, 'mastered')
        self.assertEqual(effective_status(row), 'mastered')
        with self.assertRaises(LessonConflict):
            save_progress(self.user, self.lesson, self.lesson_data(revision=3, presentation=seen))

    def test_reconfirm_requires_explicit_same_meaning_and_exact_seen_snapshot(self):
        before = deepcopy(self.link.editorial_snapshot)
        updated = revise(self.goal.sense, value='equivalent editorial wording', note='同义核对', expected_revision=0)
        self.assertNotContains(self.client.get(f'/items/{self.lesson.pk}/'), 'equivalent editorial wording')
        with self.assertRaises(ValidationError):
            reconfirm_link(self.link.pk, expected_revision=1, expected_snapshot=before, same_meaning=True, reason='旧页面')
        snapshot = editorial_values(updated, self.goal.pronunciation)
        with self.assertRaises(ValidationError):
            reconfirm_link(self.link.pk, expected_revision=1, expected_snapshot=snapshot, same_meaning=False, reason='变义')
        reconfirm_link(self.link.pk, expected_revision=1, expected_snapshot=snapshot, same_meaning=True, reason='明确同义')
        self.assertContains(self.client.get(f'/items/{self.lesson.pk}/'), 'equivalent editorial wording')
        history = self.link.selection_history.order_by('revision')
        self.assertEqual(history.count(), 2); self.assertEqual(history[0].selection['editorial_snapshot'], before)
        changed_pron = revise(self.goal.pronunciation, value='/changed/', note='读音变化', expected_revision=0)
        with self.assertRaises(ValidationError):
            reconfirm_link(self.link.pk, expected_revision=2, expected_snapshot=editorial_values(updated, changed_pron), same_meaning=True, reason='同义不能放宽读音约束')
        self.assertEqual(self.link.selection_history.count(), 2)

    def test_all_visible_slots_and_safe_chinese_search_and_dictionary_teaching(self):
        from lexicon.pages import teaching_items
        a = self.version('金融机构：银行。'); self.adopt_link(a)
        second = self.release.records.get(headword='river')
        link = ContentEntryLink.objects.create(content=self.lesson, slot='secondary', sense=second.binding.sense,
            pronunciation=second.binding.pronunciation, evidence=second)
        v = self.version('河流及其水道。', evidence=second)
        adopt_chinese(link_id=link.pk, version_id=v.pk, expected_revision=0, expected_review_revision=1, reason='明确补充义项')
        page = self.client.get(f'/items/{self.lesson.pk}/')
        self.assertContains(page, a.text); self.assertContains(page, v.text)
        tokens = page.context['form'].initial['presentation']
        self.assertEqual(len(tokens), 2)
        for q in ('金融机构', '河流及其水道'):
            self.assertEqual(self.client.get('/api/v1/catalog/', {'q': q}).json()['total'], 1)
            found = self.client.get('/api/v1/items/', {'q': q}).json()['results']
            self.assertEqual(found[0]['id'], str(self.lesson.pk))
        review_chinese(a.pk, expected_revision=1, decision='withdrawn', reviewer='a', note='暂停')
        self.assertEqual(teaching_items('bank')[0].summary, '')
        self.assertEqual(self.client.get('/api/v1/items/', {'q': '金融机构'}).json()['total'], 0)
        self.assertNotContains(self.client.get('/dictionary/?q=bank'), '旧副本中文哨兵')
        self.assertNotContains(self.client.get('/dictionary/?q=bank'), a.text)
        page = self.client.get(f'/items/{self.lesson.pk}/')
        self.assertContains(page, v.text)
        self.assertContains(page, '需复核')
        self.assertEqual(len(self.client.get(f'/api/v1/items/{self.lesson.pk}/').json()['word_selections']), 2)

    def test_nonword_lesson_displays_every_reference_it_records_as_seen(self):
        # Ordinary lesson keeps its own layout, with a visible selected-vocabulary list.
        record = self.record
        link = ContentEntryLink.objects.create(content=self.item, sense=self.goal.sense,
            pronunciation=self.goal.pronunciation, evidence=record)
        version = self.version('普通教材正文引用的银行中文义项。')
        adopt_chinese(link_id=link.pk, version_id=version.pk, expected_revision=0, expected_review_revision=1, reason='正文引用')
        self.client.force_login(self.user)
        page = self.client.get(f'/items/{self.item.pk}/')
        self.assertContains(page, '本课词义参考')
        self.assertContains(page, version.text)
        self.assertEqual(len(page.context['form'].initial['presentation']), 1)
        data = self.lesson_data(presentation=content_presentation(self.item)[1])
        row = save_progress(self.user, self.item, data)
        self.assertEqual(row.seen_lexicon[0]['chinese_version_id'], str(version.pk))
        data = self.client.get(f'/api/v1/items/{self.item.pk}/').json()
        self.assertEqual(data['lexical_references'][0]['definition'], version.text)
        review_chinese(version.pk, expected_revision=1, decision='withdrawn', reviewer='a', note='暂停')
        self.assertNotContains(self.client.get(f'/items/{self.item.pk}/'), version.text)
        self.assertContains(self.client.get(f'/items/{self.item.pk}/'), '需复核')
        self.assertEqual(effective_status(row), 'needs_confirmation')

    def test_invalid_dependencies_suspend_memo_segments_and_say_but_keep_stored_annotations(self):
        self.word.memo = '旧词义提示哨兵'
        self.word.segments = [{'t': 'bank', 'd': '/SEGMENT_OLD/', 'say': 'OLD_CUSTOM_PRONUNCIATION'}]
        self.word.save()
        self.lesson.source_payload['memo'] = '教材旧词义提示哨兵'
        self.lesson.source_payload['parts'] = [{'t': 'bank', 'd': '/PART_OLD/', 'say': 'OLD_TEXTBOOK_PRON'}]
        self.lesson.save()
        source = self.release.source; source.enabled = False; source.save(update_fields=['enabled'])
        card = state_payload(self.owner)['words'][0]
        self.assertEqual((card['memo'], card['segments']), ('', []))
        html = self.client.get(f'/items/{self.lesson.pk}/').content.decode()
        for value in ('教材旧词义提示哨兵', 'OLD_TEXTBOOK_PRON', '/PART_OLD/'):
            self.assertNotIn(value, html)
        self.word.refresh_from_db(); self.lesson.refresh_from_db()
        self.assertEqual(self.word.memo, '旧词义提示哨兵')
        self.assertEqual(self.lesson.source_payload['memo'], '教材旧词义提示哨兵')

    def test_request_query_count_is_bounded_for_many_progress_rows_and_search(self):
        from django.db import connection
        from django.test.utils import CaptureQueriesContext
        items = [ContentItem(module=self.lesson.module, kind='word', title=f'bank-{i}', status='published', summary='不可用的旧中文') for i in range(80)]
        ContentItem.objects.bulk_create(items)
        Placement.objects.bulk_create([Placement(item=item, unit=self.unit) for item in items])
        ContentEntryLink.objects.bulk_create([ContentEntryLink(content=item, sense=self.goal.sense, pronunciation=self.goal.pronunciation,
            evidence=self.record, editorial_snapshot=self.goal.editorial_snapshot, selected_headword='bank', semantic_established=True) for item in items])
        Progress.objects.bulk_create([Progress(user=self.user, item=item, status='mastered') for item in items])
        self.client.force_login(self.user)
        for url in ('/', '/me/', '/api/v1/items/?q=financial'):
            with CaptureQueriesContext(connection) as queries:
                response = self.client.get(url)
            self.assertEqual(response.status_code, 200)
            # 上界防的是随内容行数增长的 N+1；每张领域卡是常数约 4 条，
            # 领域卡增加（如新增不规则复数卡）时按张数上调。
            self.assertLess(len(queries), 64, (url, len(queries)))

    def test_chinese_source_disable_change_missing_and_rollback_never_fall_back(self):
        from lexicon.services import activate_release
        a = self.version(); goal = self.adopt(a); self.adopt_link(a)
        set_learned(self.owner, goal.pk, True, 0, chinese_version_id=a.pk, presentation_revision=1)
        source = self.release.source; source.enabled = False; source.save(update_fields=['enabled'])
        self.assertEqual(state_payload(self.owner)['words'][0]['zh'], '')
        self.assertNotContains(self.client.get(f'/items/{self.lesson.pk}/'), a.text)
        source.enabled = True; source.save(update_fields=['enabled'])
        self.assertEqual(state_payload(self.owner)['words'][0]['zh'], a.text)
        changed_row = word_row('bank', '/bæŋk/', 'changed source meaning'); changed_row['gloss_language'] = 'en'
        changed = release('chinese-changed', [changed_row], self.release.pk)
        self.assertEqual(state_payload(self.owner)['words'][0]['zh'], '')
        river = word_row('river', '/r/', 'a watercourse'); river['gloss_language'] = 'en'
        missing = release('chinese-missing', [river], changed.pk)
        self.assertEqual(state_payload(self.owner)['words'][0]['zh'], '')
        activate_release(self.release.pk, expected_current=str(missing.pk), reason='回退固定语义')
        card = state_payload(self.owner)['words'][0]
        self.assertEqual(card['zh'], a.text); self.assertTrue(card['learned'])
        self.assertEqual(WordProgress.objects.get().seen_chinese_version_id, a.pk)

    def test_import_replay_preserves_selected_chinese_and_manual_annotations(self):
        import tempfile
        from pathlib import Path
        a = self.version(); self.adopt(a)
        before = (self.goal.pk, self.word.pk, self.word.memo)
        snapshot = {'schema_version':2,'units':[{'id':'bank','name':'Changed incoming name','zh':'输入修改',
            'words':[{'en':'bank','memo':'输入不能覆盖人工提示'}]}]}
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory)/'words.json'; file.write_text(json.dumps(snapshot))
            for dry in (True, False, False):
                call_command('import_scenarios', input=str(file), dry_run=dry, stdout=io.StringIO())
        self.goal.refresh_from_db(); self.word.refresh_from_db()
        self.assertEqual((self.goal.pk,self.word.pk,self.word.memo),before)
        self.assertEqual(self.goal.chinese_version_id,a.pk)
        self.assertEqual(self.goal.presentation_revision,1)

    def test_maintenance_create_dry_run_and_stale_snapshot_are_real_cas(self):
        import tempfile
        from pathlib import Path
        from django.core.management.base import CommandError
        data={'evidence_id':str(self.record.pk),'expected_snapshot':self.goal.editorial_snapshot,
              'text':'银行机构','kind':'translation','learning_effect':'same','author_label':'维护者',
              'provenance':'明确选定义项','change_reason':'同义'}
        before=ChineseSenseVersion.objects.count()
        with tempfile.TemporaryDirectory() as directory:
            file=Path(directory)/'draft.json';file.write_text(json.dumps(data))
            call_command('chinese_sense','create',input=str(file),dry_run=True,stdout=io.StringIO())
            self.assertEqual(ChineseSenseVersion.objects.count(),before)
            revise(self.goal.sense,value='unseen revision',note='并发修订',expected_revision=0)
            with self.assertRaises(CommandError):
                call_command('chinese_sense','create',input=str(file),stdout=io.StringIO())
        self.assertEqual(ChineseSenseVersion.objects.count(),before)

    def test_schema_and_child_seen_payload_are_required(self):
        self.client.force_login(self.user)
        data = {'schema_version': 2, 'target_id': str(self.goal.pk), 'learned': True, 'revision': 0}
        self.assertEqual(self.client.post('/words/api/learn/', json.dumps(data), content_type='application/json').status_code, 409)
        data['schema_version'] = 3
        self.assertEqual(self.client.post('/words/api/learn/', json.dumps(data), content_type='application/json').status_code, 409)
        data.update(chinese_version_id=None, presentation_revision=0)
        self.assertEqual(self.client.post('/words/api/learn/', json.dumps(data), content_type='application/json').status_code, 200)
        self.assertFalse(WordProgress.objects.filter(guest_key='reader').exists())
        url = f'/api/v1/me/progress/{self.lesson.pk}/'
        legacy = {'revision': 0, 'status': 'mastered', 'bookmarked': True, 'note': '旧页'}
        self.assertEqual(self.client.post(url, legacy, content_type='application/json').status_code, 409)
        data = self.lesson_data()
        self.assertEqual(self.client.post(url, data, content_type='application/json').status_code, 200)
