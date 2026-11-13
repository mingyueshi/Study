"""Real Docker rehearsal in a unique project, loopback port and disposable volumes."""
import json
from http.cookies import SimpleCookie
import os
from pathlib import Path
import socket
import subprocess
import tarfile
import tempfile
import urllib.error
import urllib.request
import urllib.parse
from uuid import uuid4

ROOT = Path(__file__).resolve().parent.parent


def run(*args, **kwargs):
    try:
        return subprocess.run(args, cwd=ROOT, check=True, text=True, **kwargs)
    except subprocess.CalledProcessError as error:
        if kwargs.get('capture_output'):
            print(error.stdout or '', flush=True)
            print(error.stderr or '', flush=True)
        raise


def main():
    project = 'primary-smoke-' + uuid4().hex[:8]
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    with tempfile.TemporaryDirectory(prefix='primary-docker-test-') as scratch:
        envfile = Path(scratch) / '.env.production'

        def make(target, *args, **kwargs):
            return run('make', target, f'ENV_FILE={envfile}', *args, **kwargs)

        make('env', 'DOMAIN=study.test')
        envfile.write_text(envfile.read_text().replace('COMPOSE_PROJECT_NAME=primary-system',
                          f'COMPOSE_PROJECT_NAME={project}').replace('PRIMARY_PORT=8012', f'PRIMARY_PORT={port}'))
        compose_env = {**os.environ, 'PRIMARY_ENV_FILE': str(envfile)}

        def compose(*args, **kwargs):
            return run('docker', 'compose', '--env-file', str(envfile), '-f', 'compose.yaml',
                       *args, env=compose_env, **kwargs)

        def shell(code):
            return compose('exec', '-T', 'app', 'python', 'manage.py', 'shell', '-c', code,
                           capture_output=True).stdout

        def request(path, *, forwarded=True, host='localhost'):
            headers = {'Host': host}
            if forwarded:
                headers['X-Forwarded-Proto'] = 'https'
            req = urllib.request.Request(f'http://127.0.0.1:{port}{path}', headers=headers)
            return urllib.request.urlopen(req, timeout=30)

        try:
            make('deploy')
            # 只在本次临时 PostgreSQL 集群的新测试库运行；不更改应用角色权限。
            compose('run', '--rm', '--no-deps', '-T', 'ops', 'python', '-c', """
import os
import subprocess
env = {**os.environ, 'PRIMARY_DB_USER': 'postgres',
       'PRIMARY_DB_PASSWORD': os.environ['PRIMARY_PG_ADMIN_PASSWORD'], 'PRIMARY_HTTPS': '0'}
subprocess.run(['python', 'manage.py', 'test', 'learning.tests.ConcurrentProgressTests',
                'words.test_targets.TargetConcurrencyTests', 'incentives.tests.ConcurrentRecordEventTests',
                '--noinput'], env=env, check=True)
""")
            container = compose('ps', '-q', 'db', capture_output=True).stdout.strip()
            bindings = json.loads(run('docker', 'inspect', '--format', '{{json .HostConfig.PortBindings}}',
                                      container, capture_output=True).stdout)
            assert not bindings, '数据库不应向宿主机发布端口'
            for path in ['/', '/accounts/login/', '/admin/login/', '/dictionary/?q=山',
                         '/references/', '/poetry/feihualing/', '/mathbook/',
                         '/history/timeline/timeline.html', '/static/platform.css',
                         '/static/icons/book.svg', '/static/admin/css/base.css']:
                # 非 ASCII 查询字符由 urlopen 调用方编码。
                path = path.replace('山', '%E5%B1%B1')
                with request(path) as response:
                    assert response.status == 200, path
                    assert response.read(), path
                print('HTTP 通过：' + path, flush=True)
            with request('/healthz/', forwarded=False) as response:
                assert json.load(response) == {'status': 'ok'}
            try:
                request('/healthz/', host='untrusted.invalid')
                raise AssertionError('非法 Host 未被拒绝')
            except urllib.error.HTTPError as error:
                assert error.code == 400
            no_redirect = urllib.request.build_opener(NoRedirect)
            try:
                no_redirect.open(f'http://127.0.0.1:{port}/')
                raise AssertionError('HTTP 未跳转 HTTPS')
            except urllib.error.HTTPError as error:
                assert error.code == 301
            shell("""
import os
from django.db import connection
from django.contrib.auth import get_user_model
from django.test import Client
from catalog.models import ContentItem
from learning.models import Progress
from catalog.models import Stage
assert connection.vendor == 'postgresql'
assert 'PRIMARY_PG_ADMIN_PASSWORD' not in os.environ
assert 'POSTGRES_PASSWORD' not in os.environ
with connection.cursor() as cursor:
    cursor.execute('SELECT rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname=current_user')
    assert cursor.fetchone() == (False, False, False)
maximum = Stage.objects.order_by('-pk').first().pk
extra = Stage.objects.create(code='deployment-sequence-test', name='序列测试')
assert extra.pk > maximum
extra.delete()
assert not get_user_model().objects.exists(), '不应创建默认用户'
user = get_user_model().objects.create_user('deploy_learner', password='local-smoke-password')
client = Client(enforce_csrf_checks=True, HTTP_HOST='localhost')
page = client.get('/accounts/login/', secure=True)
token = client.cookies['primary_csrftoken'].value
response = client.post('/accounts/login/', {'username': user.username, 'password': 'local-smoke-password', 'csrfmiddlewaretoken': token}, secure=True, HTTP_REFERER='https://localhost/accounts/login/')
assert response.status_code == 302
assert client.cookies['primary_sessionid']['secure']
assert client.get('/me/', secure=True).status_code == 200
Progress.objects.create(user=user, item=ContentItem.objects.first(), status='mastered', note='部署更新保留学习记录', revision=7)
""")
            # 通过真正的 Gunicorn HTTP 入口检查代理协议、CSRF 和登录 Cookie。
            with request('/accounts/login/') as response:
                csrf = SimpleCookie(response.headers['Set-Cookie'])['primary_csrftoken'].value
            login = urllib.request.Request(f'http://127.0.0.1:{port}/accounts/login/',
                data=urllib.parse.urlencode({'username': 'deploy_learner',
                    'password': 'local-smoke-password', 'csrfmiddlewaretoken': csrf}).encode(),
                headers={'Host': 'localhost', 'X-Forwarded-Proto': 'https',
                    'Referer': 'https://localhost/accounts/login/',
                    'Cookie': 'primary_csrftoken=' + csrf})
            try:
                no_redirect.open(login, timeout=30)
                raise AssertionError('登录未跳转')
            except urllib.error.HTTPError as response:
                assert response.code == 302
                cookies = SimpleCookie('\n'.join(response.headers.get_all('Set-Cookie')))
                assert cookies['primary_sessionid']['secure']
                session = cookies['primary_sessionid'].value
            profile = urllib.request.Request(f'http://127.0.0.1:{port}/me/', headers={
                'Host': 'localhost', 'X-Forwarded-Proto': 'https', 'Cookie': 'primary_sessionid=' + session})
            with no_redirect.open(profile, timeout=30) as response:
                assert response.status == 200
            make('backup')
            backup_output = make('backups', capture_output=True).stdout
            backup = [line.split()[0] for line in backup_output.splitlines() if line.startswith('primary-')][-1]
            make('backup-export', f'BACKUP={backup}', f'DEST={Path(scratch) / backup}')
            assert (Path(scratch) / backup).stat().st_size > 0
            with tarfile.open(Path(scratch) / backup, 'r:gz') as archive:
                state = json.load(archive.extractfile('current/deployment.json'))
                assert state['database'] == 'postgresql'
                assert archive.getmember('current/database.dump').size > 0
            imported = Path(scratch) / ('primary-import-' + uuid4().hex[:8] + '.tar.gz')
            (Path(scratch) / backup).rename(imported)
            make('backup-import', f'FILE={imported}')
            backup = imported.name
            imported.unlink()
            make('update', 'PULL=0')
            check = """
from accounts.models import User
from learning.models import Progress
assert User.objects.filter(username='deploy_learner').count() == 1
p = Progress.objects.get(user__username='deploy_learner')
assert (p.status, p.note, p.revision) == ('mastered', '部署更新保留学习记录', 7)
"""
            shell(check)
            shell("from learning.models import Progress; Progress.objects.filter(user__username='deploy_learner').update(note='恢复前的修改')")
            make('restore', f'BACKUP={backup}')
            shell(check)
            make('down')
            make('start')
            shell(check)
            make('stop')
            make('start')
            make('restart')
            make('check-deploy')
            with request('/static/platform.css') as response:
                assert response.status == 200
            print('PostgreSQL Docker 完整演练通过：全量内容导入、普通数据库账号、自增序列、登录、静态资源、更新保留记录、pg_dump 导出、pg_restore 恢复、容器重建。', flush=True)
        finally:
            # 只删除本次随机项目的卷和镜像；日常服务和其他 Docker 资源不受影响。
            compose('down', '--volumes', '--remove-orphans')
            subprocess.run(['docker', 'image', 'rm', f'{project}:local'], cwd=ROOT, check=False)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


if __name__ == '__main__':
    main()
