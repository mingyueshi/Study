import copy
import hashlib
import json
import re
from unittest.mock import patch

from django.contrib.staticfiles import finders
from django.test import SimpleTestCase, TestCase
from django.urls import reverse

from .content import InvalidContent, SOURCE_DIR, load_library, note_span, prepare_article, registered_ids, validate_library


class ClassicalContentTests(SimpleTestCase):
    def setUp(self):
        self.catalog = json.loads((SOURCE_DIR / 'catalog.json').read_text())
        self.articles = [json.loads((SOURCE_DIR / f'{slug}.json').read_text()) for slug in registered_ids(self.catalog)]

    def test_curated_library_and_complete_twenty_book_collection(self):
        articles = validate_library(self.catalog, self.articles)
        self.assertEqual(len(articles), 112)
        self.assertEqual(sum(len(article['sentences']) for article in articles), 1054)
        self.assertEqual(sum(len(article['questions']) for article in articles), 367)
        self.assertEqual([article['title'] for article in articles if article['curriculum']], ['精卫填海', '王戎不取道旁李'])
        self.assertEqual(sum(bool(article.get('source_ref')) for article in articles), 108)
        self.assertNotIn('lunyu', [article['id'] for article in articles])

    def test_tengwanggexu_covers_pinned_prose_and_separates_the_poem(self):
        _, articles = load_library()
        article = next(row for row in articles if row['id'] == 'tengwanggexu')
        original = json.loads((SOURCE_DIR / 'tengwanggexu' / 'original.json').read_text())
        self.assertEqual(original['sha256'], '30ce9f53ab5df3b487aa5e73b9ec873bbedd41b8b4ba73bf966bce2663aee6fb')
        self.assertEqual(hashlib.sha256(''.join(original['paragraphs']).encode()).hexdigest(), original['sha256'])
        self.assertEqual(article['source']['url'], original['source_url'])
        self.assertEqual(len(article['sections']), 8)
        self.assertEqual(len(article['sentences']), 71)
        by_id = {row['id']: row for row in article['sentences']}
        for section, paragraph in zip(article['sections'][:7], original['paragraphs']):
            self.assertEqual(''.join(by_id[id]['text'] for id in section['sentences']), paragraph)
        poem = article['sections'][-1]
        self.assertEqual(poem['id'], 'poem')
        self.assertEqual(poem['sentences'], ['s68', 's69', 's70', 's71'])
        self.assertNotIn('source_ref', article)
        for id in poem['sentences']:
            self.assertEqual(by_id[id]['reference']['source_ref']['anchor_text'], by_id[id]['text'])
        for section in article['sections']:
            questions = [q for q in article['questions'] if q['sentence'] in section['sentences']]
            self.assertEqual([q['type'] for q in questions], ['choice', 'choice', 'selfcheck'])

    def test_long_article_rejects_section_gaps_reordering_and_unbalanced_practice(self):
        for mutation in ('gap', 'duplicate', 'order', 'empty', 'missing-title', 'question-count', 'unknown-sentence'):
            articles = copy.deepcopy(self.articles)
            article = next(row for row in articles if row['id'] == 'tengwanggexu')
            sections = article['sections']
            if mutation == 'gap': sections[0]['sentences'].pop()
            elif mutation == 'duplicate': sections[1]['sentences'].insert(0, 's1')
            elif mutation == 'order': sections.reverse()
            elif mutation == 'empty': sections[0]['sentences'] = []
            elif mutation == 'missing-title': del sections[0]['title']
            elif mutation == 'question-count': article['questions'].pop()
            else: article['questions'][-1]['sentence'] = 'missing'
            with self.subTest(mutation=mutation), self.assertRaises(InvalidContent):
                validate_library(self.catalog, articles)

    def test_daodejing_covers_all_chapters_and_matches_its_pinned_originals(self):
        catalog, articles = load_library()
        collection = next(row for row in catalog['collections'] if row['id'] == 'daodejing')
        self.assertEqual(collection['part_label'], '章')
        self.assertEqual([part['id'] for part in collection['parts']], [f'daodejing-{n:02d}' for n in range(1, 82)])
        selected = [row for row in articles if row['id'].startswith('daodejing-')]
        self.assertEqual(sum(len(row['sentences']) for row in selected), 428)
        self.assertEqual(sum(len(row['questions']) for row in selected), 243)
        for number, article in enumerate(selected, 1):
            pin = article['source_ref']
            self.assertEqual(pin['locator'], f'/content/{number - 1}')
            original = re.sub(r'\([^()]*\)', '', pin['anchor_text'])
            rendered = ''.join(row['text'] for row in article['sentences'])
            self.assertEqual(''.join(re.findall(r'[\u3400-\u9fff]', original)), ''.join(re.findall(r'[\u3400-\u9fff]', rendered)))
            self.assertEqual([q['type'] for q in article['questions']], ['choice', 'choice', 'selfcheck'])
            self.assertTrue(all(row['reference']['source_ref']['locator'] == pin['locator'] for row in article['sentences']))
        chapter11 = next(row for row in selected if row['id'] == 'daodejing-11')
        referents = [next(note for note in unit['notes'] if note['kind'] == 'referent')['refers_to'] for unit in chapter11['sentences'][:3]]
        self.assertEqual(referents, ['轮毂中安放车轴的空处', '器皿中可以容物的空处', '房屋中可供出入、居住的空处'])
        self.assertEqual(len(next(row for row in selected if row['id'] == 'daodejing-18')['sentences']), 4)
        self.assertIn('独立思考', next(row for row in selected if row['id'] == 'daodejing-65')['intro'])

    def test_full_book_metadata_rejects_invalid_units_and_volume_targets(self):
        for mutation in ('unit', 'target', 'duplicate'):
            catalog = copy.deepcopy(self.catalog)
            selected = next(row for row in catalog['collections'] if row['id'] == 'daodejing')
            if mutation == 'unit':
                selected['part_label'] = '页'
            elif mutation == 'target':
                selected['landmarks'][0]['article'] = 'lunyu-xueer'
            else:
                selected['landmarks'].append(copy.deepcopy(selected['landmarks'][0]))
            with self.subTest(mutation=mutation), self.assertRaises(InvalidContent):
                validate_library(catalog, self.articles)

    def test_daodejing_translations_stay_aligned_across_semicolons_and_questions(self):
        _, articles = load_library()
        chapter15 = next(row for row in articles if row['id'] == 'daodejing-15')['sentences']
        self.assertIn('孰能浊', chapter15[1]['text'])
        self.assertIn('谁能使浑水', chapter15[1]['translation'])
        self.assertIn('安静的事物', chapter15[2]['translation'])
        self.assertEqual(chapter15[3]['translation'], '保持这种道的人不求自满。')
        chapter20 = next(row for row in articles if row['id'] == 'daodejing-20')['sentences']
        self.assertIn('儡儡', chapter20[5]['text'])
        self.assertIn('疲倦无依', chapter20[5]['translation'])
        self.assertIn('众人都有余裕', chapter20[6]['translation'])
        self.assertIn('愚拙的心', chapter20[7]['translation'])
        self.assertEqual(chapter20[11]['translation'], '众人都各有打算，唯独我朴拙。')
        self.assertIn('珍重养护万物的根本', chapter20[12]['translation'])

    def test_collection_covers_native_edition_in_order_and_reuses_six_units(self):
        catalog, articles = load_library()
        group = catalog['collections'][0]
        expected = [16, 24, 26, 26, 28, 30, 38, 21, 31, 28, 26, 24, 30, 44, 42, 14, 26, 11, 25, 3]
        self.assertEqual([part['count'] for part in group['parts']], expected)
        self.assertEqual(sum(expected), 513)
        originals = {row['id']: row for row in self.articles}
        selected = originals['lunyu']
        reused = []
        for book, part in enumerate(group['parts']):
            article = next(row for row in articles if row['id'] == part['id'])
            self.assertEqual(article['source_ref']['locator'], f'/content/{book}')
            for raw, unit in zip(originals[part['id']]['sentences'], article['sentences']):
                if 'reuse' in raw:
                    reused.append(raw['reuse']['sentence'])
                    original = next(row for row in selected['sentences'] if row['id'] == raw['reuse']['sentence'])
                    self.assertEqual(unit['translation'], original['translation'])
                    self.assertEqual(unit['notes'], original['notes'])
        self.assertEqual(sorted(reused), ['s1', 's2', 's3', 's4', 's5', 's6'])
        self.assertEqual(catalog['retired_targets']['lunyu']['units']['s5'], {'article': 'lunyu-shuer', 'sentence': 's22'})
        self.assertEqual(next(row for row in articles if row['id'] == 'lunyu-xiangdang')['sentences'][25]['translation'],
                         '有丰盛的菜肴时，孔子一定神色郑重地站起来；遇到疾雷大风时，也一定改变态度。')
        self.assertIn('平等尊重', next(row for row in articles if row['id'] == 'lunyu-yanghuo')['sentences'][24]['explanation'])

    def test_collection_rejects_gaps_text_drift_and_invalid_reuse(self):
        def first_book(articles):
            return next(article for article in articles if article['id'] == 'lunyu-xueer')

        mutations = (
            lambda c, a: c['collections'][0]['parts'][0].update(count=15),
            lambda c, a: c['collections'][0]['parts'][0].update(text_sha256='0' * 64),
            lambda c, a: c['collections'][0]['parts'][1].update(id=c['collections'][0]['parts'][0]['id']),
            lambda c, a: first_book(a)['sentences'][0]['reuse'].update(sentence='missing'),
            lambda c, a: first_book(a)['sentences'][0]['reuse'].update(article='lunyu-xueer'),
            lambda c, a: first_book(a)['sentences'][0].update(text='私自覆盖复用正文'),
            lambda c, a: first_book(a)['sentences'].reverse(),
            lambda c, a: first_book(a)['edition'].update(revision='main'),
            lambda c, a: c['retired_articles'][0].update(collection='missing'),
            lambda c, a: c['articles'].append('lunyu'),
            lambda c, a: c['retired_articles'][0].update(id='../outside'),
        )
        for mutate in mutations:
            with self.subTest(mutation=mutate):
                catalog, articles = copy.deepcopy(self.catalog), copy.deepcopy(self.articles)
                mutate(catalog, articles)
                with self.assertRaises(InvalidContent):
                    validate_library(catalog, articles)

    def test_lunyu_units_keep_their_own_chapter_sources(self):
        article = next(row for row in self.articles if row['id'] == 'lunyu')
        self.assertEqual(article['unit_label'], '则')
        self.assertEqual(len(article['sentences']), 6)
        self.assertEqual([row['reference']['source_ref']['locator'] for row in article['sentences']],
                         ['/content/0', '/content/1', '/content/1', '/content/0', '/content/6', '/content/14'])
        for mutation in ('missing', 'bad-url', 'bad-pin', 'unit'):
            articles = copy.deepcopy(self.articles)
            selected = next(row for row in articles if row['id'] == 'lunyu')
            reference = selected['sentences'][0]['reference']
            if mutation == 'missing':
                del selected['sentences'][0]['reference']
            elif mutation == 'bad-url':
                reference['url'] = 'javascript:alert(1)'
            elif mutation == 'bad-pin':
                reference['source_ref']['sha256'] = 'bad'
            else:
                selected['unit_label'] = '章句'
            with self.subTest(mutation=mutation), self.assertRaises(InvalidContent):
                validate_library(self.catalog, articles)

    def test_repeated_pronouns_have_distinct_positions_and_meanings(self):
        article = next(row for row in self.articles if row['id'] == 'xueyi')
        sentence = article['sentences'][2]
        notes = [note for note in sentence['notes'] if note['kind'] == 'referent']
        self.assertEqual([note['refers_to'] for note in notes], ['弈秋的教导', '鸿鹄'])
        self.assertNotEqual(note_span(sentence, notes[0]), note_span(sentence, notes[1]))
        rendered = prepare_article(article)['sentences'][2]
        self.assertEqual(''.join(part['text'] for part in rendered['parts']), sentence['text'])

    def test_bad_references_breaks_answers_and_markup_are_rejected(self):
        mutations = (
            lambda article: article['sentences'][0].update(chunks=['缺了文字']),
            lambda article: article['sentences'][0]['notes'][0].update(quote='不存在的词'),
            lambda article: article['questions'][0].update(answer=True),
            lambda article: article['questions'][0].update(answer=99),
            lambda article: article['questions'][0].update(sentence='s99'),
            lambda article: article['sentences'][0].update(translation='<script>'),
            lambda article: article.update(source_ref={'version': 'x'}),
            lambda article: article['sentences'][0]['notes'][0].update(occurrence=99),
            lambda article: article['sentences'][0].update(hints=['不存在']),
        )
        for mutate in mutations:
            with self.subTest(mutation=mutate):
                articles = copy.deepcopy(self.articles)
                mutate(articles[0])
                with self.assertRaises(InvalidContent):
                    validate_library(self.catalog, articles)

    def test_duplicate_ids_and_path_traversal_are_rejected(self):
        self.catalog['articles'][0] = '../outside'
        with self.assertRaises(InvalidContent):
            validate_library(self.catalog, self.articles)


