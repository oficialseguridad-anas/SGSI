from rest_framework import viewsets
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated

from apps.core.views import DescargaArchivoMixin

from .models import Indicador, SeguimientoIndicador
from .serializers import IndicadorSerializer, SeguimientoIndicadorSerializer


class IndicadorViewSet(viewsets.ModelViewSet):
    queryset = Indicador.objects.prefetch_related('seguimientos').all()
    serializer_class = IndicadorSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['tipo', 'frecuencia']
    search_fields = ['codigo', 'nombre', 'objetivo', 'descripcion']
    ordering_fields = ['codigo']


class SeguimientoIndicadorViewSet(DescargaArchivoMixin, viewsets.ModelViewSet):
    queryset = SeguimientoIndicador.objects.select_related('indicador').all()
    serializer_class = SeguimientoIndicadorSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['indicador']
    ordering_fields = ['fecha_cargue']
    campo_archivo = 'archivo_soporte'
