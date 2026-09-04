from rest_framework import viewsets
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated

from apps.core.views import DescargaArchivoMixin

from .models import ArchivoAdjuntoIncidente, Incidente
from .serializers import ArchivoAdjuntoIncidenteSerializer, IncidenteSerializer


class IncidenteViewSet(viewsets.ModelViewSet):
    queryset = Incidente.objects.select_related('responsable', 'registrado_por').prefetch_related(
        'archivos_adjuntos'
    ).all()
    serializer_class = IncidenteSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['tipo', 'responsable', 'registrado_por']
    search_fields = ['codigo', 'nombre_evento', 'descripcion']
    ordering_fields = ['fecha', 'hora', 'codigo']


class ArchivoAdjuntoIncidenteViewSet(DescargaArchivoMixin, viewsets.ModelViewSet):
    queryset = ArchivoAdjuntoIncidente.objects.select_related('incidente').all()
    serializer_class = ArchivoAdjuntoIncidenteSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['incidente']
