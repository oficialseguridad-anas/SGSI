"""
Django settings for the SGSI ISO/IEC 27001:2022 project.
"""

from datetime import timedelta
from pathlib import Path

import environ
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
)
environ.Env.read_env(BASE_DIR / '.env')

_SECRET_KEY_INSEGURA = 'django-insecure-change-me-in-.env'
SECRET_KEY = env('DJANGO_SECRET_KEY', default=_SECRET_KEY_INSEGURA)
# DEBUG cierra en falso por defecto (fail-closed): si falta DJANGO_DEBUG en .env, el
# sistema arranca en modo producción en vez de exponer trazas de error y el panel /admin
# sin protección extra (ISO/IEC 27001:2022 A.8.9 — gestión segura de la configuración).
DEBUG = env('DJANGO_DEBUG')
ALLOWED_HOSTS = env.list('DJANGO_ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

if not DEBUG and SECRET_KEY == _SECRET_KEY_INSEGURA:
    raise ImproperlyConfigured(
        'DJANGO_SECRET_KEY no está configurado en .env. No se puede iniciar en modo '
        'producción (DJANGO_DEBUG=False) con la clave insegura por defecto (A.8.24).'
    )

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Terceros
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    # Apps del SGSI
    'apps.core',
    'apps.accounts',
    'apps.activos',
    'apps.controles',
    'apps.riesgos',
    'apps.documentos',
    'apps.indicadores',
    'apps.objetivos',
    'apps.auditorias',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'apps.accounts.middleware.AdminOtpMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Base de datos: motor seleccionable con DB_ENGINE (mysql | mssql) en backend/.env.
# El destino final es SQL Server 2022 en Docker (ver docker-compose.yml); se deja
# el soporte de MySQL activo hasta confirmar la migración completa de datos.
if env('DB_ENGINE', default='mysql') == 'mssql':
    DATABASES = {
        'default': {
            'ENGINE': 'mssql',
            'NAME': env('MSSQL_NAME', default='sgsi_iso27001'),
            'HOST': env('MSSQL_HOST', default='127.0.0.1'),
            'PORT': env('MSSQL_PORT', default='1433'),
            'USER': env('MSSQL_USER', default='sa'),
            'PASSWORD': env('MSSQL_SA_PASSWORD', default=''),
            'OPTIONS': {
                'driver': 'ODBC Driver 18 for SQL Server',
                'extra_params': 'TrustServerCertificate=yes;Encrypt=yes',
            },
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': env('DB_NAME', default='sgsi_iso27001'),
            'HOST': env('DB_HOST', default='127.0.0.1'),
            'PORT': env('DB_PORT', default='3306'),
            'USER': env('DB_USER', default='root'),
            'PASSWORD': env('DB_PASSWORD', default=''),
            'OPTIONS': {
                'charset': 'utf8mb4',
            },
        }
    }

AUTH_USER_MODEL = 'accounts.Usuario'

# El frontend (JWT) no depende de la sesión de Django, pero /admin/ sí — sin este límite,
# la sesión de un administrador queda viva 2 semanas (valor por defecto de Django) aunque
# el resto del sistema cierre sesión por inactividad a los 5 minutos (A.8.5).
SESSION_COOKIE_AGE = 3600
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

# En desarrollo, whitenoise sirve directo desde los directorios static/ de cada app
# (sin depender de collectstatic para ver cambios al instante).
WHITENOISE_USE_FINDERS = DEBUG

# Límite de tamaño de carga (cuerpo de la petición y archivos adjuntos): sin esto,
# Django acepta peticiones de cualquier tamaño, lo que habilita un DoS trivial por
# agotamiento de disco/memoria al subir archivos (ISO/IEC 27001:2022 A.8.6 — gestión
# de capacidad). Los validadores de apps.core.validators aplican el mismo límite por
# archivo individual a nivel de modelo.
MAX_UPLOAD_SIZE_MB = env.int('MAX_UPLOAD_SIZE_MB', default=10)
DATA_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS: origenes del frontend en desarrollo
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['http://localhost:5173', 'http://127.0.0.1:5173'],
)
# El refresh token viaja en una cookie httpOnly (ver más abajo), no en el body JSON:
# el navegador solo la adjunta a peticiones "con credenciales" (A.8.24 — el token de
# sesión de más vida queda fuera del alcance de un XSS, que sí puede leer localStorage).
CORS_ALLOW_CREDENTIALS = True

