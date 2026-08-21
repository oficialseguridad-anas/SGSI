from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base con auditoría de creación/actualización para todos los modelos del SGSI."""

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
