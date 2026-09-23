from rest_framework import serializers

from .models import (
    CompromisoRevisionDireccion,
    PreguntaChecklistFisicos,
    PreguntaChecklistOrganizacionales,
    PreguntaChecklistPersonas,
    PreguntaChecklistTecnologicos,
    RespuestaChecklistFisicos,
    RespuestaChecklistOrganizacionales,
    RespuestaChecklistPersonas,
    RespuestaChecklistTecnologicos,
    RevisionDireccion,
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


# --- Revisión por la Dirección (9.3) ---------------------------------------------------

class CompromisoRevisionDireccionSerializer(serializers.ModelSerializer):
    responsable_nombre = serializers.CharField(source='responsable.nombre_completo', read_only=True)
    esta_vencido = serializers.BooleanField(read_only=True)
    revision_periodo = serializers.CharField(source='revision.periodo', read_only=True)

    class Meta:
        model = CompromisoRevisionDireccion
        fields = [
            'id', 'revision', 'revision_periodo', 'descripcion', 'responsable', 'responsable_nombre',
            'fecha_limite', 'estado', 'esta_vencido', 'observaciones_cierre',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']


class RevisionDireccionSerializer(serializers.ModelSerializer):
    preside_nombre = serializers.CharField(source='preside.nombre_completo', read_only=True)
    asistentes_nombres = serializers.SerializerMethodField()
    compromisos = CompromisoRevisionDireccionSerializer(many=True, read_only=True)
    compromisos_pendientes_anteriores = CompromisoRevisionDireccionSerializer(many=True, read_only=True)
    resumen_datos = serializers.ReadOnlyField()

    class Meta:
        model = RevisionDireccion
        fields = [
            'id', 'periodo', 'fecha_revision', 'preside', 'preside_nombre',
            'asistentes', 'asistentes_nombres', 'lugar_modalidad',
            'estado_acciones_previas', 'cambios_cuestiones_externas_internas',
            'cambios_partes_interesadas', 'desempeno_no_conformidades',
            'desempeno_seguimiento_medicion', 'desempeno_auditorias', 'desempeno_objetivos',
            'retroalimentacion_partes_interesadas', 'resultados_riesgos', 'oportunidades_mejora',
            'conclusiones_generales', 'finalizada', 'compromisos', 'compromisos_pendientes_anteriores',
            'resumen_datos', 'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']

    def get_asistentes_nombres(self, obj):
        return [u.nombre_completo for u in obj.asistentes.all()]
