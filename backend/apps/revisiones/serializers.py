from rest_framework import serializers

from .models import PreguntaChecklistPersonas, RespuestaChecklistPersonas, RevisionPersonas


class RevisionPersonasSerializer(serializers.ModelSerializer):
    revisor_nombre = serializers.CharField(source='revisor.nombre_completo', read_only=True)
    responsable_talento_humano_nombre = serializers.CharField(
        source='responsable_talento_humano.nombre_completo', read_only=True
    )
    responsable_tecnologia_nombre = serializers.CharField(
        source='responsable_tecnologia.nombre_completo', read_only=True
    )

    class Meta:
        model = RevisionPersonas
        fields = [
            'id', 'fecha_revision', 'revisor', 'revisor_nombre',
            'responsable_talento_humano', 'responsable_talento_humano_nombre',
            'responsable_tecnologia', 'responsable_tecnologia_nombre',
            'muestra_seleccionada', 'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']


class PreguntaChecklistPersonasSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreguntaChecklistPersonas
        fields = ['id', 'control_codigo', 'control_nombre', 'numero', 'texto']


class RespuestaChecklistPersonasSerializer(serializers.ModelSerializer):
    pregunta_numero = serializers.IntegerField(source='pregunta.numero', read_only=True)
    pregunta_texto = serializers.CharField(source='pregunta.texto', read_only=True)
    pregunta_control_codigo = serializers.CharField(source='pregunta.control_codigo', read_only=True)
    pregunta_control_nombre = serializers.CharField(source='pregunta.control_nombre', read_only=True)

    class Meta:
        model = RespuestaChecklistPersonas
        fields = [
            'id', 'revision', 'pregunta', 'pregunta_numero', 'pregunta_texto',
            'pregunta_control_codigo', 'pregunta_control_nombre', 'resultado', 'evidencia',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'revision', 'pregunta', 'creado_en', 'actualizado_en']
