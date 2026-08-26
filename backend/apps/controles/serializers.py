from rest_framework import serializers

from .models import AplicabilidadControl, Control


class ControlSerializer(serializers.ModelSerializer):
    class Meta:
        model = Control
        fields = ['id', 'codigo', 'nombre', 'categoria', 'descripcion']


class AplicabilidadControlSerializer(serializers.ModelSerializer):
    control_codigo = serializers.CharField(source='control.codigo', read_only=True)
    control_nombre = serializers.CharField(source='control.nombre', read_only=True)
    control_descripcion = serializers.CharField(source='control.descripcion', read_only=True)
    control_categoria = serializers.CharField(source='control.categoria', read_only=True)

    class Meta:
        model = AplicabilidadControl
        fields = [
            'id', 'control', 'control_codigo', 'control_nombre', 'control_descripcion', 'control_categoria',
            'aplica', 'justificacion', 'estado_implementacion', 'referencia_documento', 'observaciones',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']
