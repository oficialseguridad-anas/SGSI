from rest_framework import serializers

from .models import Activo, Direccion, Proceso, RevisionSemestralActivos, SnapshotActivo


class ProcesoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proceso
        fields = ['id', 'nombre', 'descripcion']


class DireccionSerializer(serializers.ModelSerializer):
    proceso_nombre = serializers.CharField(source='proceso.nombre', read_only=True, default=None)

    class Meta:
        model = Direccion
        fields = ['id', 'codigo', 'proceso', 'proceso_nombre', 'nombre', 'descripcion']


class ActivoSerializer(serializers.ModelSerializer):
    direccion_nombre = serializers.CharField(source='direccion.nombre', read_only=True)
    proceso_nombre = serializers.CharField(source='direccion.proceso.nombre', read_only=True, default=None)
    puntaje_valoracion = serializers.IntegerField(read_only=True)
    criticidad = serializers.CharField(read_only=True)
    riesgos_ids = serializers.SerializerMethodField()
    riesgos_codigos = serializers.SerializerMethodField()

    class Meta:
        model = Activo
        fields = [
            'id', 'codigo', 'direccion', 'direccion_nombre', 'proceso_nombre',
            'nombre', 'descripcion', 'tipo_activo', 'clase_activo', 'naturaleza',
            'propietario', 'custodio',
            'etiquetado', 'contiene_datos_personales',
            'valor_confidencialidad', 'valor_integridad', 'valor_disponibilidad',
            'puntaje_valoracion', 'criticidad',
            'estado', 'fecha_baja', 'riesgos_ids', 'riesgos_codigos', 'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'codigo', 'creado_en', 'actualizado_en']

    def _riesgos_ordenados(self, obj):
        return sorted(obj.riesgos.all(), key=lambda r: r.codigo)

    def get_riesgos_ids(self, obj):
        return [r.id for r in self._riesgos_ordenados(obj)]

    def get_riesgos_codigos(self, obj):
        return [r.codigo for r in self._riesgos_ordenados(obj)]


class SnapshotActivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SnapshotActivo
        fields = [
            'id', 'revision', 'activo_original', 'codigo', 'nombre', 'proceso_nombre', 'direccion_nombre',
            'tipo_activo', 'clase_activo', 'naturaleza', 'propietario', 'custodio', 'etiquetado',
            'contiene_datos_personales', 'valor_confidencialidad', 'valor_integridad', 'valor_disponibilidad',
            'puntaje_valoracion', 'criticidad', 'estado',
        ]
        read_only_fields = fields


class RevisionSemestralActivosSerializer(serializers.ModelSerializer):
    realizada_por_nombre = serializers.CharField(
        source='realizada_por.nombre_completo', read_only=True, default=None,
    )
    cantidad_activos = serializers.IntegerField(read_only=True)

    class Meta:
        model = RevisionSemestralActivos
        fields = [
            'id', 'periodo', 'fecha_revision', 'realizada_por', 'realizada_por_nombre',
            'observaciones', 'cantidad_activos', 'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'realizada_por', 'cantidad_activos', 'creado_en', 'actualizado_en']
