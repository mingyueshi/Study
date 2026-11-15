from copy import deepcopy

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, TestCase

from .catalog import load_curriculum, pronunciation_theory
from .practice import load_practice, practice_material, validate_practice


class PracticeDataTests(SimpleTestCase):
    def setUp(self):
        self.phonemes = load_curriculum()['phonemes']
        self.groups = [{'phonemes': [{**p, 'audio': f'phonetics/audio/{p["id"]}.m4a',
                                      'key_word': p['examples'][0]['en']} for p in self.phonemes]}]
        self.theory = pronunciation_theory(self.groups)
        self.data = load_practice()

    def test_structure_and_references(self):
        validate_practice(self.data, self.phonemes, self.theory['lessons'])
        self.assertEqual(len(self.data['contrasts']), 8)
        self.assertEqual(len(self.data['questions']), 12)

    def test_rejects_invalid_references_and_answers(self):
        for change in (
            lambda d: d['contrasts'][0].update(phoneme_ids=['missing', '01-i']),
            lambda d: d['contrasts'][0].update(phoneme_ids=['01-i', '01-i']),
            lambda d: d['questions'][0].update(lesson_id='missing'),
            lambda d: d['questions'][0].update(answer_id='missing'),
            lambda d: d['questions'][0].update(explanation=''),
            lambda d: d['questions'][1].update(id=d['questions'][0]['id']),
            lambda d: d['questions'][0]['choices'][1].update(id=d['questions'][0]['choices'][0]['id']),
            lambda d: d.update(schema_version=2),
        ):
            data = deepcopy(self.data)
            change(data)
            with self.assertRaises(ImproperlyConfigured):
                validate_practice(data, self.phonemes, self.theory['lessons'])

    def test_listening_reuses_both_original_sounds_and_theory_links(self):
        material = practice_material(self.groups, self.theory)
        self.assertEqual(len(material['questions']), 28)
        self.assertEqual(len({q['id'] for q in material['questions']}), 28)
        listening = [q for q in material['questions'] if q['kind'] == 'listening']
        self.assertEqual(len(listening), 16)
        for question in listening:
            self.assertEqual(question['audio'], f'phonetics/audio/{question["answer_id"]}.m4a')
            self.assertEqual(len(question['choices']), 2)
            self.assertIn(question['answer_id'], [c['id'] for c in question['choices']])
            self.assertTrue(question['review'].startswith('#contrast-'))
        for question in material['questions'][16:]:
            self.assertTrue(question['review'].startswith('#theory-'))
            self.assertNotIn('audio', question)


class PracticePageTests(TestCase):
    def test_practice_entry_and_follow_along_controls(self):
        response = self.client.get('/phonetics/')
        self.assertContains(response, 'id="group-contrasts"')
        self.assertContains(response, 'id="group-practice"')
        self.assertContains(response, 'id="phonetics-practice-data"')
        self.assertContains(response, 'id="tts-interval"')
        self.assertContains(response, 'id="tts-repeat"')
        self.assertContains(response, 'data-tts-pausable="true"', count=5)
        self.assertContains(response, 'phonetics_practice_v1:guest')
        self.assertEqual(self.client.post('/phonetics/').status_code, 405)

    def test_progress_is_scoped_to_browser_account(self):
        from django.contrib.auth import get_user_model
        user = get_user_model().objects.create_user(username='phonetics-learner')
        self.client.force_login(user)
        response = self.client.get('/phonetics/')
        self.assertContains(response, f'phonetics_practice_v1:user-{user.pk}')
        self.assertNotContains(response, 'phonetics_practice_v1:guest')
