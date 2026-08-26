import hashlib
import hmac
import secrets

import pyotp
from django.conf import settings
from django.core import signing
from django.core.mail import send_mail
from django.utils import timezone

from .models import CodigoOtpCorreo, CodigoRecuperacionOtp, Usuario

OTP_ISSUER = 'SGSI ISO 27001'
PENDING_TOKEN_SALT = 'apps.accounts.otp.pending-2fa'
PENDING_TOKEN_MAX_AGE = 300  # 5 minutos para completar el segundo factor

RECOVERY_CODE_COUNT = 8
RECOVERY_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
RECOVERY_CODE_LENGTH = 10

EMAIL_CODE_LENGTH = 6
EMAIL_CODE_TTL_MINUTES = 10
EMAIL_CODE_RESEND_COOLDOWN_SECONDS = 30


def generar_secreto():
    return pyotp.random_base32()


def uri_aprovisionamiento(usuario, secreto):
    return pyotp.totp.TOTP(secreto).provisioning_uri(name=usuario.email, issuer_name=OTP_ISSUER)


TOTP_VALID_WINDOW = 4  # tolera hasta ~2 minutos de desfase del reloj del dispositivo


def verificar_codigo_totp(secreto, codigo):
    if not secreto or not codigo:
        return False
    return pyotp.totp.TOTP(secreto).verify(codigo.strip(), valid_window=TOTP_VALID_WINDOW)


def firmar_token_pendiente(usuario):
    return signing.dumps({'user_id': usuario.pk}, salt=PENDING_TOKEN_SALT)


def resolver_token_pendiente(token):
    """Devuelve el user_id codificado en el token, o None si es inválido/expiró."""
    try:
        data = signing.loads(token, salt=PENDING_TOKEN_SALT, max_age=PENDING_TOKEN_MAX_AGE)
    except signing.BadSignature:
        return None
    return data.get('user_id')


def _hash_codigo(codigo):
    """Hash rápido (HMAC-SHA256) para códigos aleatorios de alta entropía.

    No se usa el hasher de contraseñas de Django (PBKDF2/Argon2): esos están
    pensados para claves elegidas por humanos y son deliberadamente lentos
    (~1-2s por verificación), lo que aquí solo suma latencia sin aportar
    seguridad real dado que estos códigos ya son aleatorios y de un solo uso.
    """
    return hmac.new(settings.SECRET_KEY.encode(), codigo.encode(), hashlib.sha256).hexdigest()


def _codigo_coincide(codigo, hash_guardado):
    return hmac.compare_digest(_hash_codigo(codigo), hash_guardado)


def _generar_codigo_legible():
    crudo = ''.join(secrets.choice(RECOVERY_CODE_ALPHABET) for _ in range(RECOVERY_CODE_LENGTH))
    return f'{crudo[:5]}-{crudo[5:]}'


def generar_codigos_recuperacion(usuario):
    usuario.codigos_recuperacion_otp.all().delete()
    codigos = [_generar_codigo_legible() for _ in range(RECOVERY_CODE_COUNT)]
    CodigoRecuperacionOtp.objects.bulk_create(
        CodigoRecuperacionOtp(usuario=usuario, codigo_hash=_hash_codigo(codigo)) for codigo in codigos
    )
    return codigos


def verificar_codigo_recuperacion(usuario, codigo):
    if not codigo:
        return False
    codigo = codigo.strip().upper()
    for entrada in usuario.codigos_recuperacion_otp.filter(usado=False):
        if _codigo_coincide(codigo, entrada.codigo_hash):
            entrada.usado = True
            entrada.usado_en = timezone.now()
            entrada.save(update_fields=['usado', 'usado_en'])
            return True
    return False


def _generar_codigo_numerico():
    return ''.join(secrets.choice('0123456789') for _ in range(EMAIL_CODE_LENGTH))


def puede_reenviar_codigo_email(usuario):
    ultimo = usuario.codigos_otp_correo.order_by('-creado_en').first()
    if ultimo is None:
        return True
    segundos_transcurridos = (timezone.now() - ultimo.creado_en).total_seconds()
    return segundos_transcurridos >= EMAIL_CODE_RESEND_COOLDOWN_SECONDS


def enviar_codigo_email(usuario, asunto='Tu código de verificación'):
    codigo = _generar_codigo_numerico()
    CodigoOtpCorreo.objects.create(
        usuario=usuario,
        codigo_hash=_hash_codigo(codigo),
        expira_en=timezone.now() + timezone.timedelta(minutes=EMAIL_CODE_TTL_MINUTES),
    )
    send_mail(
        subject=f'{asunto} - {OTP_ISSUER}',
        message=(
            f'Tu código de verificación es: {codigo}\n\n'
            f'Vence en {EMAIL_CODE_TTL_MINUTES} minutos. Si no lo solicitaste, ignora este mensaje.'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[usuario.email],
    )


def verificar_codigo_email(usuario, codigo):
    if not codigo:
        return False
    codigo = codigo.strip()
    ahora = timezone.now()
    for entrada in usuario.codigos_otp_correo.filter(usado=False, expira_en__gte=ahora):
        if _codigo_coincide(codigo, entrada.codigo_hash):
            entrada.usado = True
            entrada.save(update_fields=['usado'])
            return True
    return False


def verificar_segundo_factor(usuario, codigo):
    if usuario.otp_metodo == Usuario.MetodoOtp.EMAIL:
        return verificar_codigo_email(usuario, codigo) or verificar_codigo_recuperacion(usuario, codigo)
    return verificar_codigo_totp(usuario.otp_secreto, codigo) or verificar_codigo_recuperacion(usuario, codigo)
