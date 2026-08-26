from rest_framework import viewsets
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated

from .models import Activo, Direccion, Proceso
from .serializers import ActivoSerializer, DireccionSerializer, ProcesoSerializer


class ProcesoViewSet(viewsets.ModelViewSet):
    queryset = Proceso.objects.all()
    serializer_class = ProcesoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    search_fields = ['nombre']


class DireccionViewSet(viewsets.ModelViewSet):
    queryset = Direccion.objects.select_related('proceso').all()
    serializer_class = DireccionSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['proceso']
    search_fields = ['nombre']


class ActivoViewSet(viewsets.ModelViewSet):
    queryset = Activo.objects.select_related('direccion__proceso').all()
    serializer_class = ActivoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = [
        'tipo_activo', 'clase_activo', 'naturaleza', 'etiquetado', 'estado',
        'direccion', 'direccion__proceso', 'contiene_datos_personales',
    ]
    search_fields = ['codigo', 'nombre', 'descripcion', 'propietario', 'custodio']
    ordering_fields = ['codigo', 'nombre', 'creado_en']
