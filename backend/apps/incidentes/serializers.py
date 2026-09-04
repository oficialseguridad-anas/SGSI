from rest_framework import serializers

from .models import ArchivoAdjuntoIncidente, Incidente


class ArchivoAdjuntoIncidenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArchivoAdjuntoIncidente
        fields = ['id', 'incidente', 'archivo', 'subido_en']
        read_only_fields = ['id', 'subido_en']


class IncidenteSerializer(serializers.ModelSerializer):
    responsable_nombre = serializers.CharField(source='responsable.nombre_completo', read_only=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.nombre_completo', read_only=True)
    archivos_adjuntos = ArchivoAdjuntoIncidenteSerializer(many=True, read_only=True)

    class Meta:
        model = Incidente
        fields = [
            'id', 'codigo', 'fecha', 'hora', 'nombre_evento', 'descripcion', 'tipo', 'fuente',
            'responsable', 'responsable_nombre', 'registrado_por', 'registrado_por_nombre',
            'archivos_adjuntos', 'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'codigo', 'creado_en', 'actualizado_en']
