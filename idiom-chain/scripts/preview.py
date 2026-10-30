"""Translate the managed preview CLI's host/port flags for Django runserver."""
import argparse,os,subprocess,sys
parser=argparse.ArgumentParser()
parser.add_argument('--host',default='127.0.0.1')
parser.add_argument('--port',default='8000')
parser.add_argument('--strictPort',action='store_true')
args=parser.parse_args()
env=dict(os.environ,DJANGO_DEBUG='1',DJANGO_ALLOWED_HOSTS='localhost,127.0.0.1')
raise SystemExit(subprocess.call([sys.executable,'manage.py','runserver',f'{args.host}:{args.port}','--noreload'],env=env))
