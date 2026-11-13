"""无需入库的古文精读页面。页内练习只作本机自测，不写账号成绩。"""
from urllib.parse import urlencode

from django.core.exceptions import ImproperlyConfigured
from django.core.paginator import Paginator
from django.http import Http404
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.http import require_safe

from .content import InvalidContent, load_library, prepare_article


def library():
    try:
        return load_library()
    except InvalidContent as error:
        raise ImproperlyConfigured(str(error)) from error


def article_context(slug, catalog, articles):
    selected = next((article for article in articles if article['id'] == slug), None)
    if selected is None:
        raise Http404('还没有这篇古文。')
    collection = next((group for group in catalog.get('collections', []) if slug in {part['id'] for part in group['parts']}), None)
    book_ids = {part['id'] for group in catalog.get('collections', []) for part in group['parts']}
    siblings = [row for row in articles if row['id'] in {part['id'] for part in collection['parts']}] if collection else [row for row in articles if row['id'] not in book_ids]
    position = siblings.index(selected)
    return {
        'study_area': 'chinese', 'catalog': catalog, 'articles': siblings, 'collection': collection,
        'article': prepare_article(selected),
        'previous': siblings[position - 1] if position else None,
        'following': siblings[position + 1] if position + 1 < len(siblings) else None,
    }


def page_context(request, slug, route):
    catalog, articles = library()
    retired = catalog['retired_targets'].get(slug)
    if retired is None:
        return article_context(slug, catalog, articles), None
    parameter = 'unit' if route == 'print' else 'line'
    if parameter not in request.GET:
        return None, redirect('classical-book', slug=retired['collection'], permanent=True)
    target = retired['units'].get(request.GET[parameter])
    if target is None:
        raise Http404('没有找到这则原文。')
    query = {parameter: target['sentence']}
    if route == 'detail' and request.GET.get('mode') in ('read', 'recite', 'practice'):
        query['mode'] = request.GET['mode']
    if route == 'print' and request.GET.get('view') in ('original', 'study', 'practice', 'answers'):
        query['view'] = request.GET['view']
    url = reverse('classical-' + route, args=[target['article']]) + '?' + urlencode(query)
    if route == 'detail':
        url += '#line-' + target['sentence']
    return None, redirect(url, permanent=True)


def unit_matches(unit, q):
    return q in ' '.join([unit['text'], unit['translation'], unit['explanation'], *(note['meaning'] for note in unit['notes'])])


@require_safe
def book(request, slug):
    catalog, articles = library()
    selected = next((group for group in catalog.get('collections', []) if group['id'] == slug), None)
    if selected is None:
        raise Http404('还没有这部古文。')
    parts = [next(article for article in articles if article['id'] == part['id']) for part in selected['parts']]
    q = request.GET.get('q', '').strip()[:80]
    matches = []
    if q:
        for article in parts:
            for number, unit in enumerate(article['sentences'], 1):
                if unit_matches(unit, q):
                    matches.append({'article': article, 'unit': unit, 'number': number})
    return render(request, 'classical/book.html', {
        'study_area': 'chinese', 'catalog': catalog, 'collection': selected, 'articles': parts,
        'unit_count': sum(len(row['sentences']) for row in parts),
        'question_count': sum(len(row['questions']) for row in parts), 'q': q,
        'matches': Paginator(matches, 30).get_page(request.GET.get('page')),
    })


@require_safe
def index(request):
    catalog, articles = library()
    q = request.GET.get('q', '').strip()[:80]
    filters = {}
    for field, group in (('level', 'levels'), ('genre', 'genres'), ('skill', 'skills')):
        value = request.GET.get(field, '')
        filters[field] = value if value in {row['id'] for row in catalog[group]} else ''
    curriculum = request.GET.get('curriculum') == '4a'
    book_ids = {part['id'] for group in catalog.get('collections', []) for part in group['parts']}
    shown = []
    for article in articles:
        if not q and article['id'] in book_ids:
            continue
        searchable = ' '.join([article['title'], article['attribution'], article['intro'],
                               *(row['text'] + row['translation'] for row in article['sentences']),
                               *(note['meaning'] for row in article['sentences'] for note in row['notes'])])
        if q and q not in searchable:
            continue
        if filters['level'] and article['level'] != filters['level']:
            continue
        if filters['genre'] and article['genre'] != filters['genre']:
            continue
        if filters['skill'] and filters['skill'] not in article['skills']:
            continue
        if curriculum and not article.get('curriculum'):
            continue
        shown.append(article)
    return render(request, 'classical/index.html', {
        'study_area': 'chinese', 'catalog': catalog, 'articles': shown,
        'total': len(articles) - len(book_ids), 'q': q, 'filters': filters, 'curriculum': curriculum,
        'question_count': sum(len(article['questions']) for article in articles),
    })


