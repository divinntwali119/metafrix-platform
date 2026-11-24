"""Django settings with safe-by-default production configuration."""

from datetime import timedelta
from pathlib import Path
from urllib.parse import quote

import environ
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent
env = environ.Env(DJANGO_DEBUG=(bool, False))
local_env_file = BASE_DIR / ".env"
if local_env_file.exists():
    env.read_env(local_env_file)


def read_secret_file(file_path: str, setting_name: str) -> str:
    try:
        value = Path(file_path).read_text(encoding="utf-8").strip()
    except OSError as error:
        raise ImproperlyConfigured(f"{setting_name} points to an unreadable secret file.") from error
    if not value:
        raise ImproperlyConfigured(f"{setting_name} points to an empty secret file.")
    return value


def read_secret(name: str, default: str = "") -> str:
    file_path = env.str(f"{name}_FILE", default="").strip()
    if file_path:
        return read_secret_file(file_path, f"{name}_FILE")
    return env.str(name, default=default)


DEBUG = env.bool("DJANGO_DEBUG", default=False)
NUM_PROXIES = env.int("DJANGO_NUM_PROXIES", default=0 if DEBUG else None)

if not DEBUG and NUM_PROXIES is None:
    raise ImproperlyConfigured("DJANGO_NUM_PROXIES must match the trusted proxy chain in production.")

APP_BASE_URL = env.str("APP_BASE_URL", default="http://localhost:3000").rstrip("/")
AUTH_EXCHANGE_SECRET = read_secret("AUTH_EXCHANGE_SECRET")
if not DEBUG and not APP_BASE_URL.startswith("https://"):
    raise ImproperlyConfigured("APP_BASE_URL must use HTTPS outside development.")

if not DEBUG and len(AUTH_EXCHANGE_SECRET) < 50:
    raise ImproperlyConfigured("AUTH_EXCHANGE_SECRET must be a long, unique production secret.")

SECRET_KEY = read_secret("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if not DEBUG:
        raise ImproperlyConfigured("DJANGO_SECRET_KEY must be configured outside development.")
    SECRET_KEY = "unsafe-local-development-key-do-not-deploy"
if not DEBUG and (
    len(SECRET_KEY) < 50
    or len(set(SECRET_KEY)) < 5
    or SECRET_KEY.startswith("django-insecure-")
):
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be a long, unique production secret.")

default_hosts = ["localhost", "127.0.0.1"] if DEBUG else []
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=default_hosts)
if not DEBUG and not ALLOWED_HOSTS:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS must list the production hostnames.")
if not DEBUG and any(host == "*" or host.startswith((".", "*.")) for host in ALLOWED_HOSTS):
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS must not contain a wildcard in production.")

database_password = read_secret("DATABASE_PASSWORD")
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env.str("POSTGRES_DB"),
        "USER": env.str("POSTGRES_USER"),
        "PASSWORD": database_password,
        "HOST": env.str("POSTGRES_HOST"),
        "PORT": env.str("POSTGRES_PORT", default="5432"),
        "OPTIONS": {
            "sslmode": "require",
        } if not DEBUG else {},
    }
}

cache_url = env.str("DJANGO_CACHE_URL", default="")
if not DEBUG and not cache_url:
    raise ImproperlyConfigured("DJANGO_CACHE_URL must configure shared Redis in production.")
if cache_url and not cache_url.lower().startswith(("redis://", "rediss://")):
    raise ImproperlyConfigured("DJANGO_CACHE_URL must use redis:// or rediss://.")
if cache_url:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": cache_url,
        }
    }

CELERY_BROKER_URL = env.str(
    "CELERY_BROKER_URL",
    default=cache_url or "redis://127.0.0.1:6379/1",
)
CELERY_TASK_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_IGNORE_RESULT = True

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "apps.collaborations.apps.CollaborationsConfig",
    "apps.messaging.apps.MessagingConfig",
    "apps.notifications.apps.NotificationsConfig",
    "apps.posts.apps.PostsConfig",
    "apps.repositories.apps.RepositoriesConfig",
    "apps.auth.apps.AuthConfig",
    "apps.users.apps.UsersConfig",
    "apps.git_server.apps.GitServerConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
AUTH_USER_MODEL = "users.User"

REST_FRAMEWORK = {
    "NUM_PROXIES": NUM_PROXIES,
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.auth.authentication.VersionedJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "120/hour",
        "user": "1200/hour",
        "login": "10/hour",
        "register": "5/hour",
        "password_change": "5/hour",
        "email_verification": "5/hour",
        "password_reset": "5/hour",
        "oauth_exchange": "30/minute",
    },
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=10),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
PASSWORD_RESET_TIMEOUT = 60 * 60
MEDIA_URL = "/media/"
MEDIA_ROOT = Path(env.str("DJANGO_MEDIA_ROOT", default=str(BASE_DIR / "media")))
GIT_REPOSITORY_ROOT = Path(
    env.str("GIT_REPOSITORY_ROOT", default=str(BASE_DIR / "var" / "git" / "repos"))
)
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024
FILE_UPLOAD_PERMISSIONS = 0o640

CSRF_TRUSTED_ORIGINS = env.list("DJANGO_CSRF_TRUSTED_ORIGINS", default=[])
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=not DEBUG)
SECURE_PROXY_SSL_HEADER = (
    ("HTTP_X_FORWARDED_PROTO", "https")
    if env.bool("DJANGO_TRUST_PROXY_SSL_HEADER", default=False)
    else None
)
USE_X_FORWARDED_HOST = env.bool("DJANGO_USE_X_FORWARDED_HOST", default=False)
SECURE_HSTS_SECONDS = env.int(
    "DJANGO_SECURE_HSTS_SECONDS",
    default=0 if DEBUG else 31_536_000,
)
if not DEBUG and not SECURE_SSL_REDIRECT:
    raise ImproperlyConfigured("DJANGO_SECURE_SSL_REDIRECT must remain enabled in production.")
if not DEBUG and SECURE_HSTS_SECONDS <= 0:
    raise ImproperlyConfigured("DJANGO_SECURE_HSTS_SECONDS must be positive in production.")
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool(
    "DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS",
    default=False,
)
SECURE_HSTS_PRELOAD = env.bool("DJANGO_SECURE_HSTS_PRELOAD", default=False)
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

EMAIL_BACKEND = env.str(
    "DJANGO_EMAIL_BACKEND",
    default=(
        "django.core.mail.backends.console.EmailBackend"
        if DEBUG
        else "django.core.mail.backends.smtp.EmailBackend"
    ),
)
EMAIL_HOST = env.str("DJANGO_EMAIL_HOST", default="")
EMAIL_PORT = env.int("DJANGO_EMAIL_PORT", default=587)
EMAIL_HOST_USER = env.str("DJANGO_EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = read_secret("DJANGO_EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = env.bool("DJANGO_EMAIL_USE_TLS", default=True)
DEFAULT_FROM_EMAIL = env.str("DJANGO_DEFAULT_FROM_EMAIL", default="noreply@localhost")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": env.str("DJANGO_LOG_LEVEL", default="INFO")},
    "loggers": {"django.request": {"handlers": ["console"], "level": "WARNING", "propagate": False}},
}