from django.db import models

from apps.core.models import TimeStampedModel


class Proceso(TimeStampedModel):
    nombre = models.CharField(max_length=150, unique=True)
    descripcion = models.TextField(blank=True)

    class Meta:
        verbose_name = 'proceso'
        verbose_name_plural = 'procesos'
        ordering = ['nombre']
        db_table = 'proceso'

    def __str__(self):
        return self.nombre


class Direccion(TimeStampedModel):
    codigo = models.CharField(max_length=10, unique=True, blank=True, default='')
    proceso = models.ForeignKey(
        Proceso,
        on_delete=models.PROTECT,
        related_name='direcciones',
        verbose_name='Proceso',
        null=True,
        blank=True,
        db_column='procesoId',
    )
    nombre = models.CharField(max_length=150, unique=True)
    descripcion = models.TextField(blank=True)

    class Meta:
        verbose_name = 'dirección'
        verbose_name_plural = 'direcciones'
        ordering = ['proceso__nombre', 'nombre']
        db_table = 'direccion'

    def __str__(self):
        return self.nombre


class Activo(TimeStampedModel):
    class TipoActivo(models.TextChoices):
        PRIMARIO = 'PRIMARIO', 'Primario'
        SECUNDARIO = 'SECUNDARIO', 'Secundario'

    class ClaseActivo(models.TextChoices):
        SISTEMAS_INFORMACION = 'SISTEMAS_INFORMACION', 'Sistemas de Información'
        PERSONAL = 'PERSONAL', 'Personal'
        SOFTWARE = 'SOFTWARE', 'Software'
        HARDWARE = 'HARDWARE', 'Hardware'
        INFORMACION = 'INFORMACION', 'Información'
        ESTRUCTURA_ORGANIZACION = 'ESTRUCTURA_ORGANIZACION', 'Estructura de la organización'
        RED = 'RED', 'Red'

    class Naturaleza(models.TextChoices):
        FISICO = 'FISICO', 'Fisico'
        DIGITAL = 'DIGITAL', 'Digital'
        SAAS = 'SAAS', 'SaaS'
        IAAS = 'IAAS', 'IaaS'
        PAAS = 'PAAS', 'PaaS'

    class Etiquetado(models.TextChoices):
        PUBLICO = 'PUBLICO', 'Público'
        PRIVADO = 'PRIVADO', 'Privado'
        CONFIDENCIAL = 'CONFIDENCIAL', 'Confidencial'

    class NivelValoracion(models.TextChoices):
        ALTA = 'ALTA', 'Alta'
        MEDIA = 'MEDIA', 'Media'
        BAJA = 'BAJA', 'Baja'

    class Estado(models.TextChoices):
        ACTIVO = 'ACTIVO', 'Activo'
        EN_MANTENIMIENTO = 'EN_MANTENIMIENTO', 'En mantenimiento'
        RETIRADO = 'RETIRADO', 'Retirado'

    codigo = models.CharField(max_length=20, unique=True, verbose_name='Código')
    direccion = models.ForeignKey(
        Direccion, on_delete=models.PROTECT, related_name='activos', verbose_name='Direccion',
        db_column='direccionId',
    )
    nombre = models.CharField(max_length=200, verbose_name='Nombre del Activo de Información')
    descripcion = models.TextField(blank=True, verbose_name='Descripción del activo de información')
    tipo_activo = models.CharField(
        max_length=15, choices=TipoActivo.choices, verbose_name='Tipo de Activo', db_column='tipoActivo'
    )
    clase_activo = models.CharField(
        max_length=25, choices=ClaseActivo.choices, verbose_name='Clase de Activo', db_column='claseActivo'
    )
    naturaleza = models.CharField(
        max_length=15, choices=Naturaleza.choices, verbose_name='Físico / Digital / Como servicio'
    )
    propietario = models.CharField(max_length=250, verbose_name='Propietario del activo')
    custodio = models.CharField(
        max_length=250, blank=True, verbose_name='Custodio del Activo de Información'
    )
    etiquetado = models.CharField(
        max_length=15,
        choices=Etiquetado.choices,
        default=Etiquetado.PRIVADO,
        verbose_name='Etiquetado de la Información',
    )
    contiene_datos_personales = models.BooleanField(
        default=False,
        verbose_name='¿El activo contiene datos personales (Ley 1581 de 2012)? LEY DATOS PERSONALES',
        db_column='contieneDatosPersonales',
    )
    valor_confidencialidad = models.CharField(
        max_length=5, choices=NivelValoracion.choices, default=NivelValoracion.MEDIA,
        verbose_name='Confidencialidad', db_column='valorConfidencialidad',
    )
    valor_integridad = models.CharField(
        max_length=5, choices=NivelValoracion.choices, default=NivelValoracion.MEDIA,
        verbose_name='Integridad', db_column='valorIntegridad',
    )
    valor_disponibilidad = models.CharField(
        max_length=5, choices=NivelValoracion.choices, default=NivelValoracion.MEDIA,
        verbose_name='Disponibilidad', db_column='valorDisponibilidad',
    )
    estado = models.CharField(
        max_length=20, choices=Estado.choices, default=Estado.ACTIVO, verbose_name='Estado'
    )
    fecha_baja = models.DateField(null=True, blank=True, verbose_name='Fecha de baja', db_column='fechaBaja')

    class Meta:
        verbose_name = 'activo'
        verbose_name_plural = 'activos'
        ordering = ['codigo']
        db_table = 'activo'

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = self._siguiente_codigo()
        super().save(*args, **kwargs)

    @staticmethod
    def _siguiente_codigo():
        """Siguiente código secuencial (0001, 0002, ...) según los ya existentes."""
        max_num = 0
        ancho = 4
        for codigo in Activo.objects.values_list('codigo', flat=True):
            if codigo.isdigit():
                max_num = max(max_num, int(codigo))
                ancho = max(ancho, len(codigo))
        return str(max_num + 1).zfill(ancho)

    @property
    def proceso(self):
        """El proceso se deriva de la dirección: no se elige directamente al crear el activo."""
        return self.direccion.proceso

    _PUNTAJE_NIVEL = {NivelValoracion.BAJA: 1, NivelValoracion.MEDIA: 2, NivelValoracion.ALTA: 3}

    @property
    def puntaje_valoracion(self):
        """Suma de Confidencialidad + Integridad + Disponibilidad (Baja=1, Media=2, Alta=3). Rango: 3-9."""
        return (
            self._PUNTAJE_NIVEL[self.valor_confidencialidad]
            + self._PUNTAJE_NIVEL[self.valor_integridad]
            + self._PUNTAJE_NIVEL[self.valor_disponibilidad]
        )

    @property
    def criticidad(self):
        puntaje = self.puntaje_valoracion
        if puntaje <= 3:
            return self.NivelValoracion.BAJA
        if puntaje <= 7:
            return self.NivelValoracion.MEDIA
        return self.NivelValoracion.ALTA
