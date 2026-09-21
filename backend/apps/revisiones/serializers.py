from rest_framework import serializers

from .models import (
    PreguntaChecklistFisicos,
    PreguntaChecklistOrganizacionales,
    PreguntaChecklistPersonas,
    PreguntaChecklistTecnologicos,
    RespuestaChecklistFisicos,
    RespuestaChecklistOrganizacionales,
    RespuestaChecklistPersonas,
    RespuestaChecklistTecnologicos,
    RevisionFisicos,
    RevisionOrganizacionales,
    RevisionPersonas,
    RevisionTecnologicos,
)


class RevisionPersonasSerializer(serializers.ModelSerializer):
    revisor_nombre = serializers.CharField(source='revisor.nombre_completo', read_only=True)
    responsable_talento_humano_nombre = serializers.CharField(
        source='responsable_talento_humano.nombre_completo', read_only=True
    )
    responsable_tecnologia_nombre = serializers.CharField(
        source='responsable_tecnologia.nombre_completo', read_only=True
    )
    porcentaje_general = serializers.FloatField(read_only=True)
    porcentajes_por_control = serializers.ReadOnlyField()

    class Meta:
        model = RevisionPersonas
        fields = [
            'id', 'fecha_revision', 'revisor', 'revisor_nombre',
            'responsable_talento_humano', 'responsable_talento_humano_nombre',
            'responsable_tecnologia', 'responsable_tecnologia_nombre',
            'muestra_seleccionada', 'finalizada', 'porcentaje_general', 'porcentajes_por_control',
            'creado_en', 'actualizado_en',
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


# --- Organizacionales ----------------------------------------------------------------

class RevisionOrganizacionalesSerializer(serializers.ModelSerializer):
    revisor_nombre = serializers.CharField(source='revisor.nombre_completo', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.nombre_completo', read_only=True)
    porcentaje_general = serializers.FloatField(read_only=True)
    porcentajes_por_control = serializers.ReadOnlyField()

    class Meta:
        model = RevisionOrganizacionales
        fields = [
            'id', 'fecha_revision', 'revisor', 'revisor_nombre', 'responsable', 'responsable_nombre',
            'muestra_seleccionada', 'finalizada', 'porcentaje_general', 'porcentajes_por_control',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']


class PreguntaChecklistOrganizacionalesSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreguntaChecklistOrganizacionales
        fields = ['id', 'control_codigo', 'control_nombre', 'numero', 'texto']


class RespuestaChecklistOrganizacionalesSerializer(serializers.ModelSerializer):
    pregunta_numero = serializers.IntegerField(source='pregunta.numero', read_only=True)
    pregunta_texto = serializers.CharField(source='pregunta.texto', read_only=True)
    pregunta_control_codigo = serializers.CharField(source='pregunta.control_codigo', read_only=True)
    pregunta_control_nombre = serializers.CharField(source='pregunta.control_nombre', read_only=True)

    class Meta:
        model = RespuestaChecklistOrganizacionales
        fields = [
            'id', 'revision', 'pregunta', 'pregunta_numero', 'pregunta_texto',
            'pregunta_control_codigo', 'pregunta_control_nombre', 'resultado', 'evidencia',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'revision', 'pregunta', 'creado_en', 'actualizado_en']


# --- Físicos ---------------------------------------------------------------------------

class RevisionFisicosSerializer(serializers.ModelSerializer):
    revisor_nombre = serializers.CharField(source='revisor.nombre_completo', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.nombre_completo', read_only=True)
    porcentaje_general = serializers.FloatField(read_only=True)
    porcentajes_por_control = serializers.ReadOnlyField()

    class Meta:
        model = RevisionFisicos
        fields = [
            'id', 'fecha_revision', 'revisor', 'revisor_nombre', 'responsable', 'responsable_nombre',
            'muestra_seleccionada', 'finalizada', 'porcentaje_general', 'porcentajes_por_control',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']


class PreguntaChecklistFisicosSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreguntaChecklistFisicos
        fields = ['id', 'control_codigo', 'control_nombre', 'numero', 'texto']


class RespuestaChecklistFisicosSerializer(serializers.ModelSerializer):
    pregunta_numero = serializers.IntegerField(source='pregunta.numero', read_only=True)
    pregunta_texto = serializers.CharField(source='pregunta.texto', read_only=True)
    pregunta_control_codigo = serializers.CharField(source='pregunta.control_codigo', read_only=True)
    pregunta_control_nombre = serializers.CharField(source='pregunta.control_nombre', read_only=True)

    class Meta:
        model = RespuestaChecklistFisicos
        fields = [
            'id', 'revision', 'pregunta', 'pregunta_numero', 'pregunta_texto',
            'pregunta_control_codigo', 'pregunta_control_nombre', 'resultado', 'evidencia',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'revision', 'pregunta', 'creado_en', 'actualizado_en']


# --- Tecnológicos ------------------------------------------------------------------------

class RevisionTecnologicosSerializer(serializers.ModelSerializer):
    revisor_nombre = serializers.CharField(source='revisor.nombre_completo', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.nombre_completo', read_only=True)
    porcentaje_general = serializers.FloatField(read_only=True)
    porcentajes_por_control = serializers.ReadOnlyField()

    class Meta:
        model = RevisionTecnologicos
        fields = [
            'id', 'fecha_revision', 'revisor', 'revisor_nombre', 'responsable', 'responsable_nombre',
            'muestra_seleccionada', 'finalizada', 'porcentaje_general', 'porcentajes_por_control',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']


class PreguntaChecklistTecnologicosSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreguntaChecklistTecnologicos
        fields = ['id', 'control_codigo', 'control_nombre', 'numero', 'texto']


class RespuestaChecklistTecnologicosSerializer(serializers.ModelSerializer):
    pregunta_numero = serializers.IntegerField(source='pregunta.numero', read_only=True)
    pregunta_texto = serializers.CharField(source='pregunta.texto', read_only=True)
    pregunta_control_codigo = serializers.CharField(source='pregunta.control_codigo', read_only=True)
    pregunta_control_nombre = serializers.CharField(source='pregunta.control_nombre', read_only=True)

    class Meta:
        model = RespuestaChecklistTecnologicos
        fields = [
            'id', 'revision', 'pregunta', 'pregunta_numero', 'pregunta_texto',
            'pregunta_control_codigo', 'pregunta_control_nombre', 'resultado', 'evidencia',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'revision', 'pregunta', 'creado_en', 'actualizado_en']
