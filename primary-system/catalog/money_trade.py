import json

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.http import require_safe


@require_safe
def money_trade(request):
    source = settings.BASE_DIR / 'content_sources' / 'money-trade.json'
    course = json.loads(source.read_text(encoding='utf-8'))
    if course['schema_version'] != 1:
        raise ImproperlyConfigured('货币与贸易的数据版本不受支持。')
    for station in course['stations']:
        for link in station.get('links', ()):
            args = [link['argument']] if 'argument' in link else []
            link['url'] = reverse(link['route'], args=args) + link.get('suffix', '')
    return render(request, 'study_topics/money_trade.html', {
        'study_area': 'interdisciplinary',
        'course': course,
    })
