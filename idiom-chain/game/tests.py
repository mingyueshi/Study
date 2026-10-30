from io import StringIO
from django.core.management import call_command
from django.test import Client, TestCase
from game.models import Idiom, Round


class GameTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed_idioms', stdout=StringIO())

    def setUp(self):
        self.state = self.client.get('/api/state/').json()

    def post(self, endpoint, word=None, state=None, client=None):
        s = state or self.state
        data = {'round_id': s['id'], 'revision': s['revision']}
        if word is not None:
            data['word'] = word
        response = (client or self.client).post('/api/' + endpoint + '/', data=data, content_type='application/json')
        if response.status_code == 200 and not client:
            self.state = response.json()
        return response

    def test_seed_is_valid_idempotent_and_non_destructive(self):
        before = Idiom.objects.count()
        self.assertGreaterEqual(before, 80)
        Idiom.objects.create(word='测试专用', meaning='仅用于测试。')
        Idiom.objects.filter(word='一心一意').update(enabled=False)
        call_command('seed_idioms', stdout=StringIO())
        self.assertEqual(Idiom.objects.count(), before + 1)
        self.assertFalse(Idiom.objects.get(word='一心一意').enabled)
        self.assertTrue(all(len(i.word) == 4 and i.meaning for i in Idiom.objects.all()))

    def test_long_valid_chain_score_and_refresh(self):
        words = '意气风发 发扬光大 大功告成 成千上万 万众一心 心口如一 一马当先 先见之明 明察秋毫 毫不犹豫'.split()
        for word in words:
            self.assertEqual(self.post('play', word).status_code, 200, word)
        self.assertEqual(self.state['score'], len(words) * 10)
        refreshed = self.client.get('/api/state/').json()
        self.assertEqual(refreshed['id'], self.state['id'])
        self.assertEqual(refreshed['chain'], self.state['chain'])

    def test_invalid_words_do_not_mutate(self):
        for word in ['胡编乱造', '意', '意意意意', '天长地久', 123, ['意气风发']]:
            self.assertEqual(self.post('play', word).status_code, 400)
        r = Round.objects.get(pk=self.state['id'])
        self.assertEqual(r.score, 0)
        self.assertEqual(r.revision, 0)
        self.assertEqual(len(r.chain), 1)

    def test_repeated_word_rejected(self):
        self.assertEqual(self.post('play', '一心一意').status_code, 400)
        self.assertEqual(self.post('play', '意气风发').status_code, 200)
        self.assertEqual(self.post('play', '意气风发').status_code, 400)
        self.assertEqual(Round.objects.get(pk=self.state['id']).score, 10)

    def test_disabled_idiom_rejected(self):
        Idiom.objects.filter(word='意气风发').update(enabled=False)
        self.assertEqual(self.post('play', '意气风发').status_code, 400)

    def test_hint_cost_and_no_auto_submission(self):
        response = self.post('hint')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.state['score'], 0)
        self.assertEqual(self.state['hints'], 1)
        self.assertEqual(len(self.state['chain']), 1)
        self.assertTrue(self.state['hint']['word'].startswith('意'))
        self.assertEqual(self.post('play', '意气风发').status_code, 200)
        response = self.post('hint')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.state['score'], 5)
        self.assertEqual(len(self.state['chain']), 2)

    def test_no_candidate_does_not_charge(self):
        r = Round.objects.get(pk=self.state['id'])
        r.chain = [{'word': '毫不犹豫', 'meaning': '做决定果断。'}]
        r.score = 20
        r.save()
        response = self.post('hint')
        self.assertEqual(response.status_code, 400)
        self.assertIn('没有可接', response.json()['error'])
        r.refresh_from_db()
        self.assertEqual(r.score, 20)
        self.assertEqual(r.hints, 0)

    def test_restart_preserves_history(self):
        self.post('play', '意气风发')
        old = self.state
        self.assertEqual(self.post('restart').status_code, 200)
        self.assertNotEqual(self.state['id'], old['id'])
        self.assertEqual(self.state['score'], 0)
        self.assertEqual(len(self.state['chain']), 1)
        self.assertEqual(self.state['history'][0]['score'], 10)
        self.assertEqual(Round.objects.get(pk=old['id']).status, 'finished')

    def test_stale_double_click_is_rejected(self):
        old = self.state
        self.assertEqual(self.post('play', '意气风发').status_code, 200)
        self.assertEqual(self.post('play', '意气风发', state=old).status_code, 409)
        self.assertEqual(Round.objects.get(pk=old['id']).score, 10)

    def test_stale_restart_cannot_restart_new_round(self):
        old = self.state
        self.assertEqual(self.post('restart').status_code, 200)
        new_id = self.state['id']
        self.assertEqual(self.post('restart', state=old).status_code, 409)
        self.assertEqual(self.client.get('/api/state/').json()['id'], new_id)
        self.assertEqual(Round.objects.count(), 2)

    def test_visitors_are_isolated_and_cannot_use_others_round(self):
        other = Client()
        other_state = other.get('/api/state/').json()
        self.assertNotEqual(other_state['id'], self.state['id'])
        self.post('play', '意气风发')
        self.assertEqual(other.get('/api/state/').json()['score'], 0)
        self.assertEqual(self.post('restart', state=self.state, client=other).status_code, 409)

    def test_mutations_require_post_and_csrf(self):
        for endpoint in ['play', 'hint', 'restart']:
            self.assertEqual(self.client.get('/api/' + endpoint + '/').status_code, 405)
        protected = Client(enforce_csrf_checks=True)
        protected.get('/api/state/')
        self.assertEqual(protected.post('/api/play/', data={'word': '意气风发'}, content_type='application/json').status_code, 403)

    def test_json_errors_and_payload_limit(self):
        for value in ['not-json', '[]', 'null', '"x"', '{' + 'x' * 1100]:
            response = self.client.post('/api/play/', data=value, content_type='application/json')
            self.assertEqual(response.status_code, 400)

    def test_admin_is_not_publicly_writable(self):
        response = self.client.get('/admin/')
        self.assertEqual(response.status_code, 302)
        self.assertIn('/admin/login/', response.url)
        response = self.client.get('/admin/game/idiom/add/')
        self.assertEqual(response.status_code, 302)
        self.assertIn('/admin/login/', response.url)

    def test_state_is_never_cached(self):
        response = self.client.get('/api/state/')
        self.assertIn('no-store', response.headers['Cache-Control'])
        self.assertIn('private', response.headers['Cache-Control'])

    def test_admin_word_validation(self):
        from django.core.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            Idiom(word='测试', meaning='短词不允许').full_clean()

    def test_admin_password_alone_cannot_bypass_captcha(self):
        from django.contrib.auth import get_user_model
        get_user_model().objects.create_superuser(username='test_admin', password='Test-only-password-913!')
        response = self.client.post('/admin/login/', {'username':'test_admin','password':'Test-only-password-913!','next':'/admin/'})
        self.assertEqual(response.status_code,200)
        self.assertNotIn('_auth_user_id',self.client.session)
        self.assertContains(response,'nova_slider_token')
        response = self.client.post('/admin/login/', {'username':'test_admin','password':'Test-only-password-913!','nova_slider_token':'forged-proof','next':'/admin/'})
        self.assertEqual(response.status_code,200)
        self.assertNotIn('_auth_user_id',self.client.session)
