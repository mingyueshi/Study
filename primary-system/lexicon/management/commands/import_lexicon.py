import json
from pathlib import Path
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from lexicon.adapters import primary_manifest, xinhua_manifest
from lexicon.importing import ImportProblem, stage_manifest
from lexicon.services import build_matches, link_primary_records
from lexicon.open_sources import unihan_manifest, oewn_manifest


class Command(BaseCommand):
    help = '暂存词库版本并建立来源追溯；不自动启用或公开。支持断点续跑。'

    def add_arguments(self, parser):
        parser.add_argument('--adapter', required=True, choices=['primary', 'xinhua', 'json', 'unihan', 'oewn'])
        parser.add_argument('--input', type=Path)
        parser.add_argument('--selection', type=Path, help='Wordnet 的固定词形范围清单')
        parser.add_argument('--module', choices=['all', 'english', 'words', 'idioms'], default='all')
        parser.add_argument('--dry-run', action='store_true')
        parser.add_argument('--batch-size', type=int, default=500)
        parser.add_argument('--report', type=Path)

    def handle(self, *args, **options):
        if options['report'] and options['input'] and options['report'].resolve() == options['input'].resolve():
            raise CommandError('报告路径不能覆盖输入文件。')
        try:
            if options['adapter'] == 'primary':
                modules = ['english', 'words', 'idioms'] if options['module'] == 'all' else [options['module']]
                manifests = [primary_manifest(module) for module in modules]
            else:
                if not options['input']:
                    raise CommandError('该适配器需要 --input。')
                if options['adapter'] == 'oewn':
                    if not options['selection']:
                        raise CommandError('Wordnet 需要 --selection 固定词形范围。')
                    manifests = [oewn_manifest(options['input'], options['selection'])]
                elif options['adapter'] == 'unihan':
                    manifests = [unihan_manifest(options['input'])]
                else:
                    manifests = [xinhua_manifest(options['input']) if options['adapter'] == 'xinhua' else json.loads(options['input'].read_text(encoding='utf-8'))]
            results = []
            for manifest in manifests:
                release, report = stage_manifest(manifest, dry_run=options['dry_run'], batch_size=options['batch_size'], exact_reuse=options['adapter'] == 'primary')
                if release and options['adapter'] == 'primary':
                    report['links'] = link_primary_records(release)
                results.append({'source': manifest['source']['code'], 'version': manifest['version'],
                                'release_id': str(release.pk) if release else None, **report})
            if not options['dry_run']:
                # Homographs remain separate until a human confirms a merge.
                candidate_count = build_matches()
            else:
                candidate_count = None
            result = {'imports': results, 'new_match_candidates': candidate_count, 'activated': False, 'publicly_published': False}
        except (ImportProblem, ValidationError, OSError, ValueError, KeyError, TypeError) as exc:
            raise CommandError(str(exc)) from exc
        output = json.dumps(result, ensure_ascii=False, indent=2)
        if options['report']:
            options['report'].parent.mkdir(parents=True, exist_ok=True)
            options['report'].write_text(output + '\n', encoding='utf-8')
        self.stdout.write(output)
