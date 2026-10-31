"""从 words-scenario.json 快照导入场景与词位，并把词位挂接词典词条。

内容源在词典（primary-words 生效版本的词条，按 headword==en 匹配）；教学标注
（emoji/拆分/记忆提示/关联词）是 legacy 数据的忠实投影，留在词位上。幂等。
"""
import json

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from lexicon.models import LexicalEntry
from words.models import RelatedGloss, Scenario, ScenarioWord


class Command(BaseCommand):
    help = '导入场景单词快照：建场景与词位并挂接词典词条（幂等）。'

    def add_arguments(self, parser):
        parser.add_argument('--input', default='data/words-scenario.json')
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, *args, **options):
        snapshot = json.loads(open(options['input'], encoding='utf-8').read())
        if snapshot.get('schema_version') != 1:
            raise CommandError('不支持的场景单词快照结构。')
        sha = snapshot.get('sha256', '')
        # 按 headword 匹配生效版本的词条；en 全局唯一 → 词位与词条 1:1，幂等重跑直接复挂。
        entry_by_headword = {e.headword: e for e in LexicalEntry.objects.filter(
            language='en',
            senses__bindings__records__release__source__code='primary-words',
            senses__bindings__records__release_id__in=self.active_release_ids()).distinct()}
        scenario_count = word_count = unmatched = gloss_count = 0
        if not options['dry_run']:
            with transaction.atomic():
                for en, zh in (snapshot.get('glossary') or {}).items():
                    _, created = RelatedGloss.objects.update_or_create(en=en, defaults={'zh': zh})
                    gloss_count += 1 if created else 0
                for order, unit in enumerate(snapshot['units']):
                    scenario, _ = Scenario.objects.update_or_create(
                        code=unit['id'],
                        defaults={'name': unit['name'], 'zh': unit['zh'], 'emoji': unit.get('emoji', ''),
                                  'color': unit.get('color', '#4d96ff'), 'order': order})
                    scenario_count += 1
                    for word in unit['words']:
                        entry = entry_by_headword.get(word['en'])
                        if entry is None:
                            unmatched += 1
                            continue
                        ScenarioWord.objects.update_or_create(
                            en=word['en'],
                            defaults={'entry': entry, 'scenario': scenario, 'emoji': word.get('emoji', ''),
                                      'segments': word.get('parts', []), 'memo': word.get('memo', ''),
                                      'related': word.get('related', [])})
                        word_count += 1
        result = {'units': len(snapshot['units']), 'words': sum(len(u['words']) for u in snapshot['units']),
                  'scenarios': scenario_count, 'scenario_words': word_count, 'glossary_new': gloss_count,
                  'unmatched_no_entry': unmatched, 'sha256': sha[:16], 'dry_run': options['dry_run']}
        self.stdout.write(json.dumps(result, ensure_ascii=False))

    @staticmethod
    def active_release_ids():
        from lexicon.models import LexiconSource
        return [s.active_release_id for s in LexiconSource.objects.filter(
            code='primary-words', active_release__isnull=False)]
