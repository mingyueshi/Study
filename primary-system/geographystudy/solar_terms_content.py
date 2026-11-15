"""节气卡、联读问题与双向链接共用同一份文件源。"""
import json

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.urls import reverse


def load_content():
    source = settings.BASE_DIR / 'content_sources' / 'solar-terms.json'
    content = json.loads(source.read_text(encoding='utf-8'))
    if content['schema_version'] != 1:
        raise ImproperlyConfigured('二十四节气馆的数据版本不受支持。')
    for season in content['seasons']:
        for term in season['terms']:
            term['season_id'] = season['id']
            term['season_name'] = season['name']
            term['url'] = reverse('solar-terms') + '#' + term['id']
            term['poetry_url'] = reverse('poetry-theme', args=[season['id']]) + '?solar_term=' + term['id']
            for subject, route in (('geography', 'geography-study'), ('literature', 'literature-study')):
                link = term['learning'][subject]
                link['title'] = content['learning_lessons'][subject][link['lesson']]
                link['url'] = reverse(route) + '?solar_term=' + term['id'] + '#lesson-' + link['lesson']
    return content


def find_term(code, content=None):
    if not code:
        return None
    content = content if content is not None else load_content()
    return next((term for season in content['seasons'] for term in season['terms'] if term['id'] == code), None)
