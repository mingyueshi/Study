"""Frozen data cleanup shared by the original upgrade and its forward repair.

Only historical models are used. Keep this helper stable after these migrations ship.
"""
from django.db.models import Q


LEGACY_TOPIC_CODES = ('words', 'idioms', 'writing', 'geo', 'astro', 'history', 'lit', 'sci')


def retire_topic_reading(apps, schema_editor):
    alias = schema_editor.connection.alias
    ContentItem = apps.get_model('catalog', 'ContentItem')
    Placement = apps.get_model('catalog', 'Placement')
    Unit = apps.get_model('catalog', 'Unit')
    Module = apps.get_model('catalog', 'Module')
    has_topic_book = any(field.name == 'topic_book' for field in Unit._meta.fields)
    topic_filter = Q(module__code__in=LEGACY_TOPIC_CODES)
    if has_topic_book:
        topic_filter |= Q(placements__unit__topic_book__isnull=False)
    # A card reused by a real textbook remains part of the curriculum, with its UUID and progress.
    textbook_items = Placement.objects.using(alias).filter(
        unit__textbook_book__isnull=False).values('item_id')
    item_ids = list(ContentItem.objects.using(alias).filter(topic_filter).exclude(
        pk__in=textbook_items).values_list('pk', flat=True).distinct())
    # 0005 originally had no cross-app dependencies: preserve that history for installations
    # that migrated catalog alone. Applied external apps are present in the historical state;
    # on a fresh catalog-only upgrade their tables do not exist yet, so there are no rows to clear.
    for app, model, field in [('learning', 'Progress', 'item_id'),
                              ('lexicon', 'ContentEntryLink', 'content_id')]:
        try:
            related = apps.get_model(app, model)
        except LookupError:
            continue
        related.objects.using(alias).filter(**{f'{field}__in': item_ids}).delete()
    Placement.objects.using(alias).filter(item_id__in=item_ids).delete()
    ContentItem.objects.using(alias).filter(pk__in=item_ids).delete()
    if has_topic_book:
        Unit.objects.using(alias).filter(topic_book__isnull=False).delete()
        apps.get_model('catalog', 'TopicBook').objects.using(alias).all().delete()
    # Remove retired reader shells, while retaining independent words and any real curriculum use.
    Module.objects.using(alias).filter(code__in=LEGACY_TOPIC_CODES).exclude(code='words').filter(
        textbook_books__isnull=True, items__isnull=True).delete()
    if schema_editor.connection.vendor == 'postgresql':
        # Validate deferred FK checks before 0005 alters the tables touched by this cleanup.
        # Keep the entire data/schema migration atomic instead of committing partial cleanup.
        schema_editor.execute('SET CONSTRAINTS ALL IMMEDIATE')
