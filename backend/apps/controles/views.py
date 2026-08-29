from rest_framework import viewsets
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated

from .models import AplicabilidadControl, Control, NumeralNorma
from .serializers import AplicabilidadControlSerializer, ControlSerializer, NumeralNormaSerializer


class ControlViewSet(viewsets.ReadOnlyModelViewSet):
    """El catálogo Anexo A es de solo lectura: se siembra por migración y no se edita en operación."""

    queryset = Control.objects.all()
    serializer_class = ControlSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['categoria']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo']


class NumeralNormaViewSet(viewsets.ReadOnlyModelViewSet):
    """Catálogo de numerales del cuerpo principal de la norma: igual de solo lectura que Control."""

    queryset = NumeralNorma.objects.all()
    serializer_class = NumeralNormaSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo']


class AplicabilidadControlViewSet(viewsets.ModelViewSet):
    queryset = AplicabilidadControl.objects.select_related('control').all()
    serializer_class = AplicabilidadControlSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['aplica', 'estado_implementacion', 'control__categoria']
    search_fields = ['control__codigo', 'control__nombre', 'justificacion']
    ordering_fields = ['control__codigo']
