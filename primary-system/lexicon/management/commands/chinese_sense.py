"""Explicit maintenance workflow; JSON input includes the actually reviewed snapshot."""
import json
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.core.exceptions import ValidationError
from django.db import transaction
from lexicon.models import ChineseSenseVersion, ContentEntryLink, SourceRecord, editorial_values, same_snapshot
from lexicon.chinese import (create_chinese, review_chinese, adopt_chinese, reconfirm_link, lock_selection, validate_version)


class Command(BaseCommand):
    help = '中文义项版本：inspect/create/review/adopt-target/adopt-link/new-target/new-link/reconfirm-link；采用和确认要求CAS。'

    def add_arguments(self, parser):
        parser.add_argument('action', choices=['inspect', 'create', 'review', 'adopt-target', 'adopt-link', 'new-target', 'new-link', 'reconfirm-link'])
        parser.add_argument('--input', help='UTF-8 JSON；create/new-link/reconfirm-link含expected_snapshot，review/adopt含所见revision')
        parser.add_argument('--id', help='inspect的证据或中文版本UUID')
        parser.add_argument('--dry-run', action='store_true')

    @transaction.atomic
    def handle(self, *args, **options):
        from words.models import LearningTarget
        data = json.loads(Path(options['input']).read_text()) if options['input'] else {}
        action = options['action']
        try:
            if action == 'inspect':
                version = ChineseSenseVersion.objects.filter(pk=options['id']).first()
                if version:
                    self.stdout.write(json.dumps({'version_id': str(version.pk), 'status': version.status,
                        'review_revision': version.review_revision, 'snapshot': version.editorial_snapshot}, ensure_ascii=False))
                else:
                    record = SourceRecord.objects.select_related('binding__sense', 'binding__pronunciation').get(pk=options['id'])
                    self.stdout.write(json.dumps({'evidence_id': str(record.pk), 'snapshot': editorial_values(record.binding.sense, record.binding.pronunciation), 'source_definition': record.definition, 'source_pronunciation': record.pronunciation_value, 'headword': record.headword, 'gloss_language': record.binding.sense.gloss_language}, ensure_ascii=False))
                return
            if action == 'create':
                result = create_chinese(**data)
            elif action == 'review':
                result = review_chinese(**data)
            elif action.startswith('adopt-'):
                result = adopt_chinese(**data)
            elif action == 'reconfirm-link':
                result = reconfirm_link(**data)
            elif action == 'new-link':
                record = SourceRecord.objects.get(pk=data['evidence_id'])
                sense, pron = lock_selection(record.binding.sense_id, record.binding.pronunciation_id, record.pk)
                if not same_snapshot(editorial_values(sense, pron), data['expected_snapshot']):
                    raise ValidationError('所见修订已变化，请重新确认。')
                result = ContentEntryLink.objects.create(content_id=data['content_id'], slot=data.get('slot', 'main'),
                    sense=sense, pronunciation=pron, evidence=record, method='manual', review_note=data['reason'])
            elif action == 'new-target':
                version = ChineseSenseVersion.objects.get(pk=data['version_id'])
                sense, pron = lock_selection(version.sense_id, version.pronunciation_id, version.evidence_id)
                if editorial_values(sense, pron) != version.editorial_snapshot:
                    raise ValidationError('中文固定修订已失效，不能创建新目标。')
                result = LearningTarget.objects.create(label=data['label'], sense=sense, pronunciation=pron, evidence=version.evidence)
                result = adopt_chinese(target_id=result.pk, version_id=version.pk, expected_revision=0,
                    expected_review_revision=data['expected_review_revision'], reason=data['reason'])
            else:
                raise ValidationError('未知操作。')
        except (ValidationError, KeyError, ValueError) as exc:
            raise CommandError(str(exc)) from exc
        self.stdout.write(json.dumps({'id': str(result.pk), 'dry_run': options['dry_run'], 'action': action}))
        if options['dry_run']:
            transaction.set_rollback(True)