class ClassicalPageTests(SimpleTestCase):
    def test_tengwanggexu_section_links_and_print_scopes_keep_global_numbers(self):
        url = reverse('classical-detail', args=['tengwanggexu'])
        response = self.client.get(url, {'section': 'p3', 'mode': 'recite'})
        self.assertEqual(response.context['initial_section'], 'p3')
        self.assertContains(response, 'data-speak-section="p3"')
        self.assertContains(response, 'id="section-poem"')
        self.assertEqual(len(response.context['article']['sentences']), 71)
        self.assertEqual(len(response.context['article']['questions']), 24)
        print_url = reverse('classical-print', args=['tengwanggexu'])
        for view in ('original', 'study', 'practice', 'answers'):
            printed = self.client.get(print_url, {'section': 'p3', 'view': view})
            self.assertEqual([row['number'] for row in printed.context['article']['sentences']], list(range(19, 27)))
            self.assertEqual([row['number'] for row in printed.context['article']['questions']], [7, 8, 9])
            self.assertContains(printed, '第三段 · 江天秋色')
            self.assertNotContains(printed, '豫章故郡')
            self.assertNotContains(printed, '串起整篇')
            if view == 'practice':
                self.assertNotContains(printed, '参考答案')
                self.assertNotContains(printed, '鹜读 wù')
            if view == 'answers':
                self.assertContains(printed, '7. ')
                self.assertContains(printed, '第 24 句')
        poem = self.client.get(print_url, {'section': 'poem', 'view': 'original'})
        self.assertContains(poem, '珮玉鸣鸾罢歌舞')
        self.assertNotContains(poem, '请洒潘江')
        for query in ({'section': 'missing'}, {'section': ''}, {'section': 'p3', 'unit': 's24'}):
            self.assertEqual(self.client.get(print_url, query).status_code, 404)
        self.assertEqual(self.client.get(url, {'section': 'missing'}).status_code, 404)
        # 序文无原典定位，不查数据库，也不误连附诗。
        fallback = self.client.get(reverse('classical-source', args=['tengwanggexu']))
        self.assertContains(fallback, '本机原典暂未就绪')
        self.assertContains(fallback, 'oldid=12697857')

    def test_all_pages_and_print_variants_work_without_a_database(self):
        _, articles = load_library()
        for article in articles:
            url = reverse('classical-detail', args=[article['id']])
            response = self.client.get(url)
            self.assertContains(response, article['title'])
            self.assertContains(response, 'data-sidebar-layout=".cw-sidebar"')
            self.assertContains(response, 'id="classical-data"')
            for sentence in article['sentences']:
                self.assertContains(response, f'id="line-{sentence["id"]}"')
                self.assertContains(response, sentence['translation'])
                for note in sentence['notes']:
                    self.assertContains(response, f'id="note-{sentence["id"]}-{note["id"]}"')
                    self.assertContains(response, note['meaning'])
            for view in ('original', 'study', 'practice', 'answers'):
                printed = self.client.get(reverse('classical-print', args=[article['id']]), {'view': view})
                self.assertContains(printed, article['title'])
                self.assertNotContains(printed, 'classical-data')
                if view == 'practice':
                    self.assertNotContains(printed, '参考答案：')
                    self.assertNotContains(printed, '解析：')
                    self.assertNotContains(printed, 'data-answer')
                if view == 'answers':
                    for question in prepare_article(article)['questions']:
                        self.assertContains(printed, question['explanation'])
            self.assertEqual(self.client.post(url).status_code, 405)
        for asset in ('classical/classical.css', 'classical/classical.js', 'classical/print.css', 'classical/print.js', 'icons/classical.svg'):
            self.assertTrue(finders.find(asset), asset)

    def test_filters_compose_and_invalid_filters_fall_back(self):
        response = self.client.get(reverse('classical'), {'curriculum': '4a'})
        self.assertEqual([row['id'] for row in response.context['articles']], ['jingwei', 'wangrong'])
        response = self.client.get(reverse('classical'), {'level': 'challenge', 'skill': 'referent', 'q': '弈秋'})
        self.assertEqual([row['id'] for row in response.context['articles']], ['xueyi'])
        response = self.client.get(reverse('classical'), {'level': '<script>', 'genre': 'unknown', 'skill': 'x'})
        self.assertEqual(len(response.context['articles']), 11)
        self.assertNotContains(response, '<script>')
        self.assertContains(self.client.get(reverse('classical'), {'q': '没有这篇文章'}), '这次还没有找到')

    def test_deep_links_and_unknown_articles(self):
        url = reverse('classical-detail', args=['xueyi'])
        response = self.client.get(url, {'mode': 'recite', 'line': 's3'})
        self.assertContains(response, 'data-initial-mode="recite"')
        self.assertContains(response, 'data-initial-line="s3"')
        response = self.client.get(url, {'mode': 'bad', 'line': 's99'})
        self.assertContains(response, 'data-initial-mode="read"')
        self.assertContains(response, 'data-initial-line=""')
        for route in ('classical-detail', 'classical-print', 'classical-source'):
            self.assertEqual(self.client.get(reverse(route, args=['unknown'])).status_code, 404)
        self.assertEqual(self.client.get(reverse('classical-print', args=['xueyi']), {'view': 'bad'}).context['print_view'], 'study')
        self.assertEqual(self.client.post(reverse('classical')).status_code, 405)

    def test_retired_selection_redirects_to_full_book_without_duplicate_entries(self):
        response = self.client.get(reverse('classical'), {'q': '论语'})
        self.assertEqual(len(response.context['articles']), 20)
        self.assertNotContains(response, '论语六则')
        for slug in ('lunyu-xueer', 'lunyu-yaoyue'):
            self.assertNotContains(self.client.get(reverse('classical-detail', args=[slug])), '入门六则')
        book_url = reverse('classical-book', args=['lunyu'])
        self.assertNotContains(self.client.get(book_url), '入门六则')
        for route in ('classical-detail', 'classical-print', 'classical-source'):
            self.assertRedirects(self.client.get(reverse(route, args=['lunyu'])), book_url, status_code=301, fetch_redirect_response=False)
        targets = load_library()[0]['retired_targets']['lunyu']['units']
        for old, target in targets.items():
            expected = reverse('classical-detail', args=[target['article']]) + '?line=' + target['sentence'] + '#line-' + target['sentence']
            self.assertRedirects(self.client.get(reverse('classical-detail', args=['lunyu']), {'line': old}), expected, status_code=301, fetch_redirect_response=False)
        self.assertRedirects(self.client.get(reverse('classical-detail', args=['lunyu']), {'line': 's5', 'mode': 'recite'}),
                             '/classical/lunyu-shuer/?line=s22&mode=recite#line-s22', status_code=301, fetch_redirect_response=False)
        self.assertRedirects(self.client.get(reverse('classical-print', args=['lunyu']), {'unit': 's6', 'view': 'study'}),
                             '/classical/lunyu-weilinggong/print/?unit=s24&view=study', status_code=301, fetch_redirect_response=False)
        self.assertRedirects(self.client.get(reverse('classical-source', args=['lunyu']), {'line': 's3'}),
                             '/classical/lunyu-weizheng/source/?line=s17', status_code=301, fetch_redirect_response=False)
        for route, parameter in (('classical-detail', 'line'), ('classical-print', 'unit'), ('classical-source', 'line')):
            self.assertEqual(self.client.get(reverse(route, args=['lunyu']), {parameter: 's99'}).status_code, 404)

    def test_full_book_navigation_search_and_single_unit_printing(self):
        book_url = reverse('classical-book', args=['lunyu'])
        response = self.client.get(book_url)
        self.assertContains(response, '513')
        self.assertEqual(len(response.context['articles']), 20)
        response = self.client.get(book_url, {'q': '温故'})
        self.assertIn(('lunyu-weizheng', 's11'), [(m['article']['id'], m['unit']['id']) for m in response.context['matches']])
        for page, number in (('bad', 1), ('999', 999)):
            response = self.client.get(book_url, {'q': '之', 'page': page})
            matches = response.context['matches']
            self.assertEqual(matches.number, 1 if page == 'bad' else matches.paginator.num_pages)
            self.assertLessEqual(len(matches), 30)
        for slug in ('lunyu-xueer', 'lunyu-yaoyue'):
            response = self.client.get(reverse('classical-detail', args=[slug]))
            self.assertEqual(len(response.context['articles']), 20)
            self.assertContains(response, '按章句跳读')
        self.assertIsNone(self.client.get(reverse('classical-detail', args=['lunyu-xueer'])).context['previous'])
        self.assertIsNone(self.client.get(reverse('classical-detail', args=['lunyu-yaoyue'])).context['following'])
        printed = self.client.get(reverse('classical-print', args=['lunyu-weizheng']), {'view': 'study', 'unit': 's11'})
        self.assertContains(printed, '第 11 则')
        self.assertContains(printed, '温故而知新')
        self.assertNotContains(printed, '君子不器')
        self.assertNotContains(printed, '串起整篇')
        self.assertEqual(self.client.get(reverse('classical-print', args=['lunyu-weizheng']), {'unit': 's999'}).status_code, 404)
        self.assertEqual(self.client.get(reverse('classical-book', args=['missing'])).status_code, 404)
        self.assertEqual(self.client.post(book_url).status_code, 405)

    def test_no_script_reading_keeps_answers_and_local_sources_optional(self):
        response = self.client.get(reverse('classical-detail', args=['xueyi']))
        self.assertContains(response, '<details class="cw-translation">', html=False)
        self.assertContains(response, '查看参考答案与解析')
        self.assertContains(response, reverse('classical-source', args=['xueyi']))
        # 没有本机定位的篇目不查库，仍能解释如何查原典。
        self.assertContains(self.client.get(reverse('classical-source', args=['simaguang'])), '本机原典暂未就绪')

    def test_daodejing_directory_search_navigation_and_sentence_printing(self):
        url = reverse('classical-book', args=['daodejing'])
        response = self.client.get(url)
        self.assertEqual(len(response.context['articles']), 81)
        self.assertEqual(response.context['question_count'], 243)
        self.assertContains(response, '#book-daodejing-38')
        self.assertContains(response, '道德经八十一章目录')
        self.assertNotContains(response, '从《学而》读起')
        response = self.client.get(url, {'q': '上善若水'})
        self.assertEqual([(match['article']['id'], match['unit']['id']) for match in response.context['matches']], [('daodejing-08', 's1')])
        response = self.client.get(url, {'q': '千里远行'})
        self.assertEqual([(match['article']['id'], match['unit']['id']) for match in response.context['matches']], [('daodejing-64', 's3')])
        response = self.client.get(reverse('classical-detail', args=['daodejing-11']), {'line': 's3'})
        self.assertEqual(len(response.context['articles']), 81)
        self.assertContains(response, 'data-initial-line="s3"')
        self.assertContains(response, '打印这一句')
        self.assertIsNone(self.client.get(reverse('classical-detail', args=['daodejing-01'])).context['previous'])
        self.assertIsNone(self.client.get(reverse('classical-detail', args=['daodejing-81'])).context['following'])
        printed = self.client.get(reverse('classical-print', args=['daodejing-11']), {'view': 'study', 'unit': 's3'})
        self.assertContains(printed, '房屋中可供出入、居住的空处')
        self.assertContains(printed, '第 3 句')
        self.assertNotContains(printed, '第 3 则')
        self.assertNotContains(printed, '揉和黏土做成器皿')


