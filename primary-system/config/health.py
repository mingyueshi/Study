"""Minimal readiness probe; no account, dataset, or exception details are exposed."""
from django.db import DatabaseError, connection
from django.http import JsonResponse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe


@require_safe
@never_cache
def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1 FROM django_migrations LIMIT 1')
            if cursor.fetchone() is None:
                raise DatabaseError('Uninitialized database')
    except DatabaseError:
        return JsonResponse({'status': 'unavailable'}, status=503)
    return JsonResponse({'status': 'ok'})
