"""批量核对 primary 词卡来源的读音：沿用原教学卡人工音标。

primary-words / primary-english 的音标是旧教学卡人工编写（固定快照、SHA256
锚定），可信度高于网络采集；本命令把它们标为已核对以供词典与词卡展示。
这不是语言学审读——依据与边界写在 LexiconAudit 的 reason 里，可随时撤回。
幂等：已核对的读音自动跳过。
"""
import json

from django.core.management.base import BaseCommand
from lexicon.models import SourceRelease
from lexicon.services import review_objects

REASON = ('沿用原教学卡人工音标（primary 固定快照，SHA256 锚定）批量核对；'
          '非语言学审读，个人修订仍需逐条单独处理。')


class Command(BaseCommand):
    help = '批量核对 primary-words / primary-english 来源的读音（沿用教学卡音标）。'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, *args, **options):
        result = {}
        for code in ('primary-words', 'primary-english'):
            release = SourceRelease.objects.filter(source__code=code).select_related('source').first()
            if not release:
                result[code] = '来源不存在'
                continue
            readings = release.records.exclude(
                binding__pronunciation__isnull=True).values_list('binding__pronunciation_id', flat=True).distinct()
            total = readings.count()
            already = release.records.exclude(
                binding__pronunciation__isnull=True).exclude(
                binding__pronunciation__is_reviewed=False).values_list(
                'binding__pronunciation_id', flat=True).distinct().count()
            result[code] = {'total': total, 'already_reviewed': already, 'to_review': total - already}
            if not options['dry_run']:
                for start in range(0, total, 2000):
                    from lexicon.models import Pronunciation
                    chunk_ids = list(readings[start:start + 2000])
                    review_objects(Pronunciation.objects.filter(pk__in=chunk_ids),
                                   publish=True, reason=REASON)
        result['dry_run'] = options['dry_run']
        self.stdout.write(json.dumps(result, ensure_ascii=False))
