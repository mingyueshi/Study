from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from lexicon.models import SourceRelease
from lexicon.services import activate_release


class Command(BaseCommand):
    help = '审核后启用或回退一个完整来源版本；不改变公开使用权限。'

    def add_arguments(self, parser):
        parser.add_argument('release_id')
        parser.add_argument('--expected-current', required=True, help='此前生效版本 UUID；尚未启用填 none')
        parser.add_argument('--reason', required=True)

    def handle(self, *args, **options):
        try:
            source = activate_release(options['release_id'], expected_current='' if options['expected_current'] == 'none' else options['expected_current'], reason=options['reason'])
        except (ValidationError, SourceRelease.DoesNotExist, ValueError) as exc:
            raise CommandError(str(exc)) from exc
        self.stdout.write(f'{source.code} 已启用 {source.active_release.version}；公开准入={source.public_allowed}')
