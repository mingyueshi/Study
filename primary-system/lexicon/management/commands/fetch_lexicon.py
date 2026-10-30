import hashlib
import os
import tempfile
from pathlib import Path
from urllib.request import Request, urlopen
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from lexicon.open_sources import registry


class Command(BaseCommand):
    help = '下载登记的官方固定快照并检查 SHA256；不导入或发布。'

    def add_arguments(self, parser):
        parser.add_argument('adapter', choices=['unihan', 'oewn'])
        parser.add_argument('--output-dir', type=Path, default=settings.BASE_DIR / 'data/lexicon')

    def handle(self, *args, **options):
        spec = registry()[options['adapter']]
        folder = options['output_dir']; folder.mkdir(parents=True, exist_ok=True)
        for asset in [spec, *spec.get('auxiliary', [])]:
            self.fetch(asset, folder)

    def fetch(self, spec, folder):
        destination = folder / spec['file']
        if destination.exists():
            if hashlib.sha256(destination.read_bytes()).hexdigest() != spec['sha256']:
                raise CommandError('已有文件摘要不符，未覆盖。请先核对文件。')
            self.stdout.write(f'已有校验通过的快照：{destination}')
            return
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(dir=folder, delete=False) as output:
                temporary = Path(output.name)
                with urlopen(Request(spec['url'], headers={'User-Agent': 'Study-lexicon/1.0'}), timeout=30) as response:
                    total = 0
                    while chunk := response.read(256 * 1024):
                        total += len(chunk)
                        if total > 40_000_000:
                            raise CommandError('下载大小超限。')
                        output.write(chunk)
            if hashlib.sha256(temporary.read_bytes()).hexdigest() != spec['sha256']:
                raise CommandError('下载摘要不符，未保存为正式快照。')
            # Exclusive creation avoids overwriting another fetcher's completed file.
            os.link(temporary, destination)
        except (OSError, ValueError) as exc:
            raise CommandError(str(exc)) from exc
        finally:
            if temporary:
                temporary.unlink(missing_ok=True)
        self.stdout.write(f'下载并校验完成：{destination}')
