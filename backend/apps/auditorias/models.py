from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
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
        blank=True,
    )
    # Igual que SesionAuditoria.tema: una auditoría general del SGSI suele reportar
    # hallazgos por tema/dominio (ej. "Seguridad en el talento humano", "Continuidad
    # de la TI") que no siempre coincide con el catálogo de Procesos organizacionales
    # — visto en el Informe de Auditoría real de diciembre 2025 (FO-860-22), donde
    # 11 de 12 bloques de resultados no tenían un Proceso equivalente exacto.
    tema = models.CharField(max_length=255, blank=True, verbose_name='Tema / dominio del hallazgo')
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
    auditoria = models.ForeignKey(
        'Auditoria',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hallazgos',
        verbose_name='Auditoría de origen',
        db_column='auditoriaId',
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


# =====================================================================================
# Programa de Auditoría Interna (ISO/IEC 27001:2022, cláusula 9.2)
#
# Construido a partir de los documentos institucionales reales que el usuario aportó
# (carpeta Auditoria/9.2 auditoria interna/ del repo, no versionada en git):
#   - PD-860-12 Procedimiento de Auditoría Interna (las 6 fases y roles vienen de ahí)
#   - MT-860-05 Matriz de Priorización de Auditorías (fórmula ponderada de 7 criterios)
#   - FO-860-23 Programa de Auditoría Interna (tabla anual: proceso/mes/auditor líder)
#   - FO-860-24 Plan de Auditoría (objetivo/alcance/criterios/metodología/cronograma/
#     riesgos y oportunidades DEL plan — distintos de los riesgos/oportunidades fijos
#     del programa, que quedan como texto de referencia institucional, no como datos)
#   - FO-860-25 Lista de verificación de auditorías (checklist con 4 tipos de hallazgo:
#     Conformidad, No Conformidad, Oportunidad de Mejora, Fortaleza — el informe FO-860-22
#     solo narra las últimas 3; Conformidad solo deja constancia de que se revisó el punto)
# =====================================================================================


class MatrizPriorizacionAuditoria(TimeStampedModel):
    """Una fila de la Matriz de Priorización (MT-860-05): calificación 1-5 de un proceso
    frente a 7 criterios, con la fórmula ponderada exacta del documento institucional
    para decidir qué procesos auditar primero en el programa anual."""

    PESO_CRITICIDAD = 0.20
    PESO_AUDITORIAS_PREVIAS = 0.15
    PESO_CAMBIOS = 0.15
    PESO_INCIDENTES = 0.20
    PESO_LEGALES = 0.10
    PESO_RELEVANCIA = 0.10
    PESO_RIESGO_RESIDUAL = 0.10

    class Prioridad(models.TextChoices):
        ALTA = 'ALTA', 'Alta'
        MEDIA = 'MEDIA', 'Media'
        BAJA = 'BAJA', 'Baja'

    _VALIDADORES_1_5 = [MinValueValidator(1), MaxValueValidator(5)]

    proceso = models.ForeignKey(
        'activos.Proceso', on_delete=models.PROTECT, related_name='prioridades_auditoria', db_column='procesoId',
    )
    anio = models.PositiveIntegerField(verbose_name='Año', db_column='anio')
    criticidad = models.PositiveSmallIntegerField(
        verbose_name='Criticidad del proceso o activo (1-5)', validators=_VALIDADORES_1_5,
    )
    auditorias_previas = models.PositiveSmallIntegerField(
        verbose_name='Resultados de auditorías previas (1-5)', validators=_VALIDADORES_1_5, db_column='auditoriasPrevias',
    )
    cambios = models.PositiveSmallIntegerField(
        verbose_name='Cambios significativos (1-5)', validators=_VALIDADORES_1_5,
    )
    incidentes = models.PositiveSmallIntegerField(
        verbose_name='Incidentes de seguridad (1-5)', validators=_VALIDADORES_1_5,
    )
    legales = models.PositiveSmallIntegerField(
        verbose_name='Requisitos legales/regulatorios (1-5)', validators=_VALIDADORES_1_5,
    )
    relevancia = models.PositiveSmallIntegerField(
        verbose_name='Relevancia estratégica (1-5)', validators=_VALIDADORES_1_5,
    )
    riesgo_residual = models.PositiveSmallIntegerField(
        verbose_name='Riesgo residual (1-5)', validators=_VALIDADORES_1_5, db_column='riesgoResidual',
    )

    class Meta:
        verbose_name = 'matriz de priorización de auditoría'
        verbose_name_plural = 'matriz de priorización de auditorías'
        ordering = ['-anio', 'proceso__nombre']
        db_table = 'matrizPriorizacionAuditoria'
        constraints = [
            models.UniqueConstraint(fields=['proceso', 'anio'], name='matrizPriorizacionAuditoria_proceso_anio_unico'),
        ]

    def __str__(self):
        return f'{self.proceso} ({self.anio})'

    @property
    def puntaje_final(self):
        return round(
            self.criticidad * self.PESO_CRITICIDAD
            + self.auditorias_previas * self.PESO_AUDITORIAS_PREVIAS
            + self.cambios * self.PESO_CAMBIOS
            + self.incidentes * self.PESO_INCIDENTES
            + self.legales * self.PESO_LEGALES
            + self.relevancia * self.PESO_RELEVANCIA
            + self.riesgo_residual * self.PESO_RIESGO_RESIDUAL,
            2,
        )

    @property
    def prioridad(self):
        puntaje = self.puntaje_final
        if puntaje >= 4.0:
            return self.Prioridad.ALTA
        if puntaje >= 3.0:
            return self.Prioridad.MEDIA
        return self.Prioridad.BAJA


class ProgramaAuditoria(TimeStampedModel):
    """Una fila del Programa Anual de Auditorías (FO-860-23): qué proceso se audita, en
    qué mes y con qué auditor líder. Cada fila puede luego "materializarse" en una
    Auditoria real (Auditoria.programa) cuando llega el momento de ejecutarla."""

    class Tipo(models.TextChoices):
        INTERNA = 'INTERNA', 'Interna'
        EXTERNA = 'EXTERNA', 'Externa'

    MESES = [
        (1, 'Enero'), (2, 'Febrero'), (3, 'Marzo'), (4, 'Abril'), (5, 'Mayo'), (6, 'Junio'),
        (7, 'Julio'), (8, 'Agosto'), (9, 'Septiembre'), (10, 'Octubre'), (11, 'Noviembre'), (12, 'Diciembre'),
    ]

    anio = models.PositiveIntegerField(verbose_name='Año', db_column='anio')
    tipo = models.CharField(max_length=10, choices=Tipo.choices, default=Tipo.INTERNA)
    proceso = models.ForeignKey(
        'activos.Proceso', on_delete=models.PROTECT, null=True, blank=True,
        related_name='programas_auditoria', db_column='procesoId',
        help_text='Para auditorías internas.',
    )
    auditado = models.CharField(
        max_length=200, blank=True, help_text='Para auditorías externas (proveedor, ente certificador, etc.).',
    )
    procedimiento = models.CharField(max_length=200, blank=True)
    servicio_o_proyecto = models.CharField(max_length=200, blank=True, db_column='servicioOProyecto')
    auditor_lider = models.ForeignKey(
        'accounts.Empleado', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='programas_auditoria_liderados', db_column='auditorLiderId',
    )
    mes_planeado = models.PositiveSmallIntegerField(
        choices=MESES, null=True, blank=True, db_column='mesPlaneado',
    )

    class Meta:
        verbose_name = 'programa de auditoría (fila anual)'
        verbose_name_plural = 'programa de auditorías (filas anuales)'
        ordering = ['-anio', 'mes_planeado']
        db_table = 'programaAuditoria'

    def __str__(self):
        objetivo = self.proceso or self.auditado or '(sin definir)'
        return f'{objetivo} - {self.anio}'


class Auditoria(TimeStampedModel):
    """El Plan de Auditoría (FO-860-24) de una ejecución concreta — puede venir de una
    fila del Programa Anual (auditoría ordinaria) o crearse directamente (auditoría
    extraordinaria, ver PD-860-12 sección 7)."""

    class Estado(models.TextChoices):
        PLANIFICADA = 'PLANIFICADA', 'Planificada'
        EN_EJECUCION = 'EN_EJECUCION', 'En ejecución'
        CERRADA = 'CERRADA', 'Cerrada'

    class TipoAuditoria(models.TextChoices):
        ORDINARIA = 'ORDINARIA', 'Ordinaria (del programa anual)'
        EXTRAORDINARIA = 'EXTRAORDINARIA', 'Extraordinaria'

    codigo = models.CharField(max_length=20, unique=True, verbose_name='Código')
    programa = models.ForeignKey(
        ProgramaAuditoria, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='auditorias', db_column='programaId',
    )
    tipo = models.CharField(max_length=20, choices=TipoAuditoria.choices, default=TipoAuditoria.ORDINARIA)
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.PLANIFICADA)
    objetivo = models.TextField(verbose_name='Objetivo de la auditoría', blank=True)
    alcance = models.TextField(verbose_name='Alcance de la auditoría', blank=True)
    criterios = models.TextField(blank=True)
    metodologia = models.TextField(verbose_name='Metodología de la auditoría', blank=True)
    numero_auditados = models.PositiveIntegerField(null=True, blank=True, db_column='numeroAuditados')
    numero_auditores = models.PositiveIntegerField(null=True, blank=True, db_column='numeroAuditores')
    auditor_lider = models.ForeignKey(
        'accounts.Empleado', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='auditorias_lideradas', db_column='auditorLiderId',
    )
    equipo_auditor = models.ManyToManyField(
        'accounts.Empleado', blank=True, related_name='auditorias_equipo', db_table='auditoriaEquipoAuditor',
    )
    ciudad = models.CharField(max_length=100, blank=True)
    fecha_auditoria = models.DateField(null=True, blank=True, verbose_name='Fecha de auditoría', db_column='fechaAuditoria')
    fecha_elaboracion_informe = models.DateField(
        null=True, blank=True, verbose_name='Fecha de elaboración del informe', db_column='fechaElaboracionInforme',
    )
    conclusiones_generales = models.TextField(blank=True, db_column='conclusionesGenerales')
    aprobado_por = models.ForeignKey(
        'accounts.Empleado', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='auditorias_aprobadas', db_column='aprobadoPorId',
    )

    class Meta:
        verbose_name = 'auditoría'
        verbose_name_plural = 'auditorías'
        ordering = ['-fecha_auditoria', '-id']
        db_table = 'auditoria'

    def __str__(self):
        return self.codigo

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = self._siguiente_codigo()
        super().save(*args, **kwargs)

    @staticmethod
    def _siguiente_codigo():
        """AUD-<año>-001, AUD-<año>-002, ... — reinicia la numeración cada año."""
        anio = timezone.localdate().year
        prefijo = f'AUD-{anio}-'
        max_num = 0
        for codigo in Auditoria.objects.filter(codigo__startswith=prefijo).values_list('codigo', flat=True):
            numero = codigo.rsplit('-', 1)[-1]
            if numero.isdigit():
                max_num = max(max_num, int(numero))
        return f'{prefijo}{str(max_num + 1).zfill(3)}'

    @property
    def procesos_auditados(self):
        """Procesos distintos que aparecen en las sesiones del cronograma — es lo que el
        Informe de Auditoría (FO-860-22) usa para armar un bloque de resultados por
        proceso."""
        ids = self.sesiones.exclude(proceso__isnull=True).values_list('proceso_id', flat=True).distinct()
        from apps.activos.models import Proceso
        return Proceso.objects.filter(id__in=ids)


