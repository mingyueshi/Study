"""Import the pinned upstream snapshot without guessing or repairing dictionary text."""
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.core.cache import cache
from game.models import Idiom

VERSION = '8de1001aa499cd65fb97ef8712550188c0297a08'
SHA256 = '1d4b4f454ce1c416d6a1ab2369d6e66c0ff99e04390172eef70790499e21ce19'
SOURCE_URL = f'https://github.com/pwxcoo/chinese-xinhua/blob/{VERSION}/data/idiom.json'
HAN = re.compile(r'^[\u3400-\u9fff]{4}$')
SYLLABLE = re.compile(r'^[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+$')
TONES = set('āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ')
VOWELS = set('aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ')
FIELDS = ('word', 'explanation', 'pinyin', 'derivation', 'example', 'abbreviation')


def reading_format_ok(pinyin, word):
    """Conservative format gate, NOT a linguistic assertion of correct pronunciation."""
    if not word or not all('\u3400' <= char <= '\u9fff' for char in word):
        return False
    syllables = pinyin.split()
    return len(syllables) == len(word) and all(
        SYLLABLE.fullmatch(s) and any(c in VOWELS for c in s)
        and sum(c in TONES for c in s) <= 1 for s in syllables
    )


class Command(BaseCommand):
    help = 'Import the checksum-pinned chinese-xinhua idiom.json; preserve curated meanings and existing rounds.'

    def add_arguments(self, parser):
        parser.add_argument('input', type=Path)
        parser.add_argument('--report', type=Path)
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, *args, **options):
        path = options['input']
        if options['report'] and options['report'].resolve() == path.resolve():
            raise CommandError('Report path must differ from input path.')
        try:
            raw_bytes = path.read_bytes()
        except OSError as exc:
            raise CommandError(str(exc)) from exc
        actual_hash = hashlib.sha256(raw_bytes).hexdigest()
        if actual_hash != SHA256:
            raise CommandError(f'SHA256 mismatch: expected {SHA256}, got {actual_hash}; nothing imported.')
        try:
            rows = json.loads(raw_bytes)
        except (ValueError, UnicodeError) as exc:
            raise CommandError('Invalid UTF-8 JSON; nothing imported.') from exc
        if not isinstance(rows, list):
            raise CommandError('Expected a JSON array.')
        counts = Counter({k: 0 for k in ('created','updated','unchanged','skipped_invalid_record','skipped_invalid_word','skipped_duplicate','not_four_han','reading_needs_review','empty_explanation','game_eligible','curated_meaning_preserved','manual_locked_preserved')})
        counts['total'] = len(rows)
        anomalies = []
        seen = set()
        prepared = []
        for number, row in enumerate(rows, 1):
            reasons = []
            if not isinstance(row, dict) or any(not isinstance(row.get(k, ''), str) for k in FIELDS):
                counts['skipped_invalid_record'] += 1
                anomalies.append({'row': number, 'reasons': ['invalid_record_shape'], 'raw': row})
                continue
            word = row.get('word', '')
            if not word or len(word) > 64 or word != word.strip():
                counts['skipped_invalid_word'] += 1
                anomalies.append({'row': number, 'word': word, 'reasons': ['invalid_word'], 'raw': row})
                continue
            if word in seen:
                counts['skipped_duplicate'] += 1
                anomalies.append({'row': number, 'word': word, 'reasons': ['duplicate'], 'raw': row})
                continue
            seen.add(word)
            if not HAN.fullmatch(word):
                reasons.append('not_four_han')
                counts['not_four_han'] += 1
            ok = reading_format_ok(row.get('pinyin', ''), word)
            if not ok:
                reasons.append('reading_needs_review')
                counts['reading_needs_review'] += 1
            if not row.get('explanation', '').strip():
                reasons.append('empty_explanation')
                counts['empty_explanation'] += 1
            eligible = bool(HAN.fullmatch(word)) and ok and bool(row.get('explanation', '').strip())
            counts['game_eligible'] += int(eligible)
            for field in FIELDS:
                counts[f'nonempty_{field}'] += int(bool(row.get(field, '').strip()))
                counts[f'usable_{field}'] += int(row.get(field, '').strip() not in ('', '无'))
            if reasons:
                anomalies.append({'row': number, 'word': word, 'pinyin': row.get('pinyin', ''), 'reasons': reasons})
            prepared.append((word, row, ok, eligible))
        # One atomic offline import: a failed import never leaves a partially changed snapshot.
        with transaction.atomic():
            existing = {item.word: item for item in Idiom.objects.filter(word__in=seen)}
            for word, row, ok, eligible in prepared:
                item = existing.get(word)
                if item is not None and item.import_locked:
                    counts['manual_locked_preserved'] += 1
                    continue
                defaults = {
                    'source_explanation': row.get('explanation', ''),
                    'pinyin': row.get('pinyin', ''), 'derivation': row.get('derivation', ''),
                    'example': row.get('example', ''), 'abbreviation': row.get('abbreviation', ''),
                    'source_version': VERSION, 'source_url': SOURCE_URL, 'source_raw': row,
                    'reading_status': 'format_checked' if ok else 'needs_review',
                    'game_eligible': eligible, 'first_char': word[0], 'last_char': word[-1],
                }
                if item is None or item.source != 'curated':
                    defaults.update(meaning=row.get('explanation', ''), source='chinese-xinhua')
                else:
                    counts['curated_meaning_preserved'] += 1
                if item is None:
                    counts['created'] += 1
                elif all(getattr(item, key) == value for key, value in defaults.items()):
                    counts['unchanged'] += 1
                    continue
                else:
                    counts['updated'] += 1
                if not options['dry_run']:
                    Idiom.objects.update_or_create(word=word, defaults=defaults)
            if options['dry_run']:
                transaction.set_rollback(True)
        if not options['dry_run']:
            cache.delete('dictionary_counts')
        counts['accepted'] = len(prepared)
        report = {
            'source': 'pwxcoo/chinese-xinhua', 'version': VERSION, 'sha256': actual_hash,
            'source_url': SOURCE_URL, 'input_bytes': len(raw_bytes), 'dry_run': options['dry_run'],
            'counts': dict(counts), 'anomalies': anomalies,
            'policy': 'Raw text retained. Format checking is not linguistic validation. No inferred synonyms, antonyms, or pronunciation repairs. Curated meaning/source and enabled status are preserved; import_locked rows are not modified; no rows or rounds are deleted.',
        }
        if options['report']:
            report_path = options['report']
            if report_path.resolve() == path.resolve():
                raise CommandError('Report path must differ from input path.')
            report_path.parent.mkdir(parents=True, exist_ok=True)
            report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        self.stdout.write(json.dumps({'dry_run': options['dry_run'], 'counts': dict(counts)}, ensure_ascii=False))
