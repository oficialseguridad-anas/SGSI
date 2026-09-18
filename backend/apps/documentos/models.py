from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel
from apps.core.validators import validar_extension_archivo, validar_tamano_archivo


def ruta_archivo_documento(instance, nombre_archivo):
    """documentos/<año de subida>/<código del documento>/<archivo> — mismo criterio de
    organización que riesgos, objetivos, indicadores, auditorías e incidentes."""
    anio = timezone.localdate().year
    return f'documentos/{anio}/{instance.codigo}/{nombre_archivo}'


def ruta_archivo_version_documento(instance, nombre_archivo):
    """documentos/<año de subida>/<código del documento>/versiones/<archivo> — cada
    versión histórica queda dentro de la misma carpeta del documento al que pertenece."""
    anio = timezone.localdate().year
    return f'documentos/{anio}/{instance.documento.codigo}/versiones/{nombre_archivo}'


class Documento(TimeStampedModel):
    class Tipo(models.TextChoices):
        FORMATO = 'FORMATO', 'Formato'
        GUIA = 'GUIA', 'Guía'
        INSTRUCTIVO = 'INSTRUCTIVO', 'Instructivo'
        MANUAL = 'MANUAL', 'Manual'
        MATRIZ = 'MATRIZ', 'Matriz'
        PLAN = 'PLAN', 'Plan'
        POLITICA = 'POLITICA', 'Política'
        PROCEDIMIENTO = 'PROCEDIMIENTO', 'Procedimiento'
        PROGRAMA = 'PROGRAMA', 'Programa'
        PROTOCOLO = 'PROTOCOLO', 'Protocolo'
        REGISTRO = 'REGISTRO', 'Registro'

    class Estado(models.TextChoices):
        BORRADOR = 'BORRADOR', 'Borrador'
        EN_REVISION = 'EN_REVISION', 'En revisión'
        APROBADO = 'APROBADO', 'Aprobado'
        VIGENTE = 'VIGENTE', 'Vigente'
        OBSOLETO = 'OBSOLETO', 'Obsoleto'

    codigo = models.CharField(max_length=20, unique=True)
    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    version_actual = models.CharField(max_length=10, default='1.0', db_column='versionActual')
    estado = models.CharField(max_length=15, choices=Estado.choices, default=Estado.BORRADOR)
    propietario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='documentos_propios',
        db_column='propietarioId',
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documentos_aprobados',
        db_column='aprobadoPorId',
    )
    archivo = models.FileField(
        upload_to=ruta_archivo_documento, blank=True, max_length=255,
        validators=[validar_extension_archivo, validar_tamano_archivo],
    )
    fecha_aprobacion = models.DateField(null=True, blank=True, db_column='fechaAprobacion')
    fecha_proxima_revision = models.DateField(null=True, blank=True, db_column='fechaProximaRevision')

    class Meta:
        verbose_name = 'documento'
        verbose_name_plural = 'documentos'
        ordering = ['codigo']
        db_table = 'documento'

    def __str__(self):
        return f'{self.codigo} - {self.titulo} (v{self.version_actual})'


class VersionDocumento(TimeStampedModel):
    """Un registro del historial de control de versiones de un documento — una fila por
    cada versión publicada, con su fecha, qué cambió, quién la generó y el archivo de
    esa versión específica (criterio de control de cambios de sistemas de calidad:
    versión + fecha + descripción del cambio + responsable + evidencia)."""

    documento = models.ForeignKey(
        Documento, on_delete=models.CASCADE, related_name='versiones', db_column='documentoId'
    )
    version = models.CharField(max_length=10, verbose_name='Versión')
    fecha_version = models.DateField(
        default=timezone.localdate, verbose_name='Fecha de la versión', db_column='fechaVersion'
    )
    cambios = models.TextField(blank=True, verbose_name='Descripción del cambio')
    archivo = models.FileField(
        upload_to=ruta_archivo_version_documento, blank=True, max_length=255,
        validators=[validar_extension_archivo, validar_tamano_archivo],
    )
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='versiones_documento_creadas',
        db_column='creadoPorId',
    )

    class Meta:
        verbose_name = 'versión de documento'
        verbose_name_plural = 'versiones de documento'
        ordering = ['-fecha_version', '-creado_en']
        unique_together = ('documento', 'version')
        db_table = 'versionDocumento'

    def __str__(self):
        return f'{self.documento.codigo} v{self.version}'
