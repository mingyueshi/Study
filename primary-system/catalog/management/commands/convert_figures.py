"""把既有内容的 fig 引用升级为 v2 图示块（幂等）。

source_payload 中的 fig 字段逐字保留（导入保护不变），本命令只把投影写进
sections：图示块置首位，其余分节补显式 type:'text'。已含图示块的内容跳过；
人工修改保护（import_locked）的内容跳过并计数，解锁后可重跑。
"""
import json

from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.models import ContentItem


class Command(BaseCommand):
    help = '把 source_payload.fig 投影为 v2 图示块并补齐文本块类型；幂等，不触碰导入保护内容。'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, *args, **options):
        stats = {'scanned': 0, 'converted': 0, 'already_v2': 0, 'import_locked': 0, 'invalid_fig': 0,
                 'dry_run': options['dry_run'], 'by_module': {}}
        items = ContentItem.objects.filter(source_payload__has_key='fig').select_related('module')
        for item in items:
            stats['scanned'] += 1
            sections = item.sections if isinstance(item.sections, list) else []
            if any(isinstance(s, dict) and s.get('type') == 'figure' for s in sections):
                stats['already_v2'] += 1
                continue
            if item.import_locked:
                stats['import_locked'] += 1
                continue
            fig = item.source_payload.get('fig')
            if not isinstance(fig, str) or not fig.strip():
                stats['invalid_fig'] += 1
                continue
            converted = [{'type': 'figure', 'fig': fig.strip()}]
            for section in sections:
                if isinstance(section, dict) and 'type' not in section:
                    converted.append({'type': 'text', **section})
                else:
                    converted.append(section)
            if not options['dry_run']:
                with transaction.atomic():
                    item.sections = converted
                    item.full_clean()
                    # save() 自动把 schema_version 并入 update_fields。
                    item.save(update_fields=['sections'])
            stats['converted'] += 1
            stats['by_module'][item.module.code] = stats['by_module'].get(item.module.code, 0) + 1
        self.stdout.write(json.dumps(stats, ensure_ascii=False, sort_keys=True))
