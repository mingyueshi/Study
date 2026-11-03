from django.core.paginator import Paginator
from django.db.models import Case, Value, When
from django.http import Http404
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from lexicon.models import LexicalEntry
from lexicon.queries import record_order
from lexicon.views import record_payload

from .catalog import dictionary_records, load_curriculum, matches_pin, with_details


def grouped_scenes(curriculum):
    return [
        {**group, 'scenes': [scene for scene in curriculum['scenes'] if scene['group'] == group['code']]}
        for group in curriculum['groups']
    ]


def reading(record):
    payload = record_payload(record)
    # The raw reading is useful for this internal dictionary, with its provenance visible.
    raw = record.pronunciation_value.strip()
    payload['dictionary_pinyin'] = raw if raw != '无' else ''
    return payload


def scene_cards(curriculum, scene):
    pins = {pin['id']: pin for pin in curriculum['idioms']}
    selected_pins = [pins[item['idiom_id']] for item in scene['items']]
    records = {
        str(record.binding_id): record for record in with_details(dictionary_records().filter(
            binding_id__in=[pin['binding_id'] for pin in selected_pins],
        ))
    }
    cards = []
    for item, pin in zip(scene['items'], selected_pins, strict=True):
        record = records.get(pin['binding_id'])
        valid = matches_pin(record, pin)
        cards.append({
            'id': item['idiom_id'],
            'headword': pin['headword'],
            'reading': reading(record) if valid else None,
            'entry_id': pin['entry_id'],
            'example': item['example'] if valid else '',
            'note': item['note'] if valid else '',
        })
    return cards


@never_cache
@require_safe
def index(request, code=None):
    curriculum = load_curriculum()
    scene_code = code or request.GET.get('scene')
    scenes = curriculum['scenes']
    scene = next((item for item in scenes if item['code'] == scene_code), None) if scene_code else scenes[0]
    if scene is None:
        raise Http404('没有找到这个场景。')

    q = request.GET.get('q', '').strip()
    invalid = len(q) > 100 or '\x00' in q
    searched = bool(q) and not invalid
    page = None
    if searched:
        matching = dictionary_records().filter(binding__sense__entry__headword__contains=q)
        entries = LexicalEntry.objects.filter(
            pk__in=matching.order_by().values('binding__sense__entry_id'),
        ).annotate(
            exact_rank=Case(When(headword=q, then=Value(0)), default=Value(1)),
        ).order_by('exact_rank', 'headword', 'pk')
        page = Paginator(entries.only('headword'), 24).get_page(request.GET.get('page'))

    cards = scene_cards(curriculum, scene)
    return render(request, 'idioms/index.html', {
        'groups': grouped_scenes(curriculum),
        'scene_count': len(scenes),
        'scene': scene,
        'cards': cards,
        'available_count': sum(card['reading'] is not None for card in cards),
        'q': '' if invalid else q,
        'invalid': invalid,
        'searched': searched,
        'page': page,
    }, status=400 if invalid else 200)


@never_cache
@require_safe
def entry_detail(request, pk):
    records = sorted(with_details(dictionary_records().filter(binding__sense__entry_id=pk)), key=record_order)
    if not records:
        raise Http404('当前成语词典中没有这个词条。')

    curriculum = load_curriculum()
    pins = {pin['binding_id']: pin for pin in curriculum['idioms'] if pin['entry_id'] == str(pk)}
    current_ids = set()
    for record in records:
        pin = pins.get(str(record.binding_id))
        if pin and matches_pin(record, pin):
            current_ids.add(pin['id'])
    related = [
        {'scene': scene, 'idiom_id': item['idiom_id']}
        for scene in curriculum['scenes']
        for item in scene['items']
        if item['idiom_id'] in current_ids
    ]
    return render(request, 'idioms/entry.html', {
        'entry': records[0].binding.sense.entry,
        'readings': [reading(record) for record in records],
        'related': related,
    })
