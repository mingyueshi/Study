import json
from pathlib import Path
from django.core.management.base import BaseCommand,CommandError
from scripts.inventory_chinese import inventory
class Command(BaseCommand):
    def add_arguments(self,p):p.add_argument('--output',required=True)
    def handle(self,*args,**options):
        file=Path(options['output'])
        if file.exists():raise CommandError('清点文件已存在，拒绝覆盖恢复证据。')
        result=inventory();file.write_text(json.dumps(result,ensure_ascii=False,indent=2,default=str))
        self.stdout.write(json.dumps(result['summary'],ensure_ascii=False))
