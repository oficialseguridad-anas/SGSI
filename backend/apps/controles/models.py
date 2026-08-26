from django.db import models

from apps.core.models import TimeStampedModel


class Control(models.Model):
    """Catálogo de los 93 controles del Anexo A de ISO/IEC 27001:2022 (referencia, no editable en operación)."""

    class Categoria(models.TextChoices):
        ORGANIZACIONAL = 'ORGANIZACIONAL', 'Organizacional'
        PERSONAS = 'PERSONAS', 'Personas'
        FISICO = 'FISICO', 'Físico'
        TECNOLOGICO = 'TECNOLOGICO', 'Tecnológico'

    codigo = models.CharField(max_length=10, unique=True)
    nombre = models.CharField(max_length=200)
    categoria = models.CharField(max_length=20, choices=Categoria.choices)
    descripcion = models.TextField(blank=True)

    class Meta:
        verbose_name = 'control Anexo A'
        verbose_name_plural = 'controles Anexo A'
        ordering = ['codigo']
        db_table = 'control'

    def __str__(self):
        return f'{self.codigo} {self.nombre}'


class AplicabilidadControl(TimeStampedModel):
    """Declaración de Aplicabilidad (SoA): decisión operativa sobre cada control del catálogo."""

    class EstadoImplementacion(models.TextChoices):
        NO_IMPLEMENTADO = 'NO_IMPLEMENTADO', 'Sin Iniciar'
        PARCIAL = 'PARCIAL', 'En Proceso'
        IMPLEMENTADO = 'IMPLEMENTADO', 'Implementado'

    control = models.OneToOneField(
        Control, on_delete=models.CASCADE, related_name='aplicabilidad', db_column='controlId'
    )
    aplica = models.BooleanField(default=True, verbose_name='Aplica el control (SI/NO)')
    justificacion = models.TextField(
        blank=True,
        verbose_name='Justificación del control',
        help_text='Justificación de inclusión o exclusión del control.',
    )
    estado_implementacion = models.CharField(
        max_length=20,
        choices=EstadoImplementacion.choices,
        default=EstadoImplementacion.NO_IMPLEMENTADO,
        verbose_name='Estado',
        db_column='estadoImplementacion',
    )
    referencia_documento = models.TextField(
        blank=True, verbose_name='Referencia / Nombre Documento', db_column='referenciaDocumento'
    )
    observaciones = models.TextField(blank=True, verbose_name='Observaciones')

    class Meta:
        verbose_name = 'declaración de aplicabilidad'
        verbose_name_plural = 'declaraciones de aplicabilidad (SoA)'
        ordering = ['control__codigo']
        db_table = 'aplicabilidadControl'

    def __str__(self):
        return f'SoA {self.control.codigo}'
