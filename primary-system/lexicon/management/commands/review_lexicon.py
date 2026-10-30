"""批量审核一个已完整的来源版本。

来源公开准入必须先在后台完成（manage_sources，写入 source_policy 审计）；
本命令只负责按固定快照批量发布词条与义项，读音按保守格式校验分级核对。
格式校验移植自 idiom-chain 的导入器：音节数等于字数、小写、每音节至多一个调号。
它不是语言学断言，只是可复核的一致性门槛；未通过的读音保持未核对、不展示。
"""
import json
import re
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Q
from lexicon.importing import ImportProblem
from lexicon.models import LexicalEntry, LexiconAudit, Pronunciation, Sense, SourceRecord, SourceRelease

SYLLABLE = re.compile(r'^[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+$')
TONES = set('āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ')
VOWELS = set('aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ')

REVIEW_REASON = ('固定快照批量审核：释义按来源证据原样发布；读音按格式校验'
                 '（音节数=字数、小写、每音节至多一个调号）分级核对，'
                 '未通过的保持未核对。非逐条人工审读，依据见来源 rights_evidence。')


def reading_format_ok(pinyin, word):
    """Conservative format gate, NOT a linguistic assertion of correct pronunciation."""
    if not word or not all('\u3400' <= char <= '\u9fff' for char in word):
        return False
    # 上游用 U+0261（手写体 g）替代 ASCII g；存储数据保持原样，校验时视为同一字母的排版变体。
    syllables = pinyin.replace('\u0261', 'g').split()
    return len(syllables) == len(word) and all(
        SYLLABLE.fullmatch(s) and any(c in VOWELS for c in s)
        and sum(c in TONES for c in s) <= 1 for s in syllables
    )


class Command(BaseCommand):
    help = '批量发布一个来源版本的词条与义项；读音按拼音格式校验分级核对。来源须已公开准入。'

    def add_arguments(self, parser):
        parser.add_argument('--release', required=True, help='SourceRelease UUID')
        parser.add_argument('--dry-run', action='store_true')
        parser.add_argument('--batch-size', type=int, default=2000)
        parser.add_argument('--report', type=str)

    def handle(self, *args, **options):
        try:
            result = self.review(options['release'], dry_run=options['dry_run'],
                                 batch_size=max(1, min(options['batch_size'], 5000)))
        except (ImportProblem, ValueError) as exc:
            raise CommandError(str(exc)) from exc
        output = json.dumps(result, ensure_ascii=False, indent=2)
        if options['report']:
            from pathlib import Path
            report = Path(options['report'])
            report.parent.mkdir(parents=True, exist_ok=True)
            report.write_text(output + '\n', encoding='utf-8')
        self.stdout.write(output)

    def review(self, release_id, *, dry_run, batch_size):
        release = SourceRelease.objects.select_related('source').filter(pk=release_id).first()
        if not release:
            raise ImportProblem('来源版本不存在。')
        if release.status != 'ready' or release.processed != release.total or release.records.count() != release.total:
            raise ImportProblem('导入未完整完成，不能批量审核。')
        source = release.source
        if not source.public_allowed:
            raise ImportProblem('来源尚未公开准入；请先在后台来源管理完成许可与依据审核（manage_sources）。')

        entries = LexicalEntry.objects.filter(
            senses__bindings__records__release=release).exclude(status__in=['merged', 'archived']).distinct()
        # 与登记发布一致：人工修订（revision>0）必须逐条单独审核，不批量核准。
        # 空释义词义（非汉字条目、来源与人工释义均为空）没有可展示的内容，不批量发布；
        # 纯空白释义需人工复核后单独处理。
        senses = Sense.objects.filter(bindings__records__release=release, revision=0).exclude(status='archived').exclude(
            Q(bindings__records__definition__in=['', '无']) & Q(editorial_definition='') & ~Q(entry__kind='character')).distinct()
        # 主键一次性取回后分片，避免对大 join 反复 OFFSET/COUNT。
        entry_ids = list(entries.values_list('pk', flat=True))
        sense_ids = list(senses.values_list('pk', flat=True))

        # 读音按其在该版本内全部来源记录校验；任一记录不通过即保持未核对。
        # 「来源未提供读音」与「格式未通过」分开统计；两者都不批量核对。
        invalid_pronunciations, failed_samples = set(), []
        empty_records = format_failed_records = 0
        rows = SourceRecord.objects.filter(release=release, binding__pronunciation__isnull=False).values_list(
            'binding__pronunciation_id', 'headword', 'pronunciation_value')
        total_pronunciations = set()
        for pronunciation_id, headword, pinyin in rows:
            total_pronunciations.add(pronunciation_id)
            if not pinyin.strip():
                empty_records += 1
                invalid_pronunciations.add(pronunciation_id)
                continue
            if not reading_format_ok(pinyin, headword):
                format_failed_records += 1
                invalid_pronunciations.add(pronunciation_id)
                if len(failed_samples) < 10:
                    failed_samples.append({'headword': headword, 'pinyin': pinyin})
        valid_pronunciations = sorted(total_pronunciations - invalid_pronunciations)

        result = {'release': str(release.pk), 'source': source.code, 'dry_run': dry_run,
                  'entries': len(entry_ids), 'senses': len(sense_ids),
                  'pronunciations_total': len(total_pronunciations),
                  'pronunciations_to_review': len(valid_pronunciations),
                  'pronunciations_kept_unreviewed': len(invalid_pronunciations),
                  'records_without_value': empty_records,
                  'records_failed_format': format_failed_records,
                  'failed_pinyin_samples': failed_samples}
        if dry_run:
            return result

        for start in range(0, len(entry_ids), batch_size):
            self.publish_batch(LexicalEntry, 'status', 'published', entry_ids[start:start + batch_size], release)
        for start in range(0, len(sense_ids), batch_size):
            self.publish_batch(Sense, 'status', 'published', sense_ids[start:start + batch_size], release)
        for start in range(0, len(valid_pronunciations), batch_size):
            self.publish_batch(Pronunciation, 'is_reviewed', True, valid_pronunciations[start:start + batch_size], release)
        result['entries_reviewed'] = len(entry_ids)
        result['senses_reviewed'] = len(sense_ids)
        result['pronunciations_reviewed'] = len(valid_pronunciations)
        return result

    @staticmethod
    def publish_batch(model, field, value, pks, release):
        """与 publish_lexicon 相同的批量审计粒度：每批一条 review_release 审计记录。"""
        with transaction.atomic():
            batch = model.objects.select_for_update().filter(pk__in=pks)
            previous = [{'id': str(pk), field: state} for pk, state in batch.values_list('pk', field)]
            batch.update(**{field: value})
            LexiconAudit.objects.create(action='review_release', source=release.source, reason=REVIEW_REASON,
                                        before={'model': model._meta.label, 'items': previous},
                                        after={'release': str(release.pk), 'checksum': release.checksum, field: value})
