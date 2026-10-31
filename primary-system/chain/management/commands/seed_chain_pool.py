"""从词库生效版本填充接龙词池：四字纯汉字成语自动设为可接龙。

只新增，不删除、不取消人工标记；移出接龙请在后台批量操作。
非四字成语（含标点长句）保留在词典中，不进入接龙取词范围。
"""
import json

from django.core.management.base import BaseCommand
from django.db import transaction
from lexicon.models import active_records

from chain.models import ChainWord


def is_playable(headword):
    return len(headword) == 4 and all('\u3400' <= char <= '\u9fff' for char in headword)


class Command(BaseCommand):
    help = '把词库生效版本中的四字纯汉字成语登记进接龙词池（幂等，不删除既有行）。'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')
        parser.add_argument('--batch-size', type=int, default=2000)

    def handle(self, *args, **options):
        entries = list(active_records().filter(binding__sense__entry__kind='idiom')
                       .values_list('binding__sense__entry_id', 'binding__sense__entry__headword')
                       .distinct())
        playable, skipped = [], 0
        seen = set()
        for entry_id, headword in entries:
            if headword in seen:
                continue  # 同一词条可能有多条来源记录；词池按词条登记。
            seen.add(headword)
            if is_playable(headword):
                playable.append((str(entry_id), headword))
            else:
                skipped += 1
        existing = set(ChainWord.objects.filter(entry_id__in=[e for e, _ in playable])
                       .values_list('entry_id', flat=True))
        existing = {str(pk) for pk in existing}
        to_create = [(entry_id, headword) for entry_id, headword in playable if entry_id not in existing]
        result = {'idiom_entries': len(seen), 'playable': len(playable), 'already_in_pool': len(existing),
                  'to_create': len(to_create), 'skipped_not_playable': skipped, 'dry_run': options['dry_run']}
        if not options['dry_run'] and to_create:
            for start in range(0, len(to_create), options['batch_size']):
                chunk = to_create[start:start + options['batch_size']]
                with transaction.atomic():
                    # bulk_create 不走 clean()，首尾字必须显式派生。
                    ChainWord.objects.bulk_create(
                        [ChainWord(entry_id=entry_id, game_eligible=True, first_char=headword[0], last_char=headword[-1])
                         for entry_id, headword in chunk],
                        batch_size=options['batch_size'], ignore_conflicts=True)
        self.stdout.write(json.dumps(result, ensure_ascii=False, default=str))
