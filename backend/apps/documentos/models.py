from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel
from apps.core.validators import validar_extension_archivo, validar_tamano_archivo


class Documento(TimeStampedModel):
    class Tipo(models.TextChoices):
        POLITICA = 'POLITICA', 'Política'
        PROCEDIMIENTO = 'PROCEDIMIENTO', 'Procedimiento'
        MANUAL = 'MANUAL', 'Manual'
        FORMATO = 'FORMATO', 'Formato'
        REGISTRO = 'REGISTRO', 'Registro'
        INSTRUCTIVO = 'INSTRUCTIVO', 'Instructivo'
        PLAN = 'PLAN', 'Plan'
        MATRIZ = 'MATRIZ', 'Matriz'
        GUIA = 'GUIA', 'Guía'
        PROGRAMA = 'PROGRAMA', 'Programa'

    class Estado(models.TextChoices):
        BORRADOR = 'BORRADOR', 'Borrador'
        EN_REVISION = 'EN_REVISION', 'En revisión'
        APROBADO = 'APROBADO', 'Aprobado'
        VIGENTE = 'VIGENTE', 'Vigente'
        OBSOLETO = 'OBSOLETO', 'Obsoleto'

    codigo = models.CharField(max_length=20, unique=True)
    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    descripcion = models.TextField(blank=True)
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
        upload_to='documentos/%Y/%m/', blank=True, max_length=255,
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
    documento = models.ForeignKey(
        Documento, on_delete=models.CASCADE, related_name='versiones', db_column='documentoId'
    )
    version = models.CharField(max_length=10)
    cambios = models.TextField(blank=True)
    archivo = models.FileField(
        upload_to='documentos/versiones/%Y/%m/', blank=True, max_length=255,
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
        ordering = ['-creado_en']
        unique_together = ('documento', 'version')
        db_table = 'versionDocumento'

    def __str__(self):
        return f'{self.documento.codigo} v{self.version}'
