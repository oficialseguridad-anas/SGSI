import re

from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel
from apps.core.validators import validar_extension_archivo, validar_tamano_archivo


class Indicador(TimeStampedModel):
    """Catálogo de indicadores de desempeño del SGSI (ISO/IEC 27001:2022, cláusula 9.1)."""

    class Tipo(models.TextChoices):
        EFICACIA = 'EFICACIA', 'Eficacia'
        CULTURA_RESULTADO = 'CULTURA_RESULTADO', 'Cultura / Resultado'
        PREVENTIVO_OPERATIVO = 'PREVENTIVO_OPERATIVO', 'Preventivo / Operativo'
        CONTINUIDAD_OPERATIVO = 'CONTINUIDAD_OPERATIVO', 'Continuidad / Operativo'

    class Frecuencia(models.TextChoices):
        MENSUAL = 'MENSUAL', 'Mensual'
        TRIMESTRAL = 'TRIMESTRAL', 'Trimestral'
        SEMESTRAL = 'SEMESTRAL', 'Semestral'
        ANUAL = 'ANUAL', 'Anual'

    # Duración de un periodo, en meses, según la frecuencia.
    _DURACION_MESES = {
        Frecuencia.MENSUAL: 1,
        Frecuencia.TRIMESTRAL: 3,
        Frecuencia.SEMESTRAL: 6,
        Frecuencia.ANUAL: 12,
    }

    codigo = models.CharField(max_length=10, unique=True, verbose_name='ID Indicador')
    tipo = models.CharField(max_length=25, choices=Tipo.choices, verbose_name='Tipo de indicador')
    nombre = models.CharField(max_length=200)
    objetivo = models.TextField(blank=True)
    unidad_medida = models.CharField(
        max_length=150, blank=True, verbose_name='Unidad de medida del indicador', db_column='unidadMedida'
    )
    descripcion = models.TextField(blank=True, verbose_name='Descripción')
    formula = models.TextField(blank=True, verbose_name='Fórmula')
    frecuencia = models.CharField(max_length=15, choices=Frecuencia.choices)
    responsable_medicion = models.CharField(
        max_length=200, blank=True, verbose_name='Responsable de la medición', db_column='responsableMedicion'
    )
    correo_propietario = models.CharField(
        max_length=300, blank=True, verbose_name='Correo propietario', db_column='correoPropietario'
    )
    meta = models.CharField(max_length=100, blank=True)
    fuente_datos = models.TextField(blank=True, verbose_name='Fuente de datos', db_column='fuenteDatos')
    responsable_analisis = models.CharField(
        max_length=200, blank=True, verbose_name='Responsable del análisis', db_column='responsableAnalisis'
    )
    analisis = models.TextField(blank=True, verbose_name='Análisis')
    accion = models.TextField(blank=True, verbose_name='Acción')

    class Meta:
        verbose_name = 'indicador'
        verbose_name_plural = 'indicadores'
        ordering = ['codigo']
        db_table = 'indicador'

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'

    def _formatear_periodo(self, anio, mes):
        """Da formato de periodo a un (año, mes), según la frecuencia.

        Debe seguir exactamente el mismo formato que `construirPeriodo` en
        frontend/src/features/indicadores/periodos.ts (ej. '2026-04', '2026-T3', '2026-S1', '2026').
        """
        if self.frecuencia == self.Frecuencia.MENSUAL:
            return f'{anio}-{mes:02d}'
        if self.frecuencia == self.Frecuencia.TRIMESTRAL:
            return f'{anio}-T{(mes - 1) // 3 + 1}'
        if self.frecuencia == self.Frecuencia.SEMESTRAL:
            return f'{anio}-S{1 if mes <= 6 else 2}'
        return str(anio)

    @property
    def periodo_actual(self):
        """Periodo cuya carga se exige a día de hoy, dando un mes de gracia tras completarse.

        No es el periodo en curso (que ni siquiera ha terminado), sino el último periodo
        completado cuyo plazo de gracia (1 mes después de terminar) ya venció. Mientras un
        periodo recién completado esté dentro de su mes de gracia, sigue exigiéndose el
        periodo anterior a ese.
        """
        hoy = timezone.localdate()
        duracion_meses = self._DURACION_MESES[self.frecuencia]
        indice_mes_actual = hoy.year * 12 + (hoy.month - 1)
        indice_objetivo = indice_mes_actual - duracion_meses - 1
        anio_objetivo, mes_objetivo = divmod(indice_objetivo, 12)
        return self._formatear_periodo(anio_objetivo, mes_objetivo + 1)

    @property
    def seguimiento_periodo_actual(self):
        """El seguimiento cargado para el periodo actualmente exigido, o None si falta."""
        periodo_actual = self.periodo_actual
        for seguimiento in self.seguimientos.all():
            if seguimiento.periodo == periodo_actual:
                return seguimiento
        return None

    @property
    def seguimiento_al_dia(self):
        """True si ya existe un seguimiento cargado para el periodo actual, según la frecuencia."""
        return self.seguimiento_periodo_actual is not None

    @property
    def cumplimiento_actual(self):
        """Estado de cumplimiento del seguimiento del periodo actual, o None si no está cargado."""
        seguimiento = self.seguimiento_periodo_actual
        return seguimiento.estado_cumplimiento if seguimiento else None

    @property
    def meta_numerica(self):
        """Extrae el valor numérico de la meta (ej. '=90%' -> 90.0, '≥90%' -> 90.0).

        Devuelve None si la meta no tiene un número reconocible (ej. 'Tendencia ?').
        """
        coincidencia = re.search(r'(\d+(?:[.,]\d+)?)', self.meta or '')
        if not coincidencia:
            return None
        return float(coincidencia.group(1).replace(',', '.'))

    # Reconoce fórmulas del tipo "(numerador / denominador)*100" (con "\" o "×" como
    # variantes de escritura vistas en los datos reales), capturando las etiquetas de
    # cada operando. Debe seguir la misma forma que `parsearFormulaRatio` en
    # frontend/src/features/indicadores/formula.ts.
    _REGEX_FORMULA_RATIO = re.compile(r'^\(\s*(.+?)\s*[/\\]\s*(.+?)\s*\)\s*[*×xX]\s*100\s*$')

    @property
    def formula_ratio(self):
        """Si la fórmula es una razón '(A / B)*100', devuelve (etiqueta_A, etiqueta_B); si no, None."""
        coincidencia = self._REGEX_FORMULA_RATIO.match((self.formula or '').strip())
        if not coincidencia:
            return None
        return coincidencia.group(1).strip(), coincidencia.group(2).strip()


