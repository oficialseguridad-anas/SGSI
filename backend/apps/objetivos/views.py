from rest_framework import viewsets
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated

from .models import ActividadObjetivo, ArchivoAdjuntoActividad, Objetivo
from .serializers import ActividadObjetivoSerializer, ArchivoAdjuntoActividadSerializer, ObjetivoSerializer


class ObjetivoViewSet(viewsets.ModelViewSet):
    queryset = Objetivo.objects.prefetch_related(
        'procesos_asociados', 'indicadores', 'actividades', 'actividades__archivos_adjuntos'
    ).all()
    serializer_class = ObjetivoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    search_fields = ['objetivo', 'componente_politica', 'responsables_seguimiento']


class ActividadObjetivoViewSet(viewsets.ModelViewSet):
    queryset = ActividadObjetivo.objects.select_related('objetivo').prefetch_related('archivos_adjuntos').all()
    serializer_class = ActividadObjetivoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['objetivo']


class ArchivoAdjuntoActividadViewSet(viewsets.ModelViewSet):
    queryset = ArchivoAdjuntoActividad.objects.select_related('actividad').all()
    serializer_class = ArchivoAdjuntoActividadSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['actividad']
