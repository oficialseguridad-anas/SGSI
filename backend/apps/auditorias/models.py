from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel
from apps.core.validators import validar_extension_archivo, validar_tamano_archivo


class TipoHallazgo(models.Model):
    """Catálogo de tipos de hallazgo de auditoría (No conformidad, Acción de mejora, ...)."""

    codigo = models.CharField(max_length=10, unique=True)
    nombre = models.CharField(max_length=100)

    class Meta:
        verbose_name = 'tipo de hallazgo'
        verbose_name_plural = 'tipos de hallazgo'
        ordering = ['nombre']
        db_table = 'tipoHallazgo'

    def __str__(self):
        return self.nombre


class Hallazgo(TimeStampedModel):
    class Estado(models.TextChoices):
        ABIERTA = 'ABIERTA', 'Abierta'
        EN_PROCESO = 'EN_PROCESO', 'En proceso'
        CERRADA = 'CERRADA', 'Cerrada'

    codigo = models.CharField(max_length=20, unique=True, verbose_name='Código')
    fecha_deteccion = models.DateField(verbose_name='Fecha de detección', db_column='fechaDeteccion')
    procesos = models.ManyToManyField(
        'activos.Proceso',
        related_name='hallazgos',
        verbose_name='Proceso',
        db_table='hallazgoProcesos',
    )
    tipos = models.ManyToManyField(
        TipoHallazgo, related_name='hallazgos', verbose_name='Tipo', db_table='hallazgoTipos',
    )
    descripcion = models.TextField(verbose_name='Descripción de la no conformidad / hallazgo')
    evidencia_asociada = models.TextField(
        blank=True, verbose_name='Evidencia asociada', db_column='evidenciaAsociada'
    )
    controles = models.ManyToManyField(
        'controles.Control',
        blank=True,
        related_name='hallazgos',
        verbose_name='Requisito incumplido (Anexo A)',
        db_table='hallazgoControles',
    )
    numerales = models.ManyToManyField(
        'controles.NumeralNorma',
        blank=True,
        related_name='hallazgos',
        verbose_name='Requisito incumplido (numeral de la norma)',
        db_table='hallazgoNumerales',
    )
    analisis_causa = models.TextField(
        blank=True, verbose_name='Análisis de causa (5 Porqués / Ishikawa)', db_column='analisisCausa'
    )

    class Meta:
        verbose_name = 'hallazgo de auditoría'
        verbose_name_plural = 'hallazgos de auditoría'
        ordering = ['id']
        db_table = 'hallazgo'

    def __str__(self):
        return self.codigo

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = self._siguiente_codigo()
        super().save(*args, **kwargs)

    @staticmethod
    def _siguiente_codigo():
        """Siguiente código secuencial (H-001, H-002, ...) según los ya existentes."""
        max_num = 0
        ancho = 3
        for codigo in Hallazgo.objects.values_list('codigo', flat=True):
            numero = codigo.rsplit('-', 1)[-1]
            if numero.isdigit():
                max_num = max(max_num, int(numero))
                ancho = max(ancho, len(numero))
        return f'H-{str(max_num + 1).zfill(ancho)}'

    @property
    def estado(self):
        """Se calcula solo, a partir del seguimiento más reciente: Abierta si todavía no
        tiene ningún seguimiento; En proceso si el último seguimiento sigue en 'No
        Implementado'; Cerrada si el último seguimiento ya tiene otra verificación de
        eficacia (Eficaz / Parcialmente Eficaz / Ineficaz)."""
        ultimo = self.seguimientos.order_by('-id').first()
        if not ultimo:
            return self.Estado.ABIERTA
        if ultimo.verificacion_eficacia == SeguimientoHallazgo.VerificacionEficacia.NO_IMPLEMENTADO:
            return self.Estado.EN_PROCESO
        return self.Estado.CERRADA


class SeguimientoHallazgo(TimeStampedModel):
    """Un seguimiento periódico al plan de acción correctiva de un hallazgo — un hallazgo
    puede tener varios a lo largo del tiempo, igual que TratamientoRiesgo en riesgos."""

    class VerificacionEficacia(models.TextChoices):
        EFICAZ = 'EFICAZ', 'Eficaz'
        PARCIALMENTE_EFICAZ = 'PARCIALMENTE_EFICAZ', 'Parcialmente Eficaz'
        INEFICAZ = 'INEFICAZ', 'Ineficaz (No Cumple)'
        NO_IMPLEMENTADO = 'NO_IMPLEMENTADO', 'No Implementado'

    hallazgo = models.ForeignKey(
        Hallazgo, on_delete=models.CASCADE, related_name='seguimientos', db_column='hallazgoId'
    )
    accion_correctiva = models.TextField(
        blank=True, verbose_name='Acción correctiva', db_column='accionCorrectiva'
    )
    fecha_compromiso = models.DateField(
        null=True, blank=True, verbose_name='Fecha compromiso', db_column='fechaCompromiso'
    )
    responsables = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='seguimientos_hallazgo_asignados',
        verbose_name='Responsables',
        db_table='seguimientoHallazgoResponsables',
    )
    fecha_seguimiento = models.DateField(
        null=True, blank=True, verbose_name='Fecha de seguimiento', db_column='fechaSeguimiento'
    )
    avance_notas = models.TextField(blank=True, verbose_name='Avance / Notas', db_column='avanceNotas')
    verificacion_eficacia = models.CharField(
        max_length=20,
        choices=VerificacionEficacia.choices,
        default=VerificacionEficacia.NO_IMPLEMENTADO,
        verbose_name='Verificación de eficacia',
        db_column='verificacionEficacia',
    )

    class Meta:
        verbose_name = 'seguimiento de hallazgo'
        verbose_name_plural = 'seguimientos de hallazgo'
        ordering = ['id']
        db_table = 'seguimientoHallazgo'

    def __str__(self):
        return f'{self.hallazgo} - {self.fecha_seguimiento or self.creado_en.date()}'


def ruta_evidencia_seguimiento(instance, nombre_archivo):
    """auditorias/seguimientos/<año de subida>/<código del hallazgo>/<archivo> — mismo
    criterio que ruta_soporte_tratamiento en riesgos."""
    anio = timezone.localdate().year
    codigo = instance.seguimiento.hallazgo.codigo
    return f'auditorias/seguimientos/{anio}/{codigo}/{nombre_archivo}'


class ArchivoAdjuntoSeguimiento(models.Model):
    """Una de las posibles varias evidencias de cierre adjuntas a un seguimiento."""

    seguimiento = models.ForeignKey(
        SeguimientoHallazgo, on_delete=models.CASCADE, related_name='archivos_adjuntos', db_column='seguimientoId'
    )
    archivo = models.FileField(
        upload_to=ruta_evidencia_seguimiento, verbose_name='Archivo', max_length=255,
        validators=[validar_extension_archivo, validar_tamano_archivo],
    )
    subido_en = models.DateTimeField(auto_now_add=True, db_column='subidoEn')

    class Meta:
        verbose_name = 'evidencia de cierre'
        verbose_name_plural = 'evidencias de cierre'
        ordering = ['-subido_en']
        db_table = 'archivoAdjuntoSeguimiento'

    def __str__(self):
        return self.archivo.name
