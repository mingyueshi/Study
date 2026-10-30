from django import forms
from django.core.paginator import Paginator
from django.db.models import Q
from django.http import Http404, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET
from catalog.models import published_items
from .models import LexicalEntry, LexiconSource
from .open_sources import release_notices
from .queries import matching_entries, public_records, query_text, record_order
from .views import record_payload, safe_url


class LookupForm(forms.Form):
    q = forms.CharField(max_length=200, required=False, label='汉字、拼音或英文', widget=forms.TextInput(attrs={'placeholder': '试试「学」、xue 或 apple', 'autocomplete': 'off'}))
    scope = forms.ChoiceField(required=False, label='查询范围', choices=[('', '全部词典'), ('character', '汉字'), ('english', '英文'), ('idiom', '成语')])


def teaching_items(text, *, language='', limit=8):
    # Independent teaching material; spelling relevance is not a semantic alignment.
    if not text:
        return []
    result = published_items().filter(kind__in=['word', 'idiom'])
    if language == 'en':
        result = result.filter(kind='word')
    elif language == 'zh':
        result = result.filter(kind='idiom')
    result = result.filter(Q(title__icontains=text) | Q(source_payload__en__iexact=text)).select_related('module')
    return list(result.order_by('title', 'id')[:limit])


@never_cache
@require_GET
def lookup(request):
    form = LookupForm(request.GET)
    valid = form.is_valid()
    data = form.cleaned_data if valid else {}
    q, scope = data.get('q', ''), data.get('scope', '')
    language, kind = ('en', '') if scope == 'english' else ('', scope)
    queryset = matching_entries(q, language, kind) if valid else LexicalEntry.objects.none()
    page = Paginator(queryset, 24).get_page(request.GET.get('page'))
    # Bound previews to the current page; private records never enter this query.
    records = public_records().filter(binding__sense__entry_id__in=[e.pk for e in page]).order_by('release__source__priority', 'binding__external_key')
    previews = {}
    for record in sorted(records, key=record_order):
        previews.setdefault(record.binding.sense.entry_id, record_payload(record))
    cards = [{'entry': entry, 'preview': previews.get(entry.pk)} for entry in page]
    return render(request, 'lexicon/lookup.html', {'form': form, 'q': q, 'page': page, 'cards': cards,
        'teaching': teaching_items(query_text(q), language=language) if valid else [],
        'sources': LexiconSource.objects.filter(enabled=True, public_allowed=True, active_release__status='ready'),
    }, status=200 if valid else 400)


@never_cache
@require_GET
def detail(request, pk):
    entry = get_object_or_404(LexicalEntry, pk=pk)
    seen = set()
    while entry.status == 'merged' and entry.merged_into_id:
        if entry.pk in seen:
            raise Http404
        seen.add(entry.pk); entry = entry.merged_into
    records = public_records().filter(binding__sense__entry=entry).order_by('release__source__priority', 'binding__external_key')
    if not records.exists():
        raise Http404
    if seen:
        return HttpResponseRedirect(reverse('dictionary-entry', args=[entry.pk]))
    # Full pagination rather than silently cutting off a polysemous entry.
    page = Paginator(sorted(records, key=record_order), 20).get_page(request.GET.get('page'))
    definitions = [record_payload(record) for record in page]
    return render(request, 'lexicon/detail.html', {'entry': entry, 'page': page, 'definitions': definitions,
        'character': definitions[0]['properties'] if entry.kind == 'character' and definitions else None,
        'teaching': teaching_items(entry.headword, language=entry.language),
    })


@never_cache
@require_GET
def sources(request):
    values = []
    for source in LexiconSource.objects.filter(enabled=True, public_allowed=True, active_release__status='ready').select_related('active_release'):
        release = source.active_release
        metadata = {field: release.source_snapshot.get(field, getattr(source, field))
                    for field in ('code', 'name', 'url', 'attribution', 'data_license', 'license_url', 'changes')}
        metadata['url'] = safe_url(metadata['url'])
        metadata['license_url'] = safe_url(metadata['license_url'])
        values.append({'source': metadata, 'release': release, 'notices': release_notices(release)})
    return render(request, 'lexicon/sources.html', {'sources': values})
