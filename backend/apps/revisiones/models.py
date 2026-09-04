from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class RevisionPersonas(TimeStampedModel):
    """Revisión periódica de los controles de seguridad de la información en Recursos
    Humanos (ISO/IEC 27001:2022 Anexo A — controles 6.1 a 6.8, "Personas"). Sirve como
    guía de campo / checklist / registro de evidencia para esa revisión."""

    fecha_revision = models.DateField(verbose_name='Fecha de revisión', db_column='fechaRevision')
    revisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='revisiones_personas_como_revisor',
        verbose_name='Revisor / Oficial de Seguridad',
        db_column='revisorId',
    )
    responsable_talento_humano = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='revisiones_personas_como_talento_humano',
        verbose_name='Responsable de Talento Humano',
        db_column='responsableTalentoHumanoId',
    )
    responsable_tecnologia = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='revisiones_personas_como_tecnologia',
        verbose_name='Responsable de Tecnología',
        db_column='responsableTecnologiaId',
    )
    muestra_seleccionada = models.CharField(
        max_length=300, blank=True, verbose_name='Muestra seleccionada', db_column='muestraSeleccionada'
    )

    class Meta:
        verbose_name = 'revisión de controles de personas'
        verbose_name_plural = 'revisiones de controles de personas'
        ordering = ['-fecha_revision']
        db_table = 'revisionPersonas'

    def __str__(self):
        return f'Revisión Personas {self.fecha_revision}'


class PreguntaChecklistPersonas(models.Model):
    """Catálogo (fijo, no editable en operación) de las preguntas del checklist de
    revisión de controles de Personas, agrupadas por control del Anexo A (A.6.1, A.6.2,
    ...). Mismo criterio que el catálogo Control en la app controles."""

    control_codigo = models.CharField(max_length=10, verbose_name='Control', db_column='controlCodigo')
    control_nombre = models.CharField(max_length=200, verbose_name='Nombre del control', db_column='controlNombre')
    numero = models.PositiveSmallIntegerField(verbose_name='N.')
    texto = models.TextField(verbose_name='Pregunta / criterio')

    class Meta:
        verbose_name = 'pregunta de checklist (Personas)'
        verbose_name_plural = 'preguntas de checklist (Personas)'
        ordering = ['control_codigo', 'numero']
        unique_together = ('control_codigo', 'numero')
        db_table = 'preguntaChecklistPersonas'

    def __str__(self):
        return f'{self.control_codigo} #{self.numero}'


class RespuestaChecklistPersonas(TimeStampedModel):
    """Respuesta a una pregunta del checklist, para una revisión concreta — se crean
    automáticamente (una por cada pregunta del catálogo) al crear la revisión, para que
    el checklist siempre se vea completo y listo para llenar."""

    class Resultado(models.TextChoices):
        CUMPLE = 'C', 'C - Cumple'
        CUMPLE_PARCIAL = 'CP', 'CP - Cumple parcialmente'
        NO_CUMPLE = 'NC', 'NC - No cumple'
        NO_EVIDENCIADO = 'NE', 'NE - No evidenciado'

    revision = models.ForeignKey(
        RevisionPersonas, on_delete=models.CASCADE, related_name='respuestas_checklist', db_column='revisionId'
    )
    pregunta = models.ForeignKey(
        PreguntaChecklistPersonas, on_delete=models.CASCADE, related_name='respuestas', db_column='preguntaId'
    )
    resultado = models.CharField(
        max_length=2, choices=Resultado.choices, blank=True, verbose_name='Resultado (C / CP / NC / NE)'
    )
    evidencia = models.TextField(blank=True, verbose_name='Evidencia / observación')

    class Meta:
        verbose_name = 'respuesta de checklist (Personas)'
        verbose_name_plural = 'respuestas de checklist (Personas)'
        ordering = ['pregunta__control_codigo', 'pregunta__numero']
        unique_together = ('revision', 'pregunta')
        db_table = 'respuestaChecklistPersonas'

    def __str__(self):
        return f'{self.revision} - {self.pregunta}'