class ClassicalIntegrationTests(TestCase):
    def test_daodejing_sources_keep_the_exact_chapter_and_fingerprint(self):
        from poetry.models import PoetryDocument, PoetryText
        from reference_library.models import Dataset

        _, articles = load_library()
        article = next(row for row in articles if row['id'] == 'daodejing-08')
        pin = article['source_ref']
        document = PoetryDocument.objects.create(version=pin['version'], path=pin['path'], sha256=pin['sha256'], layer='simplified', collection='诸子百家', original_data={})
        original = PoetryText.objects.create(document=document, locator=pin['locator'], title='道经·第八章', body=pin['anchor_text'])
        url = reverse('classical-source', args=['daodejing-08'])
        with patch.object(Dataset.objects, 'filter') as datasets:
            datasets.return_value.values_list.return_value = ['poetry', 'ancient-classics']
            self.assertRedirects(self.client.get(url, {'line': 's2'}), reverse('poetry-detail', args=[original.pk]), fetch_redirect_response=False)
            document.sha256 = '0' * 64
            document.save(update_fields=['sha256'])
            self.assertContains(self.client.get(url), '本机原典暂未就绪')

    def test_chinese_entry_and_existing_courses_link_to_the_hall(self):
        url = reverse('classical')
        self.assertContains(self.client.get(reverse('home'), {'area': 'chinese'}), f'href="{url}"')
        self.assertNotContains(self.client.get(reverse('home'), {'area': 'science'}), f'href="{url}"')
        self.assertContains(self.client.get(reverse('literature-study')), f'href="{url}"')
        self.assertContains(self.client.get(reverse('chinesebook-book', args=['4a'])), f'href="{url}?curriculum=4a"')

    def test_original_source_requires_ready_dataset_and_exact_pin(self):
        from poetry.models import PoetryDocument, PoetryText
        from reference_library.models import Dataset

        _, articles = load_library()
        article = next(row for row in articles if row['id'] == 'xueyi')
        pin = article['source_ref']
        document = PoetryDocument.objects.create(version=pin['version'], path=pin['path'], sha256=pin['sha256'], layer='simplified', collection='儒家经典', original_data={})
        row = PoetryText.objects.create(document=document, locator=pin['locator'], title='告子章句上·第九节', body=pin['anchor_text'])
        url = reverse('classical-source', args=['xueyi'])
        # 就绪状态缺失时，不把读者送往不完整资料。
        self.assertContains(self.client.get(url), '本机原典暂未就绪')
        with patch('classical.views.library', return_value=load_library()), patch.object(Dataset.objects, 'filter') as datasets:
            datasets.return_value.values_list.return_value = ['poetry', 'ancient-classics']
            self.assertRedirects(self.client.get(url), reverse('poetry-detail', args=[row.pk]), fetch_redirect_response=False)
            row.body = '正文发生变化'
            row.save(update_fields=['body'])
            self.assertContains(self.client.get(url), '本机原典暂未就绪')
            row.body = pin['anchor_text']
            row.save(update_fields=['body'])
            document.sha256 = '0' * 64
            document.save(update_fields=['sha256'])
            self.assertContains(self.client.get(url), '本机原典暂未就绪')

    def test_lunyu_source_resolves_the_selected_unit_only(self):
        from poetry.models import PoetryDocument, PoetryText
        from reference_library.models import Dataset

        _, articles = load_library()
        article = next(row for row in articles if row['id'] == 'lunyu-shuer')
        pin = article['sentences'][21]['reference']['source_ref']
        document = PoetryDocument.objects.create(version=pin['version'], path=pin['path'], sha256=pin['sha256'], layer='simplified', collection='儒家经典', original_data={})
        row = PoetryText.objects.create(document=document, locator=pin['locator'], title='述而篇', body=pin['anchor_text'])
        url = reverse('classical-source', args=['lunyu-shuer'])
        with patch.object(Dataset.objects, 'filter') as datasets:
            datasets.return_value.values_list.return_value = ['poetry', 'ancient-classics']
            self.assertRedirects(self.client.get(url, {'line': 's22'}), reverse('poetry-detail', args=[row.pk]), fetch_redirect_response=False)
            self.assertContains(self.client.get(url, {'line': 's2'}), '本机原典暂未就绪')
            self.assertEqual(self.client.get(url, {'line': 's99'}).status_code, 404)
            self.assertContains(self.client.get(url), '本机原典暂未就绪')
            document.sha256 = '0' * 64
            document.save(update_fields=['sha256'])
            self.assertContains(self.client.get(url, {'line': 's22'}), '本机原典暂未就绪')
