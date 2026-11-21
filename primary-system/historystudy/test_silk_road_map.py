import os
from pathlib import Path
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory

from django.test import SimpleTestCase


class SilkRoadMapBuildTests(SimpleTestCase):
    def test_build_and_check_use_utf8_under_ascii_locale(self):
        project = Path(__file__).resolve().parents[1]
        with TemporaryDirectory() as directory:
            root = Path(directory)
            script = root / 'scripts/build_silk_road_map.py'
            script.parent.mkdir()
            shutil.copyfile(project / 'scripts' / script.name, script)
            input_path = Path('content_sources/history-timeline/assets/silk-road/ne-110m-land.geojson')
            (root / input_path).parent.mkdir(parents=True)
            shutil.copyfile(project / input_path, root / input_path)
            output_path = Path('content_sources/history-timeline/silk-road-geo.js')
            env = os.environ | {
                'LC_ALL': 'C', 'PYTHONUTF8': '0', 'PYTHONCOERCECLOCALE': '0', 'PYTHONIOENCODING': 'utf-8',
            }
            for args in ([], ['--check']):
                result = subprocess.run([sys.executable, str(script), *args], env=env,
                                        capture_output=True, encoding='utf-8')
                self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual((root / output_path).read_bytes(), (project / output_path).read_bytes())
