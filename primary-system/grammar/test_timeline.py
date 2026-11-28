import json

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase
from django.urls import reverse

from . import timeline


class EnglishTimelineTests(SimpleTestCase):
    def test_one_action_changes_with_time_and_person(self):
        draw = timeline.load_timeline()['examples']['draw']
        self.assertEqual([draw['i'][moment]['en'] for moment in timeline.MOMENT_IDS], [
            'I draw a picture every day.',
            'I am drawing a picture now.',
            'I drew a picture yesterday.',
            'I am going to draw a picture tomorrow.',
        ])
        self.assertEqual([draw['she'][moment]['phrase'] for moment in timeline.MOMENT_IDS],
                         ['draws', 'is drawing', 'drew', 'is going to draw'])
        self.assertEqual(draw['she']['will']['en'], 'She will draw a picture tomorrow.')
        self.assertEqual(draw['she']['past']['cn'], '她昨天画了画。')

    def test_read_sounds_different_in_the_present_and_past(self):
        read = timeline.load_timeline()['examples']['read']['i']
        self.assertEqual((read['habit']['word'], read['habit']['ipa'], read['habit']['word_speech']),
                         ('read', '/riːd/', 'reed'))
        self.assertEqual((read['past']['word'], read['past']['ipa'], read['past']['word_speech']),
                         ('read', '/red/', 'red'))
        self.assertEqual(read['past']['speech'], 'I red a book yesterday.')

    def test_deep_link_renders_the_selected_example_and_reading(self):
        route = reverse('english-timeline')
        response = self.client.get(route, {'action': 'read', 'person': 'she', 'moment': 'past'})
        self.assertEqual(response.context['current']['en'], 'She read a book yesterday.')
        self.assertContains(response, 'name="moment" value="past" checked')
        self.assertContains(response, 'name="person" value="she" checked')
        self.assertContains(response, 'data-timeline-speak="She red a book yesterday."')
        self.assertContains(response, 'data-timeline-text="ipa">/red/')
        self.assertContains(response, '亲子开口练')
        response = self.client.get(route, {'action': 'unknown', 'moment': 'will', 'person': 'nobody'})
        self.assertEqual(response.context['current']['en'], 'I draw a picture every day.')

    def test_missing_ipa_and_unsolvable_question_fail_validation(self):
        data = json.loads(timeline.DATA_PATH.read_text(encoding='utf-8'))
        base = data['actions'][0]['forms']['base']
        ipa = base.pop('ipa')
        with self.assertRaisesMessage(ImproperlyConfigured, '缺词形或音标'):
            timeline.prepare_timeline(data)
        base['ipa'] = ipa
        data['quiz'][0]['options'] = ['is playing', 'played']
        with self.assertRaisesMessage(ImproperlyConfigured, '选项缺正确答案'):
            timeline.prepare_timeline(data)

    def test_grammar_tenses_keeps_its_lesson_and_practice_links(self):
        response = self.client.get(reverse('grammar'), {'chapter': 'tenses'})
        self.assertContains(response, reverse('english-timeline'))
        for number in range(1, 5):
            self.assertContains(response, f'id="lesson-gr6-{number}"')
        self.assertContains(response, reverse('questionbank-grammar-practice', args=['tenses']))
