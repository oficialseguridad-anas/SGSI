from rest_framework import serializers

from .models import ActividadObjetivo, ArchivoAdjuntoActividad, Objetivo


class ArchivoAdjuntoActividadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArchivoAdjuntoActividad
        fields = ['id', 'actividad', 'archivo', 'subido_en']
        read_only_fields = ['id', 'subido_en']


class ActividadObjetivoSerializer(serializers.ModelSerializer):
    archivos_adjuntos = ArchivoAdjuntoActividadSerializer(many=True, read_only=True)
    estado_ejecucion = serializers.ChoiceField(choices=ActividadObjetivo.EstadoEjecucion.choices, read_only=True)

    class Meta:
        model = ActividadObjetivo
        fields = [
            'id', 'objetivo', 'actividad', 'responsables', 'recursos', 'periodo', 'plazo',
            'estado_ejecucion', 'archivos_adjuntos', 'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']


class ObjetivoSerializer(serializers.ModelSerializer):
    procesos_nombres = serializers.SerializerMethodField()
    indicadores_codigos = serializers.SerializerMethodField()
    indicadores_nombres = serializers.SerializerMethodField()
    actividades = ActividadObjetivoSerializer(many=True, read_only=True)

    class Meta:
        model = Objetivo
        fields = [
            'id', 'objetivo', 'componente_politica', 'procesos_asociados', 'procesos_nombres',
            'responsables_seguimiento', 'indicador_desempeno', 'indicadores', 'indicadores_codigos',
            'indicadores_nombres', 'meta_indicador', 'actividades', 'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']

    def get_procesos_nombres(self, obj):
        return [p.nombre for p in obj.procesos_asociados.all()]

    def get_indicadores_codigos(self, obj):
        return [i.codigo for i in obj.indicadores.all()]

    def get_indicadores_nombres(self, obj):
        return [i.nombre for i in obj.indicadores.all()]
