from django.conf import settings
from django.db import models

from apps.activos.models import Activo
from apps.core.models import TimeStampedModel


class NivelProbabilidad(models.IntegerChoices):
    """Escala cualitativa de probabilidad (frecuencia estimada de ocurrencia)."""

    MUY_RARA = 1, 'Muy Rara'
    IMPROBABLE = 2, 'Improbable'
    POSIBLE = 3, 'Posible'
    PROBABLE = 4, 'Probable'
    CASI_SEGURO = 5, 'Casi Seguro'


class NivelImpacto(models.IntegerChoices):
    """Escala cualitativa de impacto (afectación sobre confidencialidad/integridad/disponibilidad)."""

    INSIGNIFICANTE = 1, 'Insignificante'
    MENOR = 5, 'Menor'
    MODERADO = 10, 'Moderado'
    MAYOR = 15, 'Mayor'
    CATASTROFICO = 20, 'Catastrófico'


class Amenaza(TimeStampedModel):
    class Origen(models.TextChoices):
        HUMANA_INTENCIONAL = 'HUMANA_INTENCIONAL', 'Humana intencional'
        HUMANA_NO_INTENCIONAL = 'HUMANA_NO_INTENCIONAL', 'Humana no intencional'
        TECNICA = 'TECNICA', 'Técnica'
        AMBIENTAL = 'AMBIENTAL', 'Ambiental / natural'

    nombre = models.CharField(max_length=150, unique=True)
    descripcion = models.TextField(blank=True)
    origen = models.CharField(max_length=25, choices=Origen.choices)

    class Meta:
        verbose_name = 'amenaza'
        verbose_name_plural = 'amenazas'
        ordering = ['nombre']
        db_table = 'amenaza'

    def __str__(self):
        return self.nombre


class Riesgo(TimeStampedModel):
    class NivelDeRiesgo(models.TextChoices):
        BAJO = 'BAJO', 'Bajo'
        MEDIO = 'MEDIO', 'Medio'
        ALTO = 'ALTO', 'Alto'
        CRITICO = 'CRITICO', 'Crítico'

    codigo = models.CharField(max_length=20, unique=True)
    activos = models.ManyToManyField(
        Activo, related_name='riesgos', verbose_name='Activos afectados', db_table='riesgoActivos'
    )
    amenaza = models.ForeignKey(Amenaza, on_delete=models.PROTECT, related_name='riesgos', db_column='amenazaId')
    descripcion = models.TextField(blank=True, verbose_name='Justificación')
    probabilidad = models.PositiveSmallIntegerField(choices=NivelProbabilidad.choices, verbose_name='Probabilidad')
    impacto = models.PositiveSmallIntegerField(choices=NivelImpacto.choices, verbose_name='Impacto')
    riesgo_inherente = models.PositiveSmallIntegerField(
        editable=False, default=0, verbose_name='Riesgo inherente', db_column='riesgoInherente'
    )
    propietario_riesgo = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='riesgos_propios',
        null=True,
        blank=True,
        verbose_name='Propietario del riesgo',
        db_column='propietarioRiesgoId',
    )
    controles = models.ManyToManyField(
        'controles.Control', blank=True, related_name='riesgos', db_table='riesgoControles'
    )
    esta_activo = models.BooleanField(default=True, verbose_name='¿Riesgo activo?', db_column='estaActivo')
    fecha_identificacion = models.DateField(auto_now_add=True, db_column='fechaIdentificacion')

    class Meta:
        verbose_name = 'riesgo'
        verbose_name_plural = 'riesgos'
        ordering = ['codigo']
        db_table = 'riesgo'

    def __str__(self):
        return self.codigo

    def save(self, *args, **kwargs):
        self.riesgo_inherente = self.probabilidad * self.impacto
        super().save(*args, **kwargs)

    # Matriz de riesgo (probabilidad, impacto) -> nivel, tal como está definida en la
    # matriz de referencia de la entidad. No es un simple umbral sobre el producto:
    # p.ej. (Casi Seguro, Mayor) = 5x15 = 75 se clasifica igual como Crítico, no Alto,
    # porque así lo define la matriz de referencia (celda marcada en rojo con "76").
    _MATRIZ_NIVEL_DE_RIESGO = {
        (1, 1): 'BAJO', (1, 5): 'BAJO', (1, 10): 'BAJO', (1, 15): 'MEDIO', (1, 20): 'MEDIO',
        (2, 1): 'BAJO', (2, 5): 'BAJO', (2, 10): 'MEDIO', (2, 15): 'MEDIO', (2, 20): 'ALTO',
        (3, 1): 'BAJO', (3, 5): 'BAJO', (3, 10): 'MEDIO', (3, 15): 'ALTO', (3, 20): 'ALTO',
        (4, 1): 'BAJO', (4, 5): 'MEDIO', (4, 10): 'ALTO', (4, 15): 'ALTO', (4, 20): 'CRITICO',
        (5, 1): 'BAJO', (5, 5): 'MEDIO', (5, 10): 'ALTO', (5, 15): 'CRITICO', (5, 20): 'CRITICO',
    }

    @property
    def nivel_de_riesgo(self):
        """Nivel de riesgo según la matriz de referencia (probabilidad x impacto)."""
        return self.NivelDeRiesgo(self._MATRIZ_NIVEL_DE_RIESGO[(self.probabilidad, self.impacto)])


