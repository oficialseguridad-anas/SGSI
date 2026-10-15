from rest_framework import serializers

from .models import Documento, VersionDocumento


class VersionDocumentoSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.CharField(source='creado_por.nombre_completo', read_only=True, default=None)

    class Meta:
        model = VersionDocumento
        fields = [
            'id', 'documento', 'version', 'fecha_version', 'cambios', 'archivo', 'creado_por',
            'creado_por_nombre', 'creado_en',
        ]
        read_only_fields = ['id', 'creado_en']


class DocumentoSerializer(serializers.ModelSerializer):
    # Declarado explícito (en vez de dejar que ModelSerializer lo genere solo) para que
    # NO se le agregue el UniqueValidator automático de DRF (mensaje genérico en
    # inglés/poco claro) — la unicidad real la valida `validate_codigo` de abajo, con un
    # mensaje en español que dice justo qué pasó.
    codigo = serializers.CharField(max_length=20)
    propietario_nombre = serializers.CharField(source='propietario.nombre_completo', read_only=True)
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.nombre_completo', read_only=True, default=None
    )
    versiones = VersionDocumentoSerializer(many=True, read_only=True)

    class Meta:
        model = Documento
        fields = [
            'id', 'codigo', 'titulo', 'tipo', 'proceso', 'sub_proceso', 'version_actual', 'estado',
            'propietario', 'propietario_nombre', 'aprobado_por', 'aprobado_por_nombre',
            'archivo', 'fecha_aprobacion', 'fecha_proxima_revision', 'versiones',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']

    def validate_codigo(self, value):
        valor = value.strip()
        existente = Documento.objects.filter(codigo__iexact=valor)
        if self.instance:
            existente = existente.exclude(pk=self.instance.pk)
        if existente.exists():
            raise serializers.ValidationError('Ya existe un documento con este código — no se puede repetir.')
        return valor

    def validate_titulo(self, value):
        valor = value.strip()
        existente = Documento.objects.filter(titulo__iexact=valor)
        if self.instance:
            existente = existente.exclude(pk=self.instance.pk)
        if existente.exists():
            raise serializers.ValidationError('Ya existe un documento con este mismo título — revisa si no es el mismo antes de crear uno nuevo.')
        return valor
