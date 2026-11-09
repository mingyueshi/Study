"""Read the scene curriculum and resolve its pinned dictionary evidence."""

import json
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.db.models import F, Q

from lexicon.models import LexicalEntry, active_records, editorial_values

SOURCE_CODE = 'chinese-xinhua-idioms'
MANIFEST_PATH = Path(__file__).parent / 'data' / 'scenarios.json'


def load_curriculum():
    with MANIFEST_PATH.open(encoding='utf-8') as file:
        curriculum = json.load(file)
    if curriculum['schema_version'] != 1 or curriculum['source_code'] != SOURCE_CODE:
        raise ImproperlyConfigured('Unsupported scene idiom curriculum.')
    return curriculum


def dictionary_records():
    return active_records().filter(
        release__source__code=SOURCE_CODE,
        binding__source_id=F('release__source_id'),
        binding__sense__entry__language='zh',
        binding__sense__entry__kind=LexicalEntry.Kind.IDIOM,
    ).filter(
        Q(binding__pronunciation__isnull=True) |
        Q(binding__pronunciation__entry_id=F('binding__sense__entry_id')),
    ).exclude(binding__sense__status=LexicalEntry.Status.ARCHIVED)


def with_details(records):
    return records.select_related('release__source', 'binding__sense__entry', 'binding__pronunciation')


def pinned_records(binding_ids):
    records = with_details(dictionary_records().filter(binding_id__in=binding_ids))
    return {str(record.binding_id): record for record in records}


def matches_pin(record, pin):
    # The original record and release identify the review evidence. New releases
    # may keep the same lexical content and change only supplemental fields.
    if record is None:
        return False
    binding = record.binding
    sense = binding.sense
    return (
        str(binding.pk) == pin['binding_id']
        and str(sense.pk) == pin['sense_id']
        and str(sense.entry_id) == pin['entry_id']
        and (str(binding.pronunciation_id) if binding.pronunciation_id else None) == pin['pronunciation_id']
        and record.release.source.code == pin['source_code']
        and binding.external_key == pin['source_key']
        and record.headword == sense.entry.headword == pin['headword']
        and record.lexical_hash == pin['lexical_hash']
        and editorial_values(sense, binding.pronunciation) == pin['editorial_snapshot']
    )
