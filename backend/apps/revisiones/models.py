from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class RevisionAnexoABase(TimeStampedModel):
    """Base común a las revisiones periódicas de las 4 categorías del Anexo A
    (Organizacionales, Personas, Físicos, Tecnológicos). `Personas` no hereda de esta
    clase porque ya existía con su propia forma (2 responsables); las 3 categorías
    restantes sí comparten esta base al construirse desde cero."""

    fecha_revision = models.DateField(verbose_name='Fecha de revisión', db_column='fechaRevision')
    revisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='%(class)s_como_revisor',
        verbose_name='Revisor / Oficial de Seguridad',
        db_column='revisorId',
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
        abstract = True

    def __str__(self):
        return f'{self._meta.verbose_name} {self.fecha_revision}'

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
        (A.X.1, A.X.2, ...) en vez de sobre el total de la revisión."""
        grupos = {}
        orden = []
        respuestas = self.respuestas_checklist.select_related('pregunta').order_by(
            'pregunta__control_orden', 'pregunta__numero'
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


class PreguntaChecklistAnexoABase(models.Model):
    """Base común al catálogo (fijo, no editable en operación) de preguntas de
    checklist de las 3 categorías nuevas del Anexo A."""

    control_codigo = models.CharField(max_length=10, verbose_name='Control', db_column='controlCodigo')
    control_nombre = models.CharField(max_length=200, verbose_name='Nombre del control', db_column='controlNombre')
    # Número de control como entero (5.1 -> 1, 5.37 -> 37), calculado en save() a partir de
    # control_codigo: ordenar por control_codigo como texto pondría "A.5.10" antes que
    # "A.5.2" (orden alfabético), y estas 3 categorías sí tienen más de 9 controles cada
    # una (a diferencia de Personas, A.6.1-A.6.8, donde ese problema nunca se presentó).
    control_orden = models.PositiveSmallIntegerField(default=0, editable=False, db_column='controlOrden')
    numero = models.PositiveSmallIntegerField(verbose_name='N.')
    texto = models.TextField(verbose_name='Pregunta / criterio')

    class Meta:
        abstract = True

    def __str__(self):
        return f'{self.control_codigo} #{self.numero}'

    def save(self, *args, **kwargs):
        numero_control = self.control_codigo.rsplit('.', 1)[-1]
        if numero_control.isdigit():
            self.control_orden = int(numero_control)
        super().save(*args, **kwargs)


class RespuestaChecklistAnexoABase(TimeStampedModel):
    """Base común a las respuestas de checklist de las 3 categorías nuevas del Anexo A."""

    class Resultado(models.TextChoices):
        CUMPLE = 'C', 'C - Cumple'
        CUMPLE_PARCIAL = 'CP', 'CP - Cumple parcialmente'
        NO_CUMPLE = 'NC', 'NC - No cumple'
        NO_EVIDENCIADO = 'NE', 'NE - No evidenciado'

    PUNTAJE_POR_RESULTADO = {
        Resultado.CUMPLE: 100,
        Resultado.CUMPLE_PARCIAL: 50,
        Resultado.NO_CUMPLE: 0,
        Resultado.NO_EVIDENCIADO: 0,
    }

    resultado = models.CharField(
        max_length=2, choices=Resultado.choices, blank=True, verbose_name='Resultado (C / CP / NC / NE)'
    )
    evidencia = models.TextField(blank=True, verbose_name='Evidencia / observación')

    class Meta:
        abstract = True

    @property
    def puntaje(self):
        return self.PUNTAJE_POR_RESULTADO.get(self.resultado, 0)


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


# --- Organizacionales (A.5.1 a A.5.37) ---------------------------------------------

class RevisionOrganizacionales(RevisionAnexoABase):
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='revisiones_organizacionales_como_responsable',
        verbose_name='Responsable de Gestión de Procesos',
        db_column='responsableId',
    )

    class Meta:
        verbose_name = 'revisión de controles organizacionales'
        verbose_name_plural = 'revisiones de controles organizacionales'
        ordering = ['-fecha_revision']
        db_table = 'revisionOrganizacionales'


class PreguntaChecklistOrganizacionales(PreguntaChecklistAnexoABase):
    class Meta:
        verbose_name = 'pregunta de checklist (Organizacionales)'
        verbose_name_plural = 'preguntas de checklist (Organizacionales)'
        ordering = ['control_orden', 'numero']
        unique_together = ('control_codigo', 'numero')
        db_table = 'preguntaChecklistOrganizacionales'


class RespuestaChecklistOrganizacionales(RespuestaChecklistAnexoABase):
    revision = models.ForeignKey(
        RevisionOrganizacionales, on_delete=models.CASCADE, related_name='respuestas_checklist', db_column='revisionId'
    )
    pregunta = models.ForeignKey(
        PreguntaChecklistOrganizacionales, on_delete=models.CASCADE, related_name='respuestas', db_column='preguntaId'
    )

    class Meta:
        verbose_name = 'respuesta de checklist (Organizacionales)'
        verbose_name_plural = 'respuestas de checklist (Organizacionales)'
        ordering = ['pregunta__control_orden', 'pregunta__numero']
        unique_together = ('revision', 'pregunta')
        db_table = 'respuestaChecklistOrganizacionales'

    def __str__(self):
        return f'{self.revision} - {self.pregunta}'


# --- Físicos (A.7.1 a A.7.14) -------------------------------------------------------

class RevisionFisicos(RevisionAnexoABase):
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='revisiones_fisicos_como_responsable',
        verbose_name='Responsable de Infraestructura y Recursos Físicos',
        db_column='responsableId',
    )

    class Meta:
        verbose_name = 'revisión de controles físicos'
        verbose_name_plural = 'revisiones de controles físicos'
        ordering = ['-fecha_revision']
        db_table = 'revisionFisicos'


class PreguntaChecklistFisicos(PreguntaChecklistAnexoABase):
    class Meta:
        verbose_name = 'pregunta de checklist (Físicos)'
        verbose_name_plural = 'preguntas de checklist (Físicos)'
        ordering = ['control_orden', 'numero']
        unique_together = ('control_codigo', 'numero')
        db_table = 'preguntaChecklistFisicos'


class RespuestaChecklistFisicos(RespuestaChecklistAnexoABase):
    revision = models.ForeignKey(
        RevisionFisicos, on_delete=models.CASCADE, related_name='respuestas_checklist', db_column='revisionId'
    )
    pregunta = models.ForeignKey(
        PreguntaChecklistFisicos, on_delete=models.CASCADE, related_name='respuestas', db_column='preguntaId'
    )

    class Meta:
        verbose_name = 'respuesta de checklist (Físicos)'
        verbose_name_plural = 'respuestas de checklist (Físicos)'
        ordering = ['pregunta__control_orden', 'pregunta__numero']
        unique_together = ('revision', 'pregunta')
        db_table = 'respuestaChecklistFisicos'

    def __str__(self):
        return f'{self.revision} - {self.pregunta}'


# --- Tecnológicos (A.8.1 a A.8.34) --------------------------------------------------

class RevisionTecnologicos(RevisionAnexoABase):
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='revisiones_tecnologicos_como_responsable',
        verbose_name='Responsable de Tecnología',
        db_column='responsableId',
    )

    class Meta:
        verbose_name = 'revisión de controles tecnológicos'
        verbose_name_plural = 'revisiones de controles tecnológicos'
        ordering = ['-fecha_revision']
        db_table = 'revisionTecnologicos'


class PreguntaChecklistTecnologicos(PreguntaChecklistAnexoABase):
    class Meta:
        verbose_name = 'pregunta de checklist (Tecnológicos)'
        verbose_name_plural = 'preguntas de checklist (Tecnológicos)'
        ordering = ['control_orden', 'numero']
        unique_together = ('control_codigo', 'numero')
        db_table = 'preguntaChecklistTecnologicos'


class RespuestaChecklistTecnologicos(RespuestaChecklistAnexoABase):
    revision = models.ForeignKey(
        RevisionTecnologicos, on_delete=models.CASCADE, related_name='respuestas_checklist', db_column='revisionId'
    )
    pregunta = models.ForeignKey(
        PreguntaChecklistTecnologicos, on_delete=models.CASCADE, related_name='respuestas', db_column='preguntaId'
    )

    class Meta:
        verbose_name = 'respuesta de checklist (Tecnológicos)'
        verbose_name_plural = 'respuestas de checklist (Tecnológicos)'
        ordering = ['pregunta__control_orden', 'pregunta__numero']
        unique_together = ('revision', 'pregunta')
        db_table = 'respuestaChecklistTecnologicos'

    def __str__(self):
        return f'{self.revision} - {self.pregunta}'


# --- Revisión por la Dirección (ISO/IEC 27001:2022, cláusula 9.3) --------------------

class RevisionDireccion(TimeStampedModel):
    """Acta de Revisión por la Dirección: entradas (9.3.2 a-g) y salidas (9.3.3) del
    SGSI, en el intervalo planificado que la organización defina (semestral, anual...).
    No hereda de RevisionAnexoABase: no es un checklist de controles, es un acta de
    reunión con secciones de texto y una lista de compromisos/decisiones."""

    periodo = models.CharField(max_length=30, verbose_name='Periodo', help_text='Ej. "2026-S2" o "2026".')
    fecha_revision = models.DateField(verbose_name='Fecha de revisión', db_column='fechaRevision')
    # `preside`/`asistentes` apuntan a Empleado (no a Usuario/AUTH_USER_MODEL): quien
    # preside una revisión por la dirección suele ser alta gerencia que no
    # necesariamente tiene ni necesita una cuenta de acceso al sistema.
    preside = models.ForeignKey(
        'accounts.Empleado',
        on_delete=models.PROTECT,
        related_name='revisiones_direccion_presididas',
        verbose_name='Preside la revisión (Alta Dirección)',
        db_column='presideId',
    )
    asistentes = models.ManyToManyField(
        'accounts.Empleado',
        blank=True,
        related_name='revisiones_direccion_asistidas',
        verbose_name='Asistentes',
        db_table='revisionDireccionAsistentes',
    )
    lugar_modalidad = models.CharField(
        max_length=150, blank=True, verbose_name='Lugar / modalidad', db_column='lugarModalidad'
    )

    # Entradas — cláusula 9.3.2 a) a g). El literal d) trae 4 sub-puntos propios.
    estado_acciones_previas = models.TextField(
        blank=True,
        verbose_name='a) Estado de las acciones de revisiones por la dirección previas',
        db_column='estadoAccionesPrevias',
    )
    cambios_cuestiones_externas_internas = models.TextField(
        blank=True,
        verbose_name='b) Cambios en las cuestiones externas e internas pertinentes al SGSI',
        db_column='cambiosCuestionesExternasInternas',
    )
    cambios_partes_interesadas = models.TextField(
        blank=True,
        verbose_name='c) Cambios en las necesidades y expectativas de las partes interesadas',
        db_column='cambiosPartesInteresadas',
    )
    desempeno_no_conformidades = models.TextField(
        blank=True,
        verbose_name='d.1) No conformidades y acciones correctivas',
        db_column='desempenoNoConformidades',
    )
    desempeno_seguimiento_medicion = models.TextField(
        blank=True,
        verbose_name='d.2) Resultados de seguimiento y medición (indicadores)',
        db_column='desempenoSeguimientoMedicion',
    )
    desempeno_auditorias = models.TextField(
        blank=True,
        verbose_name='d.3) Resultados de auditoría',
        db_column='desempenoAuditorias',
    )
    desempeno_objetivos = models.TextField(
        blank=True,
        verbose_name='d.4) Cumplimiento de los objetivos de seguridad de la información',
        db_column='desempenoObjetivos',
    )
    retroalimentacion_partes_interesadas = models.TextField(
        blank=True,
        verbose_name='e) Retroalimentación de las partes interesadas',
        db_column='retroalimentacionPartesInteresadas',
    )
    resultados_riesgos = models.TextField(
        blank=True,
        verbose_name='f) Resultados de la valoración de riesgos y estado del plan de tratamiento',
        db_column='resultadosRiesgos',
    )
    oportunidades_mejora = models.TextField(
        blank=True,
        verbose_name='g) Oportunidades de mejora continua',
        db_column='oportunidadesMejora',
    )
    conclusiones_generales = models.TextField(
        blank=True, verbose_name='Conclusiones generales', db_column='conclusionesGenerales'
    )

    finalizada = models.BooleanField(
        default=False,
        verbose_name='Finalizada',
        help_text='Una vez finalizada, el acta queda de solo lectura salvo para administradores.',
    )

    class Meta:
        verbose_name = 'revisión por la dirección'
        verbose_name_plural = 'revisiones por la dirección'
        ordering = ['-fecha_revision']
        db_table = 'revisionDireccion'

    def __str__(self):
        return f'Revisión por la Dirección {self.periodo}'

    @property
    def resumen_datos(self):
        """Cifras reales de otros módulos, calculadas al vuelo (no se guardan) para que
        quien diligencia el acta tenga a la mano los insumos de 9.3.2 sin tener que ir
        módulo por módulo a buscarlos."""
        from apps.auditorias.models import Hallazgo
        from apps.incidentes.models import Incidente
        from apps.indicadores.models import Indicador
        from apps.objetivos.models import ActividadObjetivo, Objetivo
        from apps.riesgos.models import Riesgo, TratamientoRiesgo

        riesgos = list(Riesgo.objects.all())
        por_nivel = {'BAJO': 0, 'MEDIO': 0, 'ALTO': 0, 'CRITICO': 0}
        for riesgo in riesgos:
            por_nivel[riesgo.nivel_de_riesgo] += 1

        hallazgos = list(Hallazgo.objects.all())
        hallazgos_por_estado = {'ABIERTA': 0, 'EN_PROCESO': 0, 'CERRADA': 0}
        for hallazgo in hallazgos:
            hallazgos_por_estado[hallazgo.estado] += 1

        actividades = list(ActividadObjetivo.objects.all())
        actividades_por_estado = {'PENDIENTE': 0, 'VENCIDA': 0, 'COMPLETADA': 0}
        for actividad in actividades:
            actividades_por_estado[actividad.estado_ejecucion] += 1

        indicadores = list(Indicador.objects.all())
        indicadores_al_dia = [i for i in indicadores if i.seguimiento_al_dia]
        # Compara contra el string 'CUMPLE' en vez de importar
        # SeguimientoIndicador.EstadoCumplimiento: es justo lo que devuelve la propiedad
        # `cumplimiento_actual`, y evita un segundo import cruzado innecesario.
        indicadores_cumple = [i for i in indicadores_al_dia if i.cumplimiento_actual == 'CUMPLE']

        # TratamientoRiesgo.estado es una @property calculada (evidencia adjunta / fecha
        # límite vencida), no un campo de BD — no se puede filtrar por ella en la BD.
        tratamientos = list(TratamientoRiesgo.objects.all())
        tratamientos_pendientes = sum(1 for t in tratamientos if t.estado == TratamientoRiesgo.Estado.PENDIENTE)
        tratamientos_vencidos = sum(1 for t in tratamientos if t.estado == TratamientoRiesgo.Estado.VENCIDO)

        # Se ordena por `id` (orden real de creación), no por `fecha_revision`: dos actas
        # pueden compartir la misma fecha de revisión (ej. ambas creadas "hoy" mientras se
        # prueba o se pone al día el histórico), y con `fecha_revision__lt` esa igualdad
        # hacía que nunca se encontrara la anterior.
        revision_anterior = (
            RevisionDireccion.objects.filter(finalizada=True, id__lt=self.pk or 0)
            .order_by('-id')
            .first()
        )
        compromisos_revision_anterior = []
        if revision_anterior:
            compromisos_revision_anterior = [
                {
                    'id': c.id,
                    'descripcion': c.descripcion,
                    'responsable_nombre': c.responsable.nombre_completo,
                    'estado': c.estado,
                    'fecha_limite': c.fecha_limite,
                }
                for c in revision_anterior.compromisos.all()
            ]

        return {
            'riesgos': {
                'total': len(riesgos),
                'por_nivel': por_nivel,
                'tratamientos_pendientes': tratamientos_pendientes,
                'tratamientos_vencidos': tratamientos_vencidos,
            },
            'hallazgos': {'total': len(hallazgos), 'por_estado': hallazgos_por_estado},
            'objetivos': {
                'total': Objetivo.objects.count(),
                'actividades_por_estado': actividades_por_estado,
            },
            'indicadores': {
                'total': len(indicadores),
                'al_dia': len(indicadores_al_dia),
                'cumple': len(indicadores_cumple),
            },
            'incidentes': {'total': Incidente.objects.count()},
            'revision_anterior_periodo': revision_anterior.periodo if revision_anterior else None,
            'revision_anterior_fecha': revision_anterior.fecha_revision if revision_anterior else None,
            'revision_anterior_conclusiones': revision_anterior.conclusiones_generales if revision_anterior else '',
            'compromisos_revision_anterior': compromisos_revision_anterior,
        }

    @property
    def compromisos_pendientes_anteriores(self):
        """Compromisos que quedaron sin completar en CUALQUIER revisión anterior (no solo
        la inmediatamente pasada) — para que la sección de Salidas de esta acta permita
        seguir dándoles cierre sin tener que ir a buscar cada acta vieja por separado.
        Su estado se sigue editando desde el mismo endpoint de siempre
        (CompromisoRevisionDireccionViewSet no bloquea por revisión finalizada)."""
        if not self.pk:
            return []
        return list(
            CompromisoRevisionDireccion.objects.exclude(revision_id=self.pk)
            .exclude(estado=CompromisoRevisionDireccion.Estado.COMPLETADO)
            .select_related('revision', 'responsable')
            .order_by('fecha_limite', 'id')
        )


class CompromisoRevisionDireccion(TimeStampedModel):
    """Decisión / compromiso de salida de una Revisión por la Dirección (9.3.3) — a la
    vez que es la fuente de la entrada a) "estado de acciones previas" de la siguiente
    revisión. Su `estado` se puede seguir actualizando después de finalizada el acta:
    representa una acción que avanza en el tiempo hasta la próxima revisión, no una
    valoración puntual como las respuestas de checklist."""

    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        EN_PROCESO = 'EN_PROCESO', 'En proceso'
        COMPLETADO = 'COMPLETADO', 'Completado'

    revision = models.ForeignKey(
        RevisionDireccion, on_delete=models.CASCADE, related_name='compromisos', db_column='revisionId'
    )
    descripcion = models.TextField(verbose_name='Compromiso / decisión')
    responsable = models.ForeignKey(
        'accounts.Empleado',
        on_delete=models.PROTECT,
        related_name='compromisos_revision_direccion',
        verbose_name='Responsable',
        db_column='responsableId',
    )
    fecha_limite = models.DateField(null=True, blank=True, verbose_name='Fecha límite', db_column='fechaLimite')
    estado = models.CharField(max_length=15, choices=Estado.choices, default=Estado.PENDIENTE)
    observaciones_cierre = models.TextField(
        blank=True, verbose_name='Observaciones de cierre', db_column='observacionesCierre'
    )

    class Meta:
        verbose_name = 'compromiso de revisión por la dirección'
        verbose_name_plural = 'compromisos de revisión por la dirección'
        ordering = ['fecha_limite', 'id']
        db_table = 'compromisoRevisionDireccion'

    def __str__(self):
        return f'{self.revision} - {self.descripcion[:50]}'

    @property
    def esta_vencido(self):
        from django.utils import timezone
        return bool(
            self.fecha_limite and self.fecha_limite < timezone.localdate() and self.estado != self.Estado.COMPLETADO
        )
