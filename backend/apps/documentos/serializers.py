from rest_framework import serializers

from .models import Documento, VersionDocumento


class VersionDocumentoSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.CharField(source='creado_por.nombre_completo', read_only=True, default=None)

    class Meta:
        model = VersionDocumento
        fields = [
            'id', 'documento', 'version', 'cambios', 'archivo', 'creado_por',
            'creado_por_nombre', 'creado_en',
        ]
        read_only_fields = ['id', 'creado_en']


class DocumentoSerializer(serializers.ModelSerializer):
    propietario_nombre = serializers.CharField(source='propietario.nombre_completo', read_only=True)
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.nombre_completo', read_only=True, default=None
    )
    versiones = VersionDocumentoSerializer(many=True, read_only=True)

    class Meta:
        model = Documento
        fields = [
            'id', 'codigo', 'titulo', 'tipo', 'descripcion', 'version_actual', 'estado',
            'propietario', 'propietario_nombre', 'aprobado_por', 'aprobado_por_nombre',
            'archivo', 'fecha_aprobacion', 'fecha_proxima_revision', 'versiones',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']
