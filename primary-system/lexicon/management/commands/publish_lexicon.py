from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from lexicon.models import LexicalEntry, LexiconAudit, LexiconSource, Pronunciation, Sense, SourceRelease
from lexicon.open_sources import registry, release_notices
from lexicon.services import activate_release


class Command(BaseCommand):
    help = '按固定清单审查结果发布登记的开放来源；要求明确版本摘要、当前版本和依据。'

    def add_arguments(self, parser):
        parser.add_argument('release_id')
        parser.add_argument('--expected-checksum', required=True)
        parser.add_argument('--expected-current', required=True)
        parser.add_argument('--reason', required=True)

    @transaction.atomic
    def handle(self, *args, **options):
        try:
            release = SourceRelease.objects.get(pk=options['release_id'])
            source = LexiconSource.objects.select_for_update().get(pk=release.source_id)
            spec = next((s for s in registry().values() if s['source']['code'] == source.code), None)
            if not spec or release.source_snapshot != spec['source']:
                raise CommandError('只支持许可与加工范围均与登记一致的开放来源。')
            if release.checksum != options['expected_checksum'] or not options['reason'].strip():
                raise CommandError('待审核版本摘要不符或未填写审查依据。')
            for asset in [spec, *spec.get('auxiliary', [])]:
                if release.source_files.get(asset['file'], {}).get('sha256') != asset['sha256']:
                    raise CommandError('版本文件摘要与登记不符。')
            if spec.get('notices') and {name for name, _ in release_notices(release)} != set(spec['notices']):
                raise CommandError('当前数据版本缺少完整的归档许可。')
            expected = '' if options['expected_current'] == 'none' else options['expected_current']
            if str(source.active_release_id or '') != expected:
                raise CommandError('当前生效版本改变，请重新核对。')
            if release.status != 'ready' or release.records.count() != release.total:
                raise CommandError('版本未完整导入。')
            before = {'public_allowed': source.public_allowed, 'enabled': source.enabled, 'license': source.data_license}
            for field in ('name', 'url', 'attribution', 'data_license', 'license_url', 'changes', 'rights_evidence'):
                setattr(source, field, spec['source'].get(field, ''))
            source.public_allowed = source.enabled = True
            source.full_clean(); source.save()
            LexiconAudit.objects.create(action='source_policy', source=source, reason=options['reason'], before=before,
                                       after={'public_allowed': True, 'license': source.data_license, 'snapshot': release.source_snapshot})
            records = release.records.all()
            entries = LexicalEntry.objects.filter(senses__bindings__records__in=records).exclude(status__in=['merged', 'archived']).distinct()
            senses = Sense.objects.filter(bindings__records__in=records, revision=0).exclude(status='archived').distinct()
            readings = Pronunciation.objects.filter(bindings__records__in=records, revision=0).distinct()
            # Source-backed release review. Existing manual revisions require their own review.
            for model, objects, field, value in [(LexicalEntry, entries, 'status', 'published'), (Sense, senses, 'status', 'published'), (Pronunciation, readings, 'is_reviewed', True)]:
                ids = list(objects.values_list('pk', flat=True))
                for start in range(0, len(ids), 500):
                    batch = model.objects.select_for_update().filter(pk__in=ids[start:start + 500])
                    previous = [{'id': str(pk), field: state} for pk, state in batch.values_list('pk', field)]
                    batch.update(**{field: value})
                    LexiconAudit.objects.create(action='review_release', source=source, reason=options['reason'],
                                               before={'model': model._meta.label, 'items': previous},
                                               after={'release': str(release.pk), 'checksum': release.checksum, field: value})
            activate_release(release.pk, expected_current=expected, reason=options['reason'])
            self.stdout.write(f'{source.code}: 已发布固定版本 {release.version}；人工修订未批量核准。')
        except (ValidationError, SourceRelease.DoesNotExist, ValueError) as exc:
            raise CommandError(str(exc)) from exc
