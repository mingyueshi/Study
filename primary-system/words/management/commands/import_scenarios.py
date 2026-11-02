"""只新增编排与目标；既有人工标注与学习身份始终保留。"""
import json
from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from lexicon.models import active_records
from words.models import LearningTarget, RelatedGloss, Scenario, ScenarioWord, editorial_values


class Command(BaseCommand):
    help = '导入场景编排；多义时指定 evidence_id 或 target_id；dry-run 完整预演后回滚。'

    def add_arguments(self, parser):
        parser.add_argument('--input', required=True, help='显式提供已核对的场景JSON；启动不依赖旧导出文件。')
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, *args, **options):
        snapshot = json.loads(Path(options['input']).read_text(encoding='utf-8'))
        if snapshot.get('schema_version') not in (1, 2):
            raise CommandError('不支持的场景单词快照结构。')
        stats = dict(scenarios=0, scenario_words=0, created_targets=0, created_placements=0,
                     preserved=0, glossary_new=0, unmatched_no_entry=0, ambiguous=0, conflicts=0)
        issues = []
        with transaction.atomic():
            # 串行化本应用导入，以免不同场景首写重复创建学习目标。
            from lexicon.models import LexiconSource
            list(LexiconSource.objects.select_for_update().filter(code='primary-words'))
            records = list(active_records().filter(release__source__code='primary-words').select_related('binding__sense'))
            by_en = {}
            for record in records:
                by_en.setdefault(record.headword, []).append(record)
            for en, zh in (snapshot.get('glossary') or {}).items():
                _, created = RelatedGloss.objects.get_or_create(en=en, defaults={'zh': zh})
                stats['glossary_new'] += int(created)
            for order, unit in enumerate(snapshot['units']):
                scenario, _ = Scenario.objects.get_or_create(code=unit['id'], defaults={
                    'name': unit['name'], 'zh': unit['zh'], 'emoji': unit.get('emoji', ''),
                    'color': unit.get('color', '#4d96ff'), 'order': order})
                stats['scenarios'] += 1
                for index, word in enumerate(unit['words']):
                    en = word['en']
                    target = None
                    explicit = bool(word.get('target_id') or word.get('evidence_id'))
                    if word.get('target_id'):
                        try:
                            target = LearningTarget.objects.get(pk=word['target_id'], label=en)
                        except (LearningTarget.DoesNotExist, ValueError, ValidationError):
                            stats['conflicts'] += 1
                            issues.append({'scenario': unit['id'], 'en': en, 'reason': '目标不存在或词形不一致'})
                            continue
                    else:
                        choices = by_en.get(en, [])
                        if word.get('evidence_id'):
                            choices = [r for r in choices if str(r.pk) == word['evidence_id']]
                        if len(choices) != 1:
                            key = 'unmatched_no_entry' if not choices else 'ambiguous'
                            stats[key] += 1
                            issues.append({'scenario': unit['id'], 'en': en, 'reason': key,
                                           'evidence_ids': [str(r.pk) for r in choices]})
                            continue
                        record = choices[0]
                        existing = list(LearningTarget.objects.filter(evidence=record, label=en))
                        # 同binding新版证据相同也复用旧目标，固定原快照不改。
                        if not existing:
                            existing = list(LearningTarget.objects.filter(label=en, evidence__binding=record.binding,
                                evidence__lexical_hash=record.lexical_hash))
                        if len(existing) > 1:
                            stats['ambiguous'] += 1
                            issues.append({'scenario': unit['id'], 'en': en, 'reason': '多个既有目标，须指定target_id'})
                            continue
                        target = existing[0] if existing else None
                        if not explicit and ScenarioWord.objects.filter(scenario=scenario, en=en).exclude(target=target).exists():
                            stats['conflicts'] += 1
                            issues.append({'scenario': unit['id'], 'en': en, 'reason': '已有词卡身份不同，禁止自动换义'})
                            continue
                        if target is None:
                            target = LearningTarget.objects.create(label=en, sense=record.binding.sense,
                                pronunciation=record.binding.pronunciation, evidence=record,
                                review_note='导入时唯一证据' if not explicit else '导入显式指定证据')
                            stats['created_targets'] += 1
                    if target.editorial_snapshot != editorial_values(target.sense, target.pronunciation):
                        stats['conflicts'] += 1
                        issues.append({'scenario': unit['id'], 'en': en, 'reason': '人工修订变化，须明确新建并选用已复核目标'})
                        continue
                    if word.get('evidence_id') and str(target.evidence_id) != word['evidence_id']:
                        stats['conflicts'] += 1
                        issues.append({'scenario': unit['id'], 'en': en, 'reason': 'target_id与evidence_id不一致'})
                        continue
                    annotation = {'emoji': word.get('emoji', ''), 'segments': word.get('parts', []),
                                  'memo': word.get('memo', ''), 'related': word.get('related', [])}
                    if not target.sense_id:
                        stats['conflicts'] += 1
                        issues.append({'scenario': unit['id'], 'en': en, 'reason': '待复核旧目标不能新增编排'})
                        continue
                    _, created = ScenarioWord.objects.get_or_create(scenario=scenario, target=target,
                        defaults={'en': en, 'entry_id': target.sense.entry_id, 'order': index,
                                  'import_baseline': annotation, **annotation})
                    stats['scenario_words'] += 1
                    stats['created_placements' if created else 'preserved'] += 1
            if options['dry_run']:
                transaction.set_rollback(True)
        self.stdout.write(json.dumps({**stats, 'issues': issues, 'dry_run': options['dry_run'],
            'units': len(snapshot['units']), 'sha256': snapshot.get('sha256', '')[:16]}, ensure_ascii=False))
