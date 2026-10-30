"""Independent database and cookies; never reads idiom-chain's configuration."""
import os
import secrets
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent
DEBUG = os.environ.get('PRIMARY_DEBUG', '0') == '1'
PRODUCTION = os.environ.get('PRIMARY_PRODUCTION', '0') == '1'
SECRET_KEY = os.environ.get('PRIMARY_SECRET_KEY', '')
if not SECRET_KEY:
    if PRODUCTION:
        raise ImproperlyConfigured('PRIMARY_SECRET_KEY is required in production.')
    secret_file = BASE_DIR / '.local-secret'
    try:
        fd = os.open(secret_file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError:
        pass
    else:
        with os.fdopen(fd, 'w') as output:
            output.write(secrets.token_urlsafe(64))
    SECRET_KEY = secret_file.read_text().strip()

ALLOWED_HOSTS = [s.strip() for s in os.environ.get('PRIMARY_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') if s.strip()]
INSTALLED_APPS = [
    'nova_admin', 'nova_slider_captcha',
    'django.contrib.admin', 'django.contrib.auth', 'django.contrib.contenttypes',
    'django.contrib.sessions', 'django.contrib.messages', 'django.contrib.staticfiles',
    'accounts', 'catalog', 'learning', 'lexicon',
]
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware', 'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware', 'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware', 'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
ROOT_URLCONF = 'config.urls'
TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [BASE_DIR / 'templates'], 'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.request', 'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages', 'nova_admin.context_processors.theme',
    ]},
}]
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'
if os.environ.get('PRIMARY_DB_ENGINE', 'sqlite') == 'postgres':
    DATABASES = {'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('PRIMARY_DB_NAME', 'primary_system'),
        'USER': os.environ.get('PRIMARY_DB_USER', ''),
        'PASSWORD': os.environ.get('PRIMARY_DB_PASSWORD', ''),
        'HOST': os.environ.get('PRIMARY_DB_HOST', '127.0.0.1'),
        'PORT': os.environ.get('PRIMARY_DB_PORT', '5432'),
        'CONN_MAX_AGE': 0,
    }}
elif os.environ.get('PRIMARY_DB_ENGINE', 'sqlite') == 'sqlite':
    DATABASES = {'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.environ.get('PRIMARY_SQLITE_PATH', str(BASE_DIR / 'db.sqlite3')),
        'OPTIONS': {'timeout': 20, 'transaction_mode': 'IMMEDIATE'},
    }}
else:
    raise ImproperlyConfigured('PRIMARY_DB_ENGINE must be sqlite or postgres.')

AUTH_USER_MODEL = 'accounts.User'
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
LOGIN_URL = 'login'
LOGIN_REDIRECT_URL = 'home'
LOGOUT_REDIRECT_URL = 'home'
LANGUAGE_CODE = 'zh-hans'
TIME_ZONE = 'Asia/Shanghai'
USE_I18N = True
USE_TZ = True
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
SESSION_COOKIE_NAME = 'primary_sessionid'
CSRF_COOKIE_NAME = 'primary_csrftoken'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 86400 * 14
CSRF_TRUSTED_ORIGINS = [s for s in os.environ.get('PRIMARY_CSRF_TRUSTED_ORIGINS', '').split(',') if s]
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
DATA_UPLOAD_MAX_MEMORY_SIZE = 256 * 1024
NOVA_ADMIN_ENABLED = True
NOVA_ADMIN_DEFAULT_MODE = 'light'
NOVA_ADMIN_BRANDING = {'name': '乐学堂 · 学习管理'}
NOVA_ADMIN_CAPTCHA_POLICY = 'always'
NOVA_SLIDER_PURPOSES = ['login']
if PRODUCTION:
    if DEBUG or len(SECRET_KEY) < 50 or '*' in ALLOWED_HOSTS:
        raise ImproperlyConfigured('Production requires DEBUG=0, a strong secret and explicit hosts.')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