class RiesgoPlanAuditoria(models.Model):
    """Una fila de la sección "Riesgos del plan de auditoría" del FO-860-24 — riesgos
    específicos de ESTA auditoría (no los riesgos genéricos del programa, que son fijos
    y quedan documentados como texto institucional en el procedimiento)."""

    # responsable es texto libre, no FK a Empleado: el FO-860-24 real (ver
    # "Auditoria Interna realizada 2025/20251205 Plan de auditoría V 1.1.xlsx") combina
    # varios roles en una sola celda (ej. "Auditor líder\nLíder del SGSI"), no una
    # persona puntual del sistema — forzar un FK perdería esa fidelidad.
    auditoria = models.ForeignKey(Auditoria, on_delete=models.CASCADE, related_name='riesgos_plan', db_column='auditoriaId')
    nombre_riesgo = models.CharField(max_length=255, db_column='nombreRiesgo')
    accion_control = models.TextField(blank=True, db_column='accionControl')
    responsable = models.CharField(max_length=255, blank=True)
    evidencia = models.TextField(blank=True)

    class Meta:
        verbose_name = 'riesgo del plan de auditoría'
        verbose_name_plural = 'riesgos del plan de auditoría'
        ordering = ['id']
        db_table = 'riesgoPlanAuditoria'

    def __str__(self):
        return self.nombre_riesgo


