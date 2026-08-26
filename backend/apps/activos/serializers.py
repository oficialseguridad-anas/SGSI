from rest_framework import serializers

from .models import Activo, Direccion, Proceso


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

    class Meta:
        model = Activo
        fields = [
            'id', 'codigo', 'direccion', 'direccion_nombre', 'proceso_nombre',
            'nombre', 'descripcion', 'tipo_activo', 'clase_activo', 'naturaleza',
            'propietario', 'custodio',
            'etiquetado', 'contiene_datos_personales',
            'valor_confidencialidad', 'valor_integridad', 'valor_disponibilidad',
            'puntaje_valoracion', 'criticidad',
            'estado', 'fecha_baja', 'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'codigo', 'creado_en', 'actualizado_en']
