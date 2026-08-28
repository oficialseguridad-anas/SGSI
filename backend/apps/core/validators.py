"""Validadores de archivos adjuntos, compartidos por todos los módulos del SGSI.

ISO/IEC 27001:2022 Anexo A — A.8.7 (protección contra malware) y A.8.28 (codificación
segura): sin lista blanca de extensiones, cualquier archivo (.exe, .html, .svg con
script embebido, .php) podía subirse como evidencia o soporte documental. Restringir a
tipos de documento/imagen esperados reduce la superficie de ataque de forma directa.
"""

from django.conf import settings
from django.core.exceptions import ValidationError

EXTENSIONES_PERMITIDAS = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods',
    'png', 'jpg', 'jpeg', 'txt', 'csv', 'zip',
]


def validar_extension_archivo(archivo):
    extension = archivo.name.rsplit('.', 1)[-1].lower() if '.' in archivo.name else ''
    if extension not in EXTENSIONES_PERMITIDAS:
        raise ValidationError(
            f'Tipo de archivo no permitido ("{extension}"). Extensiones permitidas: '
            f'{", ".join(EXTENSIONES_PERMITIDAS)}.'
        )


def validar_tamano_archivo(archivo):
    limite_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if archivo.size > limite_bytes:
        raise ValidationError(f'El archivo supera el tamaño máximo permitido ({settings.MAX_UPLOAD_SIZE_MB} MB).')