# Cookie httpOnly que guarda el refresh token (nunca el access token: ese vive solo en
# memoria del lado del frontend). SameSite=None + Secure porque en este proyecto el
# frontend (:5173) y el backend (:8000) son orígenes distintos incluso en desarrollo;
# los navegadores tratan "localhost" y 127.0.0.1 como contexto seguro, así que Secure
# funciona también en desarrollo sin necesidad de HTTPS real.
REFRESH_TOKEN_COOKIE = 'sgsi_refresh_token'
REFRESH_TOKEN_COOKIE_PATH = '/api/v1/auth/'
# Secure=True exige HTTPS o "localhost" — una IP de LAN por http:// plano no califica
# como contexto seguro, así que el navegador descartaría la cookie. Por defecto se
# mantiene segura (Secure + SameSite=None); para pruebas puntuales en la misma red
# (ej. otro equipo entrando por http://192.168.x.x) se puede relajar SOLO en el .env
# local con DJANGO_REFRESH_COOKIE_SECURE=False (que a su vez obliga a SameSite=Lax,
# porque SameSite=None sin Secure ya no es válido para los navegadores). Volver a
# quitar estas dos variables del .env antes de desplegar a producción.
REFRESH_TOKEN_COOKIE_SECURE = env.bool('DJANGO_REFRESH_COOKIE_SECURE', default=True)
REFRESH_TOKEN_COOKIE_SAMESITE = 'None' if REFRESH_TOKEN_COOKIE_SECURE else 'Lax'

# Correo: usado para enviar códigos OTP por email. Sin EMAIL_HOST_USER configurado,
# los correos se imprimen en la consola del servidor (útil en desarrollo).
if env('EMAIL_HOST_USER', default=''):
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
    EMAIL_PORT = env.int('EMAIL_PORT', default=587)
    EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
    EMAIL_HOST_USER = env('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
    DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default=EMAIL_HOST_USER)
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    DEFAULT_FROM_EMAIL = 'sgsi@localhost'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    # 500 cubre con margen los ~200 activos actuales y el crecimiento esperado.
    'PAGE_SIZE': 500,
    # Límite de tasa por IP en toda la API (A.8.5 — autenticación segura / protección
    # contra fuerza bruta y abuso automatizado). El scope 'auth' es más estricto y se
    # aplica explícitamente en las vistas de login/2FA, donde el impacto de un intento
    # de adivinar contraseñas o códigos OTP es mayor. 'token_refresh' es un scope aparte
    # y más permisivo: renovar el access token es una operación normal y frecuente (el
    # frontend lo hace en cada carga de página, no solo cuando expira), nada que ver con
    # "adivinar" nada — compartir el límite de 'auth' con login/OTP llegó a desloguear
    # sesiones legítimas con varias recargas seguidas.
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.ScopedRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.AnonRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/minute',
        'user': '300/minute',
        'auth': '10/minute',
        'token_refresh': '60/minute',
    },
}

SIMPLE_JWT = {
    # Alineado con el cierre de sesión por inactividad del frontend (5 min):
    # un access token robado o abandonado deja de servir a los pocos minutos.
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'SGSI ISO/IEC 27001:2022 API',
    'DESCRIPTION': 'API del Sistema de Gestión de Seguridad de la Información',
    'VERSION': '1.0.0',
}

# --- Endurecimiento para producción (ISO/IEC 27001:2022 Anexo A — A.8.9 configuración
# segura, A.8.24 uso de criptografía / TLS, A.8.26 requisitos de seguridad de
# aplicaciones) --------------------------------------------------------------------
# Todo lo siguiente solo se activa con DEBUG=False: en desarrollo local (HTTP, sin
# certificado) forzar HTTPS/HSTS/cookies "Secure" rompería el flujo de trabajo.
if not DEBUG:
    SECURE_SSL_REDIRECT = env.bool('DJANGO_SECURE_SSL_REDIRECT', default=True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SAMESITE = 'Lax'
    # HSTS: exige HTTPS al navegador durante un año una vez visitado por primera vez.
    SECURE_HSTS_SECONDS = env.int('DJANGO_HSTS_SECONDS', default=31536000)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = 'same-origin'
    X_FRAME_OPTIONS = 'DENY'
