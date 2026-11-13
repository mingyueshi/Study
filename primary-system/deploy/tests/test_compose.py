"""Exercise actual make/shell dispatch with recording Docker and Git executables."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]


class ComposeCommandsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.config = self.root / 'production.env'
        self.config.touch()
        self.trace = self.root / 'calls.jsonl'
        self.env = {**os.environ, 'PATH': str(self.root) + os.pathsep + os.environ['PATH'],
                    'COMMAND_TRACE': str(self.trace)}
        program = f'#!{sys.executable}\n' + '''
import json, os, sys
from pathlib import Path
tool = Path(sys.argv[0]).name
args = sys.argv[1:]
with open(os.environ['COMMAND_TRACE'], 'a') as output:
    output.write(json.dumps([tool, *args]) + '\\n')
if os.environ.get('FAIL_ACTION') in args:
    sys.exit(1)
if tool == 'git' and args == ['rev-parse', 'HEAD']:
    print('test-revision')
'''
        for tool in ['docker', 'git']:
            path = self.root / tool
            path.write_text(program)
            path.chmod(0o755)

    def run_make(self, action, *, fail='', success=True):
        result = subprocess.run(['make', action, f'ENV_FILE={self.config}', 'PULL=0'],
                                cwd=ROOT, env={**self.env, 'FAIL_ACTION': fail}, capture_output=True, text=True)
        self.assertEqual(result.returncode == 0, success, result.stderr + result.stdout)
        return [json.loads(line) for line in self.trace.read_text().splitlines()]

    def docker_commands(self, calls):
        return [call[call.index('compose.yaml') + 1:] for call in calls if call[0] == 'docker' and 'compose.yaml' in call]

    def test_update_app_builds_then_checks_before_recreating_only_app(self):
        calls = self.docker_commands(self.run_make('update-app'))
        build = calls.index(['build', 'app'])
        check = next(i for i, call in enumerate(calls) if call[-1] == 'check-app')
        start = next(i for i, call in enumerate(calls) if call[0] == 'up')
        self.assertLess(build, check)
        self.assertLess(check, start)
        self.assertIn('--no-deps', calls[start])
        self.assertIn('--no-build', calls[start])
        self.assertFalse(any('db' in call or call[-1] in ('prepare', 'backup', 'migrate') for call in calls))
        self.assertEqual(calls[-1][-1], 'mark-release')

    def test_invalid_candidate_does_not_stop_or_replace_existing_app(self):
        calls = self.docker_commands(self.run_make('apply', fail='check-app', success=False))
        self.assertFalse(any(call[0] in ('up', 'stop', 'restart', 'build') for call in calls))
        self.assertFalse(Path(str(self.config) + '.deploy-lock').exists())

    def test_config_reload_recreates_app_without_building_or_touching_db(self):
        calls = self.docker_commands(self.run_make('reload-config'))
        start = next(call for call in calls if call[0] == 'up')
        self.assertIn('--force-recreate', start)
        self.assertFalse(any(call[0] == 'build' or 'db' in call for call in calls))

    def test_unhealthy_candidate_is_stopped_and_not_marked_successful(self):
        calls = self.docker_commands(self.run_make('apply', fail='up', success=False))
        self.assertIn(['stop', 'app'], calls)
        self.assertFalse(any(call[-1] == 'mark-release' for call in calls))

    def test_failed_migration_stops_after_backup_without_starting_app(self):
        calls = self.docker_commands(self.run_make('db-migrate', fail='migrate', success=False))
        backup = next(i for i, call in enumerate(calls) if call[-1] == 'backup')
        self.assertLess(calls.index(['stop', 'app']), backup)
        self.assertEqual(calls[-1][-1], 'migrate')
        self.assertFalse(any(call[0] in ('up', 'build') for call in calls))

    def test_restart_keeps_existing_image_and_environment(self):
        calls = self.docker_commands(self.run_make('restart'))
        self.assertIn(['restart', 'app'], calls)
        self.assertFalse(any(call[0] in ('build', 'run') or 'db' in call for call in calls))
        self.assertTrue(all('--no-recreate' in call and '--no-deps' in call for call in calls if call[0] == 'up'))

    def test_pull_only_uses_git(self):
        calls = self.run_make('pull')
        self.assertIn(['git', 'pull', '--ff-only'], calls)
        self.assertFalse(any(call[0] == 'docker' for call in calls))

    def test_existing_host_lock_blocks_quick_update(self):
        Path(str(self.config) + '.deploy-lock').mkdir()
        calls = self.docker_commands(self.run_make('apply', success=False))
        self.assertEqual(calls, [['config', '--quiet']])
