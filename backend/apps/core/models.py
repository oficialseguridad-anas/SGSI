from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base con auditoría de creación/actualización para todos los modelos del SGSI."""

    creado_en = models.DateTimeField(auto_now_add=True, db_column='creadoEn')
    actualizado_en = models.DateTimeField(auto_now=True, db_column='actualizadoEn')

    class Meta:
        abstract = True