class OportunidadPlanAuditoria(models.Model):
    """Una fila de la sección "Oportunidades del plan de auditoría" del FO-860-24."""

    auditoria = models.ForeignKey(
        Auditoria, on_delete=models.CASCADE, related_name='oportunidades_plan', db_column='auditoriaId',
    )
    nombre_oportunidad = models.CharField(max_length=255, db_column='nombreOportunidad')
    medida_aprovechar = models.TextField(blank=True, db_column='medidaAprovechar')
    responsable = models.CharField(max_length=255, blank=True)
    evidencia = models.TextField(blank=True)

    class Meta:
        verbose_name = 'oportunidad del plan de auditoría'
        verbose_name_plural = 'oportunidades del plan de auditoría'
        ordering = ['id']
        db_table = 'oportunidadPlanAuditoria'

    def __str__(self):
        return self.nombre_oportunidad


class SesionAuditoria(models.Model):
    """Una fila del cronograma del FO-860-24: una auditoría puede visitar varios
    procesos en distintas fechas/horas — cada visita es una sesión."""

    auditoria = models.ForeignKey(Auditoria, on_delete=models.CASCADE, related_name='sesiones', db_column='auditoriaId')
    ciudad = models.CharField(max_length=100, blank=True)
    fecha = models.DateField(null=True, blank=True)
    hora_inicio = models.TimeField(null=True, blank=True, db_column='horaInicio')
    hora_fin = models.TimeField(null=True, blank=True, db_column='horaFin')
    proceso = models.ForeignKey(
        'activos.Proceso', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='sesiones_auditoria', db_column='procesoId',
        help_text='Solo cuando la sesión corresponde exactamente a un proceso del catálogo.',
    )
    # Muchas auditorías generales del SGSI no se organizan por proceso organizacional
    # sino por tema/dominio (ej. "Gestión de Riesgos de Seguridad de la Información",
    # "Seguridad terceros", "Continuidad de TI") — visto en el Plan de Auditoría real
    # de diciembre 2025, donde varios temas no tienen un Proceso del catálogo
    # equivalente. `tema` cubre ese caso sin forzar un proceso que no aplica.
    tema = models.CharField(max_length=200, blank=True, verbose_name='Tema / dominio auditado')
    procedimiento = models.CharField(max_length=200, blank=True)
    requisitos_a_auditar = models.TextField(blank=True, db_column='requisitosAAuditar')
    auditado = models.TextField(blank=True, help_text='Persona(s) o rol(es) del proceso auditado.')
    auditor = models.ForeignKey(
        'accounts.Empleado', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='sesiones_auditor', db_column='auditorId',
    )

    class Meta:
        verbose_name = 'sesión de auditoría (cronograma)'
        verbose_name_plural = 'sesiones de auditoría (cronograma)'
        ordering = ['fecha', 'hora_inicio', 'id']
        db_table = 'sesionAuditoria'

    def __str__(self):
        return f'{self.auditoria} - {self.proceso or self.procedimiento} ({self.fecha or "sin fecha"})'


