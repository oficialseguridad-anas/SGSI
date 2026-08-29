from rest_framework import serializers

from .models import ArchivoAdjuntoSeguimiento, Hallazgo, SeguimientoHallazgo, TipoHallazgo


class TipoHallazgoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoHallazgo
        fields = ['id', 'codigo', 'nombre']


class ArchivoAdjuntoSeguimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArchivoAdjuntoSeguimiento
        fields = ['id', 'seguimiento', 'archivo', 'subido_en']
        read_only_fields = ['id', 'subido_en']


class SeguimientoHallazgoSerializer(serializers.ModelSerializer):
    archivos_adjuntos = ArchivoAdjuntoSeguimientoSerializer(many=True, read_only=True)
    responsables_nombres = serializers.SerializerMethodField()

    class Meta:
        model = SeguimientoHallazgo
        fields = [
            'id', 'hallazgo', 'accion_correctiva', 'fecha_compromiso', 'responsables', 'responsables_nombres',
            'fecha_seguimiento', 'avance_notas', 'verificacion_eficacia', 'archivos_adjuntos', 'creado_en',
            'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']

    def get_responsables_nombres(self, obj):
        return [u.nombre_completo for u in obj.responsables.all()]


class HallazgoSerializer(serializers.ModelSerializer):
    procesos_nombres = serializers.SerializerMethodField()
    tipos_nombres = serializers.SerializerMethodField()
    tipos_codigos = serializers.SerializerMethodField()
    controles_codigos = serializers.SerializerMethodField()
    numerales_codigos = serializers.SerializerMethodField()
    seguimientos = SeguimientoHallazgoSerializer(many=True, read_only=True)
    estado = serializers.ChoiceField(choices=Hallazgo.Estado.choices, read_only=True)

    class Meta:
        model = Hallazgo
        fields = [
            'id', 'codigo', 'fecha_deteccion', 'procesos', 'procesos_nombres', 'tipos', 'tipos_nombres',
            'tipos_codigos', 'descripcion', 'evidencia_asociada', 'controles', 'controles_codigos', 'numerales',
            'numerales_codigos', 'analisis_causa', 'estado', 'seguimientos', 'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'codigo', 'creado_en', 'actualizado_en']

    def get_procesos_nombres(self, obj):
        return [p.nombre for p in obj.procesos.all()]

    def get_tipos_nombres(self, obj):
        return [t.nombre for t in obj.tipos.all()]

    def get_tipos_codigos(self, obj):
        return [t.codigo for t in obj.tipos.all()]

    def get_controles_codigos(self, obj):
        return [c.codigo for c in obj.controles.all()]

    def get_numerales_codigos(self, obj):
        return [n.codigo for n in obj.numerales.all()]

    def validate_procesos(self, value):
        if not value:
            raise serializers.ValidationError('Selecciona al menos un proceso.')
        return value

    def validate_tipos(self, value):
        if not value:
            raise serializers.ValidationError('Selecciona al menos un tipo de hallazgo.')
        return value
