import json

from django import forms
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.http import Http404
from django.shortcuts import render
from django.views.decorators.http import require_safe


class ComparisonForm(forms.Form):
    left = forms.ChoiceField(label='第一项工程')
    right = forms.ChoiceField(label='第二项工程')

    def __init__(self, works, *args, **kwargs):
        super().__init__(*args, **kwargs)
        choices = [(work['id'], work['name']) for work in works]
        for field in self.fields.values():
            field.choices = choices

    def clean(self):
        values = super().clean()
        if values.get('left') and values['left'] == values.get('right'):
            self.add_error('right', '请选择两项不同的工程，再看看它们的做法有什么不同。')
        return values


@require_safe
def great_works(request, work_id=None):
    source = settings.BASE_DIR / 'content_sources' / 'great-works.json'
    course = json.loads(source.read_text(encoding='utf-8'))
    if course['schema_version'] != 1:
        raise ImproperlyConfigured('伟大工程的数据版本不受支持。')
    by_id = {work['id']: work for work in course['works']}
    context = {'study_area': 'interdisciplinary', 'course': course}
    if work_id is not None:
        if work_id not in by_id:
            raise Http404('没有这份工程档案。')
        context['work'] = by_id[work_id]
    else:
        defaults = {'left': 'zhaozhou-bridge', 'right': 'hzmb'}
        query = request.GET if 'left' in request.GET or 'right' in request.GET else None
        form = ComparisonForm(course['works'], data=query, initial=defaults)
        context['form'] = form
        if not form.is_bound or form.is_valid():
            pair = form.cleaned_data if form.is_bound else defaults
            context['left'], context['right'] = by_id[pair['left']], by_id[pair['right']]
    return render(request, 'study_topics/great_works.html', context)