class ItemVerificacionAuditoria(models.Model):
    """Una fila de la Lista de Verificación de Auditorías (FO-860-25): un elemento
    revisado durante la ejecución, con su tipo de hallazgo. Cuando el tipo no es
    Conformidad, puede formalizarse como un Hallazgo real del módulo existente
    (hallazgo_generado) para heredar todo el flujo de seguimiento y cierre."""

    class Etapa(models.TextChoices):
        PLANEAR = 'P', 'Planear'
        HACER = 'H', 'Hacer'
        VERIFICAR = 'V', 'Verificar'
        ACTUAR = 'A', 'Actuar'

    class TipoHallazgoChecklist(models.TextChoices):
        CONFORMIDAD = 'CONFORMIDAD', 'Conformidad'
        NO_CONFORMIDAD = 'NO_CONFORMIDAD', 'No Conformidad'
        OPORTUNIDAD_MEJORA = 'OPORTUNIDAD_MEJORA', 'Oportunidad de Mejora'
        FORTALEZA = 'FORTALEZA', 'Fortaleza'

    auditoria = models.ForeignKey(
        Auditoria, on_delete=models.CASCADE, related_name='items_verificacion', db_column='auditoriaId',
    )
    sesion = models.ForeignKey(
        SesionAuditoria, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='items_verificacion', db_column='sesionId',
    )
    etapa = models.CharField(max_length=1, choices=Etapa.choices, blank=True)
    descripcion_elemento = models.TextField(verbose_name='Descripción del elemento a revisar', db_column='descripcionElemento')
    requisito_iso = models.CharField(max_length=255, blank=True, verbose_name='Requisito ISO asociado', db_column='requisitoIso')
    otros_requisitos = models.TextField(
        blank=True, verbose_name='Otros requisitos (norma, ley, resolución, documentos organizacionales)',
        db_column='otrosRequisitos',
    )
    tipo_hallazgo = models.CharField(
        max_length=20, choices=TipoHallazgoChecklist.choices, blank=True, db_column='tipoHallazgo',
    )
    descripcion_hallazgo = models.TextField(blank=True, db_column='descripcionHallazgo')
    hallazgo_generado = models.ForeignKey(
        Hallazgo, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='items_verificacion_origen', db_column='hallazgoGeneradoId',
    )

    class Meta:
        verbose_name = 'item de lista de verificación de auditoría'
        verbose_name_plural = 'items de lista de verificación de auditoría'
        ordering = ['id']
        db_table = 'itemVerificacionAuditoria'

    def __str__(self):
        return self.descripcion_elemento[:80]
