from django.core.paginator import Paginator
from django.db.models import Q
from django.http import Http404, HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET
from urllib.parse import urlsplit
from catalog.models import published_items
from .models import ContentEntryLink, LexicalEntry
from .queries import matching_entries, public_records, record_order


def record_payload(record):
    sense, pronunciation = record.binding.sense, record.binding.pronunciation
    source = record.release.source
    snapshot = record.release.source_snapshot
    value = ''
    if pronunciation and pronunciation.is_reviewed:
        value = pronunciation.editorial_value or record.pronunciation_value
    definition = sense.editorial_definition.strip() or record.definition.strip()
    properties = {key: record.properties[key] for key in ('codepoint', 'strokes', 'radical_strokes', 'radicals', 'traditional', 'simplified', 'examples', 'synset', 'source_entry') if key in record.properties}
    if pronunciation and pronunciation.is_reviewed and 'readings' in record.properties:
        properties['readings'] = record.properties['readings']
    return {
        'sense_id': str(sense.pk), 'record_id': str(record.pk),
        'definition': '' if definition == '无' else definition,
        'definition_origin': 'editorial' if sense.editorial_definition else 'source',
        'editorial_revision': sense.revision, 'gloss_language': sense.gloss_language,
        'part_of_speech': record.part_of_speech,
        'part_of_speech_label': {'n': '名词 n.', 'v': '动词 v.', 'a': '形容词 adj.', 's': '形容词 adj.', 'r': '副词 adv.'}.get(record.part_of_speech, record.part_of_speech),
        'properties': properties,
        'pronunciation': {'id': str(pronunciation.pk), 'value': value, 'system': pronunciation.system,
                          'region': pronunciation.region, 'editorial_revision': pronunciation.revision} if value and value.strip() != '无' else None,
        'source': {'code': source.code, 'name': snapshot.get('name', source.name), 'url': safe_url(snapshot.get('url', source.url)),
                   'version': record.release.version, 'attribution': snapshot.get('attribution', source.attribution),
                   'data_license': snapshot.get('data_license', source.data_license),
                   'license_url': safe_url(snapshot.get('license_url', source.license_url)), 'changes': snapshot.get('changes', source.changes),
                   'notice_url': reverse('dictionary-sources') + '#' + source.code,
                   'source_key': record.binding.external_key},
    }


def safe_url(value):
    try:
        return value if urlsplit(value).scheme in ('https', 'http') else ''
    except (ValueError, TypeError, AttributeError):
        return ''


@never_cache
@require_GET
def entries(request):
    q = request.GET.get('q', '').strip()
    language = request.GET.get('language', '').strip()
    kind = request.GET.get('kind', '').strip()
    if '\x00' in q or '\x00' in language or len(q) > 200 or len(language) > 20 or (kind and kind not in LexicalEntry.Kind.values):
        return JsonResponse({'error': '查询条件不正确。'}, status=400)
    page = Paginator(matching_entries(q, language, kind), 30).get_page(request.GET.get('page'))
    return JsonResponse({'results': [{'id': str(e.pk), 'headword': e.headword, 'language': e.language, 'kind': e.kind} for e in page],
                         'page': page.number, 'pages': page.paginator.num_pages, 'total': page.paginator.count})


@never_cache
@require_GET
def entry_detail(request, pk):
    records = public_records()
    entry = get_object_or_404(LexicalEntry, pk=pk)
    seen = set()
    while entry.status == 'merged' and entry.merged_into_id:
        if entry.pk in seen:
            raise Http404
        seen.add(entry.pk)
        entry = entry.merged_into
    if not records.filter(binding__sense__entry=entry).exists():
        raise Http404
    if seen:
        # Temporary and no-store: a later withdrawal must also hide the old UUID.
        return HttpResponseRedirect(reverse('lexicon-detail', args=[entry.pk]))
    definitions = sorted(records.filter(binding__sense__entry=entry), key=record_order)
    return JsonResponse({'id': str(entry.pk), 'headword': entry.headword, 'language': entry.language, 'kind': entry.kind,
                         'definitions': [record_payload(record) for record in definitions[:100]], 'has_more': len(definitions) > 100})


@never_cache
@require_GET
def content_links(request, pk):
    content = get_object_or_404(published_items(), pk=pk)
    results = []
    records = public_records()
    for link in ContentEntryLink.objects.filter(content=content).select_related('evidence', 'sense__entry'):
        # A changed/replaced source never silently changes a lesson's selected meaning.
        record = records.filter(binding_id=link.evidence.binding_id, lexical_hash=link.evidence.lexical_hash).first()
        if record:
            results.append({'entry_id': str(link.sense.entry_id), 'slot': link.slot, **record_payload(record)})
    return JsonResponse({'content_id': str(content.pk), 'links': results})
