from copy import deepcopy

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, TestCase
from django.urls import reverse

from .content import TRACKS, load_data, validate
from .puzzles import logic_solutions, magic_valid, sudoku_solutions


class ContentTests(SimpleTestCase):
    def test_five_routes_three_levels_and_forty_five_hints(self):
        data = load_data()
        self.assertEqual(tuple(t['id'] for t in data['tracks']), TRACKS)
        self.assertEqual(sum(len(t['methods']) for t in data['tracks']), 15)
        self.assertEqual(sum(len(d['hints']) for t in data['tracks'] for d in t['drills']), 45)
        self.assertEqual([d['puzzle']['size'] for d in data['tracks'][1]['drills']], [4, 6, 9])

    def test_rejects_broken_structure_and_unsafe_text(self):
        for problem in ('id', 'duplicate', 'level', 'kind', 'hints', 'html', 'source', 'schema'):
            data = deepcopy(load_data()); track = data['tracks'][0]; drill = track['drills'][0]
            if problem == 'id': track['id'] = 'other'
            elif problem == 'duplicate': track['drills'][1]['id'] = drill['id']
            elif problem == 'level': drill['level'] = True
            elif problem == 'kind': drill['kind'] = 'mental'
            elif problem == 'hints': drill['hints'] = ['只有一步']
            elif problem == 'html': drill['prompt'] = '<img src=x>'
            elif problem == 'source': track['sources'][0]['url'] = 'javascript:bad'
            else: data['schema_version'] = True
            with self.subTest(problem=problem), self.assertRaises(ImproperlyConfigured):
                validate(data)

    def test_rejects_non_unique_and_inconsistent_logic(self):
        for problem in ('ambiguous', 'wrong-answer', 'range'):
            data = deepcopy(load_data()); p = data['tracks'][0]['drills'][0]['puzzle']
            if problem == 'ambiguous': p['constraints'] = p['constraints'][:1]
            elif problem == 'wrong-answer': p['solution'].reverse()
            else: p['constraints'][0]['value'] = 8
            with self.subTest(problem=problem), self.assertRaises(ImproperlyConfigured):
                validate(data)

    def test_rejects_bad_sudoku_givens_boxes_and_multiple_solutions(self):
        for problem in ('contradiction', 'ambiguous', 'box', 'boolean', 'length'):
            data = deepcopy(load_data()); p = data['tracks'][1]['drills'][0]['puzzle']
            if problem == 'contradiction': p['givens'][0] = p['solution'][0] % 4 + 1
            elif problem == 'ambiguous': p['givens'] = [p['solution'][0]] + [0] * 15
            elif problem == 'box': p['box_cols'] = 3
            elif problem == 'boolean': p['givens'][0] = True
            else: p['givens'].pop()
            with self.subTest(problem=problem), self.assertRaises(ImproperlyConfigured):
                validate(data)

    def test_rejects_incorrect_magic_pattern_and_mental_answers(self):
        for index in (2, 3, 4):
            data = deepcopy(load_data()); p = data['tracks'][index]['drills'][0]['puzzle']
            if index == 2: p['solution'] = list(range(1, 10)); p['givens'] = [1] + [0] * 8
            elif index == 3: p['answer'][0] += 1
            else: p['answer'] += 1
            with self.subTest(track=index), self.assertRaises(ImproperlyConfigured):
                validate(data)
        data = deepcopy(load_data())
        data['tracks'][3]['drills'][1]['puzzle']['shown'][0] = True
        with self.assertRaises(ImproperlyConfigured):
            validate(data)

    def test_solvers_check_constraints_and_magic_diagonals(self):
        data = load_data()
        self.assertEqual(len(logic_solutions(data['tracks'][0]['drills'][2]['puzzle'])), 1)
        p = deepcopy(data['tracks'][1]['drills'][0]['puzzle'])
        p['givens'] = [1, 1] + [0] * 14
        self.assertEqual(sudoku_solutions(p), [])
        self.assertFalse(magic_valid([1, 5, 9, 6, 7, 2, 8, 3, 4], 3))
        self.assertTrue(magic_valid([8, 3, 4, 1, 5, 9, 6, 7, 2], 3))


class PageTests(TestCase):
    def test_math_square_links_the_camp(self):
        page = self.client.get(reverse('home'), {'area': 'math'})
        self.assertContains(page, '数学思维训练营')
        self.assertContains(page, reverse('math-camp'))

    def test_all_pages_are_read_only_and_do_not_create_guest_sessions(self):
        for url in [reverse('math-camp'), *(reverse('math-camp-track', args=[t]) for t in TRACKS)]:
            with self.subTest(url=url):
                page = self.client.get(url)
                self.assertEqual(page.status_code, 200)
                self.assertNotIn(settings.SESSION_COOKIE_NAME, page.cookies)
                self.assertContains(page, 'data-scope="guest"')
                self.assertIn('no-store', page['Cache-Control'])
                self.assertEqual(self.client.post(url).status_code, 405)

    def test_track_contains_puzzles_no_script_hints_and_answers(self):
        for track in load_data()['tracks']:
            page = self.client.get(reverse('math-camp-track', args=[track['id']]))
            self.assertContains(page, 'data-sidebar-layout=".mc-side"')
            for drill in track['drills']:
                self.assertContains(page, f'id="drill-{drill["id"]}"')
                self.assertContains(page, drill['answer_text'])
                for hint in drill['hints']:
                    self.assertContains(page, hint)

    def test_progress_scope_isolates_users_and_guests(self):
        user = get_user_model().objects.create_user(username='mathcamp-test', password='test-only')
        self.client.force_login(user)
        page = self.client.get(reverse('math-camp'))
        self.assertContains(page, f'data-scope="user-{user.pk}"')
        self.assertEqual(page.context['camp_scope'], f'user-{user.pk}')
        self.client.logout()
        self.assertContains(self.client.get(reverse('math-camp')), 'data-scope="guest"')

    def test_unknown_route_returns_404(self):
        self.assertEqual(self.client.get(reverse('math-camp-track', args=['missing'])).status_code, 404)
