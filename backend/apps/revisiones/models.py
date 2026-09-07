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
    finalizada = models.BooleanField(
        default=False,
        verbose_name='Finalizada',
        db_column='finalizada',
        help_text='Una vez finalizada, el checklist queda de solo lectura salvo para administradores.',
    )

    class Meta:
        verbose_name = 'revisión de controles de personas'
        verbose_name_plural = 'revisiones de controles de personas'
        ordering = ['-fecha_revision']
        db_table = 'revisionPersonas'

    def __str__(self):
        return f'Revisión Personas {self.fecha_revision}'

    @property
    def porcentaje_general(self):
        """Promedio del puntaje de todas las respuestas de la revisión (todas las
        preguntas pesan igual): 100% solo si todas quedaron en 'Cumple'."""
        respuestas = list(self.respuestas_checklist.all())
        if not respuestas:
            return None
        return round(sum(r.puntaje for r in respuestas) / len(respuestas), 1)

    @property
    def porcentajes_por_control(self):
        """Mismo cálculo que porcentaje_general, pero desglosado por cada control
        (A.6.1, A.6.2, ...) en vez de sobre el total de la revisión."""
        grupos = {}
        orden = []
        respuestas = self.respuestas_checklist.select_related('pregunta').order_by(
            'pregunta__control_codigo', 'pregunta__numero'
        )
        for r in respuestas:
            clave = r.pregunta.control_codigo
            if clave not in grupos:
                grupos[clave] = {'control_nombre': r.pregunta.control_nombre, 'puntajes': []}
                orden.append(clave)
            grupos[clave]['puntajes'].append(r.puntaje)
        return [
            {
                'control_codigo': clave,
                'control_nombre': grupos[clave]['control_nombre'],
                'porcentaje': round(sum(grupos[clave]['puntajes']) / len(grupos[clave]['puntajes']), 1),
            }
            for clave in orden
        ]


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

    # Cuánto vale cada resultado hacia el % de cumplimiento de su pregunta — así todas las
    # preguntas en "Cumple" dan 100%. Cumple parcialmente cuenta la mitad; no cumple, no
    # evidenciado y sin responder no suman nada (mismo criterio para las tres).
    PUNTAJE_POR_RESULTADO = {
        Resultado.CUMPLE: 100,
        Resultado.CUMPLE_PARCIAL: 50,
        Resultado.NO_CUMPLE: 0,
        Resultado.NO_EVIDENCIADO: 0,
    }

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

    @property
    def puntaje(self):
        return self.PUNTAJE_POR_RESULTADO.get(self.resultado, 0)
