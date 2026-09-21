from rest_framework import viewsets
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated

from .models import Activo, Direccion, Proceso, RevisionSemestralActivos, SnapshotActivo
from .serializers import (
    ActivoSerializer,
    DireccionSerializer,
    ProcesoSerializer,
    RevisionSemestralActivosSerializer,
    SnapshotActivoSerializer,
)


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


class RevisionSemestralActivosViewSet(viewsets.ModelViewSet):
    queryset = RevisionSemestralActivos.objects.select_related('realizada_por').all()
    serializer_class = RevisionSemestralActivosSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    search_fields = ['periodo', 'observaciones']
    ordering_fields = ['periodo', 'fecha_revision', 'creado_en']

    def perform_create(self, serializer):
        revision = serializer.save(realizada_por=self.request.user)
        # "Foto" de la matriz completa de activos en este momento — se copian los valores,
        # no se referencian, para que sigan siendo el estado histórico aunque el activo se
        # edite o se elimine después.
        activos = Activo.objects.select_related('direccion__proceso').all()
        SnapshotActivo.objects.bulk_create([
            SnapshotActivo(
                revision=revision,
                activo_original=activo,
                codigo=activo.codigo,
                nombre=activo.nombre,
                proceso_nombre=activo.proceso.nombre if activo.proceso else None,
                direccion_nombre=activo.direccion.nombre,
                tipo_activo=activo.tipo_activo,
                clase_activo=activo.clase_activo,
                naturaleza=activo.naturaleza,
                propietario=activo.propietario,
                custodio=activo.custodio,
                etiquetado=activo.etiquetado,
                contiene_datos_personales=activo.contiene_datos_personales,
                valor_confidencialidad=activo.valor_confidencialidad,
                valor_integridad=activo.valor_integridad,
                valor_disponibilidad=activo.valor_disponibilidad,
                puntaje_valoracion=activo.puntaje_valoracion,
                criticidad=activo.criticidad,
                estado=activo.estado,
            )
            for activo in activos
        ])


class SnapshotActivoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SnapshotActivo.objects.all()
    serializer_class = SnapshotActivoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['revision', 'estado', 'criticidad', 'tipo_activo', 'clase_activo', 'etiquetado']
    search_fields = ['codigo', 'nombre', 'proceso_nombre', 'direccion_nombre', 'propietario']
    ordering_fields = ['codigo', 'criticidad']
