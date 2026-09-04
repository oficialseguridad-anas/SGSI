from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel
from apps.core.validators import validar_extension_archivo, validar_tamano_archivo


class Incidente(TimeStampedModel):
    """Matriz de eventos e incidentes de seguridad de la información (ISO/IEC
    27001:2022 Anexo A — A.5.24 a A.5.28: gestión de incidentes de seguridad)."""

    class Tipo(models.TextChoices):
        EVENTO = 'EVENTO', 'Evento'
        INCIDENTE = 'INCIDENTE', 'Incidente'

    codigo = models.CharField(max_length=20, unique=True, verbose_name='No.')
    fecha = models.DateField(verbose_name='Fecha')
    hora = models.TimeField(verbose_name='Hora')
    nombre_evento = models.CharField(
        max_length=200, verbose_name='Nombre del evento o incidente', db_column='nombreEvento'
    )
    descripcion = models.TextField(verbose_name='Descripción')
    tipo = models.CharField(max_length=15, choices=Tipo.choices, verbose_name='Tipo')
    fuente = models.CharField(max_length=200, blank=True, verbose_name='Fuente')
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='incidentes_responsable',
        verbose_name='Responsable',
        db_column='responsableId',
    )
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='incidentes_registrados',
        verbose_name='Registro por',
        db_column='registradoPorId',
    )

    class Meta:
        verbose_name = 'incidente/evento de seguridad'
        verbose_name_plural = 'matriz de incidentes y eventos de seguridad'
        ordering = ['-fecha', '-hora']
        db_table = 'incidente'

    def __str__(self):
        return f'{self.codigo} - {self.nombre_evento}'

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = self._siguiente_codigo()
        super().save(*args, **kwargs)

    @staticmethod
    def _siguiente_codigo():
        """Siguiente código secuencial (INC-001, INC-002, ...) según los ya existentes."""
        max_num = 0
        ancho = 3
        for codigo in Incidente.objects.values_list('codigo', flat=True):
            numero = codigo.rsplit('-', 1)[-1]
            if numero.isdigit():
                max_num = max(max_num, int(numero))
                ancho = max(ancho, len(numero))
        return f'INC-{str(max_num + 1).zfill(ancho)}'


def ruta_soporte_incidente(instance, nombre_archivo):
    """incidentes/<año de subida>/<código del incidente>/<archivo> — mismo criterio que
    ruta_soporte_tratamiento en riesgos y ruta_evidencia_seguimiento en auditorías."""
    anio = timezone.localdate().year
    codigo = instance.incidente.codigo
    return f'incidentes/{anio}/{codigo}/{nombre_archivo}'


class ArchivoAdjuntoIncidente(models.Model):
    """Uno de los posibles varios soportes adjuntos a un incidente/evento."""

    incidente = models.ForeignKey(
        Incidente, on_delete=models.CASCADE, related_name='archivos_adjuntos', db_column='incidenteId'
    )
    archivo = models.FileField(
        upload_to=ruta_soporte_incidente, verbose_name='Archivo', max_length=255,
        validators=[validar_extension_archivo, validar_tamano_archivo],
    )
    subido_en = models.DateTimeField(auto_now_add=True, db_column='subidoEn')

    class Meta:
        verbose_name = 'soporte de incidente'
        verbose_name_plural = 'soportes de incidente'
        ordering = ['-subido_en']
        db_table = 'archivoAdjuntoIncidente'

    def __str__(self):
        return self.archivo.name
