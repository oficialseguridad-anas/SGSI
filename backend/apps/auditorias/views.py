from rest_framework import viewsets
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated

from apps.core.views import DescargaArchivoMixin

from .models import ArchivoAdjuntoSeguimiento, Hallazgo, SeguimientoHallazgo, TipoHallazgo
from .serializers import (
    ArchivoAdjuntoSeguimientoSerializer,
    HallazgoSerializer,
    SeguimientoHallazgoSerializer,
    TipoHallazgoSerializer,
)


class TipoHallazgoViewSet(viewsets.ReadOnlyModelViewSet):
    """Catálogo de tipos de hallazgo: se administra desde /admin/, de solo lectura en la API."""

    queryset = TipoHallazgo.objects.all()
    serializer_class = TipoHallazgoSerializer
    permission_classes = [IsAuthenticated]


class HallazgoViewSet(viewsets.ModelViewSet):
    queryset = Hallazgo.objects.prefetch_related(
        'procesos', 'tipos', 'controles', 'numerales', 'seguimientos', 'seguimientos__archivos_adjuntos',
        'seguimientos__responsables',
    ).all()
    serializer_class = HallazgoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['procesos', 'tipos', 'controles', 'numerales']
    search_fields = ['codigo', 'descripcion']
    ordering_fields = ['fecha_deteccion', 'codigo']


class SeguimientoHallazgoViewSet(viewsets.ModelViewSet):
    queryset = SeguimientoHallazgo.objects.select_related('hallazgo').prefetch_related(
        'archivos_adjuntos', 'responsables'
    ).all()
    serializer_class = SeguimientoHallazgoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['hallazgo', 'verificacion_eficacia', 'responsables']
    ordering_fields = ['fecha_seguimiento']


class ArchivoAdjuntoSeguimientoViewSet(DescargaArchivoMixin, viewsets.ModelViewSet):
    queryset = ArchivoAdjuntoSeguimiento.objects.select_related('seguimiento').all()
    serializer_class = ArchivoAdjuntoSeguimientoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['seguimiento']
