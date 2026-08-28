from rest_framework import serializers

from .models import ArchivoAdjuntoTratamiento, Amenaza, Riesgo, TratamientoRiesgo


class AmenazaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenaza
        fields = ['id', 'nombre', 'descripcion', 'origen']


class ArchivoAdjuntoTratamientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArchivoAdjuntoTratamiento
        fields = ['id', 'tratamiento', 'archivo', 'subido_en']
        read_only_fields = ['id', 'subido_en']


class TratamientoRiesgoSerializer(serializers.ModelSerializer):
    responsable_nombre = serializers.CharField(source='responsable.nombre_completo', read_only=True)
    archivos_adjuntos = ArchivoAdjuntoTratamientoSerializer(many=True, read_only=True)
    nivel_de_riesgo_residual = serializers.SerializerMethodField()
    estado = serializers.ChoiceField(choices=TratamientoRiesgo.Estado.choices, read_only=True)

    class Meta:
        model = TratamientoRiesgo
        fields = [
            'id', 'riesgo', 'opcion', 'descripcion', 'accion_mitigacion', 'recursos_necesarios',
            'responsable', 'responsable_nombre', 'fecha_limite', 'fecha_cierre', 'fecha_proximo_seguimiento',
            'evidencias_esperadas', 'archivos_adjuntos', 'probabilidad_residual', 'impacto_residual',
            'riesgo_residual', 'nivel_de_riesgo_residual', 'estado', 'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'riesgo_residual', 'creado_en', 'actualizado_en']

    def get_nivel_de_riesgo_residual(self, obj):
        nivel = obj.nivel_de_riesgo_residual
        return nivel.value if nivel else None


class RiesgoSerializer(serializers.ModelSerializer):
    activos_nombres = serializers.SerializerMethodField()
    amenaza_nombre = serializers.CharField(source='amenaza.nombre', read_only=True)
    propietario_nombre = serializers.CharField(
        source='propietario_riesgo.nombre_completo', read_only=True, default=None
    )
    nivel_de_riesgo = serializers.CharField(read_only=True)
    tratamientos = TratamientoRiesgoSerializer(many=True, read_only=True)

    class Meta:
        model = Riesgo
        fields = [
            'id', 'codigo', 'activos', 'activos_nombres', 'amenaza', 'amenaza_nombre',
            'descripcion', 'probabilidad', 'impacto', 'riesgo_inherente', 'nivel_de_riesgo',
            'propietario_riesgo', 'propietario_nombre', 'controles', 'esta_activo',
            'fecha_identificacion', 'tratamientos', 'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'riesgo_inherente', 'fecha_identificacion', 'creado_en', 'actualizado_en']

    def get_activos_nombres(self, obj):
        return [f'{a.codigo} - {a.nombre}' for a in obj.activos.all()]

    def validate_activos(self, value):
        if not value:
            raise serializers.ValidationError('Selecciona al menos un activo.')
        return value