class TratamientoRiesgo(TimeStampedModel):
    class Opcion(models.TextChoices):
        MITIGAR = 'MITIGAR', 'Mitigar'
        TRANSFERIR = 'TRANSFERIR', 'Transferir'
        EVITAR = 'EVITAR', 'Evitar'
        ACEPTAR = 'ACEPTAR', 'Aceptar'

    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        EN_PROGRESO = 'EN_PROGRESO', 'En progreso'
        COMPLETADO = 'COMPLETADO', 'Completado'
        VENCIDO = 'VENCIDO', 'Vencido'

    riesgo = models.ForeignKey(Riesgo, on_delete=models.CASCADE, related_name='tratamientos', db_column='riesgoId')
    opcion = models.CharField(max_length=15, choices=Opcion.choices, verbose_name='Opción de tratamiento')
    descripcion = models.TextField(blank=True)
    accion_mitigacion = models.TextField(
        blank=True, verbose_name='Acción de mitigación', db_column='accionMitigacion'
    )
    recursos_necesarios = models.TextField(
        blank=True, verbose_name='Recursos necesarios', db_column='recursosNecesarios'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='tratamientos_asignados',
        db_column='responsableId',
    )
    fecha_limite = models.DateField(
        null=True, blank=True, verbose_name='Fecha límite (plazo)', db_column='fechaLimite'
    )
    fecha_cierre = models.DateField(
        null=True, blank=True, verbose_name='Fecha de seguimiento', db_column='fechaCierre'
    )
    fecha_proximo_seguimiento = models.DateField(
        null=True, blank=True, verbose_name='Fecha de próximo seguimiento', db_column='fechaProximoSeguimiento'
    )
    evidencias_esperadas = models.TextField(
        blank=True, verbose_name='Evidencias esperadas', db_column='evidenciasEsperadas'
    )
    probabilidad_residual = models.PositiveSmallIntegerField(
        choices=NivelProbabilidad.choices, null=True, blank=True, db_column='probabilidadResidual'
    )
    impacto_residual = models.PositiveSmallIntegerField(
        choices=NivelImpacto.choices, null=True, blank=True, db_column='impactoResidual'
    )
    riesgo_residual = models.PositiveSmallIntegerField(
        editable=False, null=True, blank=True, verbose_name='Riesgo residual', db_column='riesgoResidual'
    )
    estado = models.CharField(max_length=15, choices=Estado.choices, default=Estado.PENDIENTE)

    class Meta:
        verbose_name = 'tratamiento de riesgo'
        verbose_name_plural = 'tratamientos de riesgo'
        ordering = ['fecha_limite']
        db_table = 'tratamientoRiesgo'

    def __str__(self):
        return f'{self.riesgo} - {self.get_opcion_display()}'

    def save(self, *args, **kwargs):
        if self.probabilidad_residual and self.impacto_residual:
            self.riesgo_residual = self.probabilidad_residual * self.impacto_residual
        super().save(*args, **kwargs)

    @property
    def nivel_de_riesgo_residual(self):
        """Nivel de riesgo residual, según la misma matriz de referencia usada en Riesgo."""
        if not self.probabilidad_residual or not self.impacto_residual:
            return None
        return Riesgo.NivelDeRiesgo(
            Riesgo._MATRIZ_NIVEL_DE_RIESGO[(self.probabilidad_residual, self.impacto_residual)]
        )


class ArchivoAdjuntoTratamiento(models.Model):
    """Uno de los posibles varios archivos adjuntos como evidencia de un tratamiento."""

    tratamiento = models.ForeignKey(
        TratamientoRiesgo, on_delete=models.CASCADE, related_name='archivos_adjuntos', db_column='tratamientoId'
    )
    archivo = models.FileField(upload_to='riesgos/tratamientos/%Y/%m/', verbose_name='Archivo')
    subido_en = models.DateTimeField(auto_now_add=True, db_column='subidoEn')

    class Meta:
        verbose_name = 'archivo adjunto'
        verbose_name_plural = 'archivos adjuntos'
        ordering = ['-subido_en']
        db_table = 'archivoAdjuntoTratamiento'

    def __str__(self):
        return self.archivo.name
