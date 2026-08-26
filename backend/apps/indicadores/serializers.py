from rest_framework import serializers

from .models import Indicador, SeguimientoIndicador


class IndicadorSerializer(serializers.ModelSerializer):
    seguimientos_count = serializers.IntegerField(source='seguimientos.count', read_only=True)
    seguimiento_al_dia = serializers.BooleanField(read_only=True)
    cumplimiento_actual = serializers.SerializerMethodField()

    class Meta:
        model = Indicador
        fields = [
            'id', 'codigo', 'tipo', 'nombre', 'objetivo', 'unidad_medida', 'descripcion', 'formula',
            'frecuencia', 'responsable_medicion', 'correo_propietario', 'meta', 'fuente_datos',
            'responsable_analisis', 'analisis', 'accion', 'seguimientos_count', 'seguimiento_al_dia',
            'cumplimiento_actual', 'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']

    def get_cumplimiento_actual(self, obj):
        estado = obj.cumplimiento_actual
        return estado.value if estado else None


class SeguimientoIndicadorSerializer(serializers.ModelSerializer):
    indicador_codigo = serializers.CharField(source='indicador.codigo', read_only=True)
    indicador_nombre = serializers.CharField(source='indicador.nombre', read_only=True)
    indicador_meta = serializers.CharField(source='indicador.meta', read_only=True)
    indicador_unidad_medida = serializers.CharField(source='indicador.unidad_medida', read_only=True)
    estado_cumplimiento = serializers.SerializerMethodField()

    class Meta:
        model = SeguimientoIndicador
        fields = [
            'id', 'indicador', 'indicador_codigo', 'indicador_nombre', 'indicador_meta',
            'indicador_unidad_medida', 'periodo', 'fecha_cargue', 'numerador', 'denominador',
            'resultado', 'estado_cumplimiento', 'observaciones', 'archivo_soporte', 'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']

    def get_estado_cumplimiento(self, obj):
        estado = obj.estado_cumplimiento
        return estado.value if estado else None