class SeguimientoIndicador(TimeStampedModel):
    """Registro de medición/seguimiento de un indicador para un periodo, según su frecuencia."""

    class EstadoCumplimiento(models.TextChoices):
        CUMPLE = 'CUMPLE', 'Cumple'
        POR_ENCIMA = 'POR_ENCIMA', 'Por encima'
        POR_DEBAJO = 'POR_DEBAJO', 'Por debajo'

    indicador = models.ForeignKey(
        Indicador, on_delete=models.CASCADE, related_name='seguimientos', db_column='indicadorId'
    )
    periodo = models.CharField(max_length=50, verbose_name='Periodo')
    fecha_cargue = models.DateField(verbose_name='Fecha de cargue', db_column='fechaCargue')
    numerador = models.FloatField(null=True, blank=True, verbose_name='Numerador')
    denominador = models.FloatField(null=True, blank=True, verbose_name='Denominador')
    resultado = models.FloatField(
        null=True, blank=True, verbose_name='Resultado (según fórmula del indicador)'
    )
    observaciones = models.TextField(blank=True, verbose_name='Observaciones')
    archivo_soporte = models.FileField(
        upload_to='indicadores/seguimientos/%Y/%m/', blank=True, verbose_name='Archivo soporte',
        db_column='archivoSoporte',
        validators=[validar_extension_archivo, validar_tamano_archivo],
    )

    class Meta:
        verbose_name = 'seguimiento de indicador'
        verbose_name_plural = 'seguimientos de indicador'
        ordering = ['-fecha_cargue']
        db_table = 'seguimientoIndicador'

    def __str__(self):
        return f'{self.indicador.codigo} - {self.periodo}'

    @property
    def estado_cumplimiento(self):
        """Compara `resultado` contra la meta numérica del indicador.

        None si falta el resultado o la meta no es numérica (ej. 'Tendencia ?').
        """
        meta = self.indicador.meta_numerica
        if self.resultado is None or meta is None:
            return None
        if self.resultado == meta:
            return self.EstadoCumplimiento.CUMPLE
        if self.resultado > meta:
            return self.EstadoCumplimiento.POR_ENCIMA
        return self.EstadoCumplimiento.POR_DEBAJO
