from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel
from apps.core.validators import validar_extension_archivo, validar_tamano_archivo


class Objetivo(TimeStampedModel):
    """Objetivos del SGSI (ISO/IEC 27001:2022, cláusula 6.2), enlazados a procesos e indicadores."""

    objetivo = models.TextField(verbose_name='Objetivo')
    componente_politica = models.TextField(
        blank=True,
        verbose_name='Componente de la política al cual contribuye',
        db_column='componentePolitica',
    )
    procesos_asociados = models.ManyToManyField(
        'activos.Proceso',
        blank=True,
        related_name='objetivos',
        verbose_name='Procesos asociados',
        db_table='objetivoProcesos',
    )
    responsables_seguimiento = models.TextField(
        blank=True, verbose_name='Responsables de seguimiento', db_column='responsablesSeguimiento'
    )
    indicador_desempeno = models.TextField(
        blank=True, verbose_name='Indicador de desempeño', db_column='indicadorDesempeno'
    )
    indicadores = models.ManyToManyField(
        'indicadores.Indicador',
        blank=True,
        related_name='objetivos',
        verbose_name='Indicadores relacionados',
        db_table='objetivoIndicadores',
    )
    meta_indicador = models.TextField(blank=True, verbose_name='Meta del indicador', db_column='metaIndicador')

    class Meta:
        verbose_name = 'objetivo'
        verbose_name_plural = 'objetivos'
        db_table = 'objetivo'
        ordering = ['id']

    def __str__(self):
        return self.objetivo[:80]


class ActividadObjetivo(TimeStampedModel):
    """Seguimiento a las actividades planeadas para el cumplimiento de un objetivo del SGSI."""

    class EstadoEjecucion(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        VENCIDA = 'VENCIDA', 'Vencida'
        COMPLETADA = 'COMPLETADA', 'Completada'

    class Periodo(models.TextChoices):
        MENSUAL = 'MENSUAL', 'Mensual'
        TRIMESTRAL = 'TRIMESTRAL', 'Trimestral'
        SEMESTRAL = 'SEMESTRAL', 'Semestral'
        ANUAL = 'ANUAL', 'Anual'

    objetivo = models.ForeignKey(
        Objetivo, on_delete=models.CASCADE, related_name='actividades', db_column='objetivoId',
        verbose_name='Objetivo',
    )
    actividad = models.TextField(verbose_name='Actividad')
    responsables = models.TextField(blank=True, verbose_name='Responsables')
    recursos = models.TextField(blank=True, verbose_name='Recursos')
    periodo = models.CharField(max_length=15, choices=Periodo.choices, blank=True, verbose_name='Periodo')
    plazo = models.DateField(null=True, blank=True, verbose_name='Plazo')

    class Meta:
        verbose_name = 'actividad de objetivo'
        verbose_name_plural = 'actividades de objetivos'
        db_table = 'actividadObjetivo'
        ordering = ['objetivo', 'plazo']

    def __str__(self):
        return self.actividad[:80]

    @property
    def estado_ejecucion(self):
        """Se calcula solo: Completada si ya tiene algún soporte adjunto; si no, Vencida
        cuando el plazo ya pasó, o Pendiente en cualquier otro caso."""
        if self.archivos_adjuntos.exists():
            return self.EstadoEjecucion.COMPLETADA
        if self.plazo and self.plazo < timezone.localdate():
            return self.EstadoEjecucion.VENCIDA
        return self.EstadoEjecucion.PENDIENTE


def ruta_soporte_actividad(instance, nombre_archivo):
    """objetivos/actividades/<año actual>/objetivo-<id del objetivo>/<archivo> — se usa el
    año de la subida (no el del plazo de la actividad), y el id del objetivo porque no
    existe un código de negocio para objetivos, a diferencia de riesgos/indicadores."""
    anio = timezone.localdate().year
    objetivo_id = instance.actividad.objetivo_id
    return f'objetivos/actividades/{anio}/objetivo-{objetivo_id}/{nombre_archivo}'


class ArchivoAdjuntoActividad(models.Model):
    """Uno de los posibles varios archivos adjuntos como soporte de una actividad."""

    actividad = models.ForeignKey(
        ActividadObjetivo, on_delete=models.CASCADE, related_name='archivos_adjuntos', db_column='actividadId'
    )
    archivo = models.FileField(
        upload_to=ruta_soporte_actividad, verbose_name='Archivo', max_length=255,
        validators=[validar_extension_archivo, validar_tamano_archivo],
    )
    subido_en = models.DateTimeField(auto_now_add=True, db_column='subidoEn')

    class Meta:
        verbose_name = 'archivo adjunto'
        verbose_name_plural = 'archivos adjuntos'
        ordering = ['-subido_en']
        db_table = 'archivoAdjuntoActividad'

    def __str__(self):
        return self.archivo.name
