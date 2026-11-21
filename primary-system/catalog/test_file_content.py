import json
from pathlib import Path
import shutil
from tempfile import TemporaryDirectory

from django.conf import settings
from django.test import SimpleTestCase, override_settings
from django.urls import reverse


class TopicContentTests(SimpleTestCase):
    def setUp(self):
        self.project = settings.BASE_DIR
        self.directory = Path(self.enterContext(TemporaryDirectory()))
        (self.directory / 'content_sources').mkdir()
        self.enterContext(override_settings(BASE_DIR=self.directory))

    def read(self, name):
        return json.loads((self.project / 'content_sources' / f'{name}.json').read_text(encoding='utf-8'))

    def write(self, name, course):
        (self.directory / 'content_sources' / f'{name}.json').write_text(
            json.dumps(course, ensure_ascii=False), encoding='utf-8',
        )

    def assert_unavailable(self, url):
        with self.assertLogs('catalog.file_content', level='ERROR'):
            response = self.client.get(url)
        self.assertContains(response, '内容暂时无法加载', status_code=503)
        return response

    def test_rhetoric_hero_follows_the_case_references(self):
        course = self.read('rhetoric')
        old_id, new_id = 'lotus-umbrella', 'lotus-parasol'
        for technique in course['techniques']:
            for example in technique['examples']:
                if example['id'] == old_id:
                    example['id'] = new_id
        for case in course['cases']:
            for sample in case['sentences']:
                if isinstance(sample, dict) and sample['example'] == old_id:
                    sample['example'] = new_id
        self.write('rhetoric', course)
        response = self.client.get(reverse('rhetoric-gallery'), {'technique': 'parallelism'})
        self.assertContains(response, '同一片荷叶，两种写法')
        self.assertEqual([sample['id'] for sample in response.context['hero_examples']], [new_id, 'lotus-greets'])

    def test_rhetoric_rejects_missing_answer_or_example(self):
        for field, value in [('answer', 'unknown'), ('sentences', [{'example': 'unknown'}])]:
            with self.subTest(field=field):
                course = self.read('rhetoric')
                course['cases'][0][field] = value
                self.write('rhetoric', course)
                self.assert_unavailable(reverse('rhetoric-gallery'))

    def test_maze_rejects_missing_answer_and_empty_routes(self):
        course = self.read('word-maze')
        course['routes'][0]['gates'][0]['answer'] = 'unknown'
        self.write('word-maze', course)
        self.assert_unavailable(reverse('word-maze'))
        course['routes'] = []
        self.write('word-maze', course)
        self.assert_unavailable(reverse('word-maze'))

    def test_couplets_rejects_invalid_answer_indices_and_empty_lines(self):
        for answer in (100, -1, True):
            with self.subTest(answer=answer):
                course = self.read('couplets')
                course['questions'][0]['answer'] = answer
                self.write('couplets', course)
                self.assert_unavailable(reverse('couplets'))
        for side in ('upper', 'lower', 'examples'):
            with self.subTest(side=side):
                course = self.read('couplets')
                target = course if side == 'examples' else course['examples'][0]
                target[side] = []
                self.write('couplets', course)
                self.assert_unavailable(reverse('couplets'))

    def test_rumor_views_reject_broken_verdict_and_skill_references(self):
        for field in ('verdict', 'skill'):
            with self.subTest(field=field):
                course = self.read('science-rumors')
                case = course['cases'][0]
                case[field] = 'unknown'
                self.write('science-rumors', course)
                self.assert_unavailable(reverse('science-rumor-case', args=[case['slug']]))
                self.assert_unavailable(reverse('science-rumors-training'))

    def test_punctuation_rejects_invalid_vectors_and_question_references(self):
        for field, value in (
            ('answers', []), ('answers', [[]]), ('answers', [None]), ('answers', [[42]]),
            ('answers', [['不是标点']]), ('answers', [['？', '。', '，']]), ('chunks', [None, '']),
            ('group', 'unknown'), ('level', 'unknown'), ('mark_ids', ['unknown']),
        ):
            with self.subTest(field=field, value=value):
                course = self.read('punctuation')
                course['questions'][0][field] = value
                self.write('punctuation', course)
                response = self.assert_unavailable(reverse('punctuation-lab') + '?view=practice')
                self.assertNotContains(response, 'punctuation-data', status_code=503)

    def test_punctuation_stays_readable_when_a_static_asset_is_missing(self):
        self.write('punctuation', self.read('punctuation'))
        assets = self.directory / 'static' / 'study_topics'
        assets.mkdir(parents=True)
        url = reverse('punctuation-lab') + '?view=practice'
        for suffix, missing in [('css', 'js'), ('js', 'css')]:
            with self.subTest(missing=missing):
                filename = f'punctuation.{suffix}'
                shutil.copyfile(self.project / 'static/study_topics' / filename, assets / filename)
                with self.assertLogs('chinesebook.punctuation', level='WARNING'):
                    response = self.client.get(url)
                (assets / filename).unlink()
                self.assertContains(response, f'/static/study_topics/{filename}?v=')
                self.assertNotContains(response, f'/static/study_topics/punctuation.{missing}')
                if missing == 'js':
                    self.assertContains(response, '互动练习暂时不可用')
                    self.assertContains(response, '学校举行“读书分享会”活动。')
                    self.assertNotContains(response, '开启 JavaScript 可逐题填写')