@require_safe
def detail(request, slug):
    context, response = page_context(request, slug, 'detail')
    if response is not None:
        return response
    modes = ('read', 'recite', 'practice')
    context['initial_mode'] = request.GET.get('mode') if request.GET.get('mode') in modes else 'read'
    context['initial_line'] = next((row['id'] for row in context['article']['sentences'] if row['id'] == request.GET.get('line')), '')
    if 'section' in request.GET:
        section = next((row for row in context['article'].get('sections', []) if row['id'] == request.GET['section']), None)
        if section is None:
            raise Http404('没有找到这一段。')
        context['initial_section'] = section['id']
    return render(request, 'classical/detail.html', context)


@require_safe
def print_article(request, slug):
    context, response = page_context(request, slug, 'print')
    if response is not None:
        return response
    view = request.GET.get('view', 'study')
    context['print_view'] = view if view in ('original', 'study', 'practice', 'answers') else 'study'
    if 'section' in request.GET:
        section = next((row for row in context['article'].get('sections', []) if row['id'] == request.GET['section']), None)
        if section is None or 'unit' in request.GET:
            raise Http404('没有找到可单独打印的段落。')
        context['article']['sentences'] = [row for row in context['article']['sentences'] if row['id'] in section['sentences']]
        context['article']['questions'] = [row for row in context['article']['questions'] if row['sentence'] in section['sentences']]
        context['print_section'] = section
    if 'unit' in request.GET:
        unit = next((row for row in context['article']['sentences'] if row['id'] == request.GET.get('unit')), None)
        if unit is None:
            raise Http404('没有找到这则原文。')
        context['article']['sentences'] = [unit]
        context['article']['questions'] = [row for row in context['article']['questions'] if row['sentence'] == unit['id']]
        context['print_unit'] = unit
    if context['article'].get('sections') and not context.get('print_unit'):
        selected = {row['id']: row for row in context['article']['sentences']}
        paragraphs = []
        for section in context['article']['sections']:
            units = [selected[id] for id in section['sentences'] if id in selected]
            if not units:
                continue
            labels = list(dict.fromkeys(row['reference']['label'] for row in units if row.get('reference')))
            paragraphs.append({'title': section['title'], 'text': ''.join(row['text'] for row in units), 'sources': labels})
        context['print_sections'] = paragraphs
    return render(request, 'classical/print.html', context)


@require_safe
def source(request, slug):
    from poetry.models import PoetryText
    from reference_library.models import Dataset

    context, response = page_context(request, slug, 'source')
    if response is not None:
        return response
    pin = context['article'].get('source_ref')
    reference = None
    if 'line' in request.GET:
        sentence = next((row for row in context['article']['sentences'] if row['id'] == request.GET.get('line')), None)
        if sentence is None:
            raise Http404('没有找到这则原文。')
        reference = sentence.get('reference')
        pin = reference.get('source_ref') if reference else None
    context['source_url'] = reference['url'] if reference else context['article']['source']['url']
    ready = set(Dataset.objects.filter(code__in=('poetry', 'ancient-classics'), state='ready').values_list('code', flat=True)) if pin else set()
    if pin and ready == {'poetry', 'ancient-classics'}:
        row = PoetryText.objects.filter(
            document__version=pin['version'], document__path=pin['path'],
            document__sha256=pin['sha256'], locator=pin['locator'],
        ).only('id', 'body').first()
        if row and pin['anchor_text'] in row.body:
            return redirect('poetry-detail', pk=row.pk)
    return render(request, 'classical/source.html', context)
