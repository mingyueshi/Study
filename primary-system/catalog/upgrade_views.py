from datetime import date
from itertools import groupby

from django.core.paginator import Paginator
from django.http import QueryDict
from django.shortcuts import render
from django.views.decorators.http import require_GET

from .file_content import content_page
from .upgrade_history import HistoryError, load_history


@require_GET
@content_page('升级记录', error_type=HistoryError)
def upgrade_history(request):
    records = load_history()
    months = sorted({row['date'][:7] for row in records}, reverse=True)
    selected_month = request.GET.get('month', '')
    if selected_month not in months:
        selected_month = ''
    query = request.GET.get('q', '').strip()[:160]
    terms = query.casefold().split()
    filtered = [row for row in records
                if (not selected_month or row['date'].startswith(selected_month))
                and all(term in f"{row['title']} {row['revision']} {row['date']}".casefold() for term in terms)]
    groups = [{'date': date.fromisoformat(day), 'records': [
        {**row, 'short_revision': row['revision'][:8]} for row in rows
    ]} for day, rows in groupby(filtered, key=lambda row: row['date'])]
    page = Paginator(groups, 5).get_page(request.GET.get('page'))

    def page_url(number):
        params = QueryDict(mutable=True)
        if query:
            params['q'] = query
        if selected_month:
            params['month'] = selected_month
        params['page'] = str(number)
        return '?' + params.urlencode() + '#history'

    return render(request, 'catalog/upgrade_history.html', {
        'query': query, 'selected_month': selected_month,
        'months': [{'value': month, 'label': f'{month[:4]} 年 {int(month[5:])} 月'} for month in months],
        'total': len(records), 'day_count': len({row['date'] for row in records}),
        'first_date': date.fromisoformat(records[-1]['date']),
        'latest_date': date.fromisoformat(records[0]['date']),
        'result_count': len(filtered), 'page': page,
        'previous_url': page_url(page.previous_page_number()) if page.has_previous() else '',
        'next_url': page_url(page.next_page_number()) if page.has_next() else '',
    })
