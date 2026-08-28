from rest_framework import viewsets
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated

from apps.core.views import DescargaArchivoMixin

from .models import ArchivoAdjuntoTratamiento, Amenaza, Riesgo, TratamientoRiesgo
from .serializers import (
    AmenazaSerializer,
    ArchivoAdjuntoTratamientoSerializer,
    RiesgoSerializer,
    TratamientoRiesgoSerializer,
)


class AmenazaViewSet(viewsets.ModelViewSet):
    queryset = Amenaza.objects.all()
    serializer_class = AmenazaSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['origen']
    search_fields = ['nombre', 'descripcion']


class RiesgoViewSet(viewsets.ModelViewSet):
    queryset = Riesgo.objects.select_related('amenaza').prefetch_related(
        'activos', 'tratamientos', 'controles', 'propietarios_riesgo'
    ).all()
    serializer_class = RiesgoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['esta_activo', 'activos', 'amenaza', 'propietarios_riesgo']
    search_fields = ['codigo', 'descripcion', 'activos__nombre']
    ordering_fields = ['riesgo_inherente', 'fecha_identificacion', 'codigo']


class TratamientoRiesgoViewSet(viewsets.ModelViewSet):
    queryset = TratamientoRiesgo.objects.select_related('riesgo').prefetch_related(
        'archivos_adjuntos', 'responsables'
    ).all()
    serializer_class = TratamientoRiesgoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['riesgo', 'opcion', 'responsables']
    ordering_fields = ['fecha_limite']


class ArchivoAdjuntoTratamientoViewSet(DescargaArchivoMixin, viewsets.ModelViewSet):
    queryset = ArchivoAdjuntoTratamiento.objects.select_related('tratamiento').all()
    serializer_class = ArchivoAdjuntoTratamientoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['tratamiento']
