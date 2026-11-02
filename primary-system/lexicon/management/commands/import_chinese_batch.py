import json
from pathlib import Path
from django.core.management.base import BaseCommand,CommandError
from django.core.exceptions import ValidationError
from lexicon.chinese_batches import import_batch
class Command(BaseCommand):
    help='固定中文批次整批预检与幂等采用；必须先取得主控对清单摘要的结论。'
    def add_arguments(self,p):
        p.add_argument('--input',required=True);p.add_argument('--reviewer',required=True);p.add_argument('--expected-digest');p.add_argument('--dry-run',action='store_true')
    def handle(self,*args,**options):
        try: result=import_batch(json.loads(Path(options['input']).read_text()),reviewer=options['reviewer'],dry_run=options['dry_run'],expected_digest=options['expected_digest'])
        except ValidationError as exc: raise CommandError('; '.join(exc.messages)) from exc
        self.stdout.write(json.dumps(result,ensure_ascii=False))
