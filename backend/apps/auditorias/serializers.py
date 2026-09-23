from rest_framework import serializers

from .models import (
    ArchivoAdjuntoSeguimiento,
    Auditoria,
    Hallazgo,
    ItemVerificacionAuditoria,
    MatrizPriorizacionAuditoria,
    OportunidadPlanAuditoria,
    ProgramaAuditoria,
    RiesgoPlanAuditoria,
    SeguimientoHallazgo,
    SesionAuditoria,
    TipoHallazgo,
)


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
    controles_nombres = serializers.SerializerMethodField()
    numerales_codigos = serializers.SerializerMethodField()
    numerales_nombres = serializers.SerializerMethodField()
    seguimientos = SeguimientoHallazgoSerializer(many=True, read_only=True)
    estado = serializers.ChoiceField(choices=Hallazgo.Estado.choices, read_only=True)

    auditoria_codigo = serializers.SerializerMethodField()
    items_checklist_relacionados = serializers.SerializerMethodField()

    class Meta:
        model = Hallazgo
        fields = [
            'id', 'codigo', 'fecha_deteccion', 'procesos', 'procesos_nombres', 'tema', 'tipos', 'tipos_nombres',
            'tipos_codigos', 'descripcion', 'evidencia_asociada', 'controles', 'controles_codigos',
            'controles_nombres', 'numerales', 'numerales_codigos', 'numerales_nombres', 'analisis_causa', 'estado',
            'auditoria', 'auditoria_codigo', 'items_checklist_relacionados', 'seguimientos', 'creado_en',
            'actualizado_en',
        ]
        read_only_fields = ['id', 'codigo', 'creado_en', 'actualizado_en']

    def get_auditoria_codigo(self, obj):
        return obj.auditoria.codigo if obj.auditoria_id else None

    def get_items_checklist_relacionados(self, obj):
        return [
            {
                'id': item.id,
                'descripcion_elemento': item.descripcion_elemento,
                'requisito_iso': item.requisito_iso,
                'tipo_hallazgo': item.tipo_hallazgo,
            }
            for item in obj.items_verificacion_origen.all()
        ]

    def get_procesos_nombres(self, obj):
        return [p.nombre for p in obj.procesos.all()]

    def get_tipos_nombres(self, obj):
        return [t.nombre for t in obj.tipos.all()]

    def get_tipos_codigos(self, obj):
        return [t.codigo for t in obj.tipos.all()]

    def get_controles_codigos(self, obj):
        return [c.codigo for c in obj.controles.all()]

    def get_controles_nombres(self, obj):
        return [c.nombre for c in obj.controles.all()]

    def get_numerales_codigos(self, obj):
        return [n.codigo for n in obj.numerales.all()]

    def get_numerales_nombres(self, obj):
        return [n.nombre for n in obj.numerales.all()]

    def validate_procesos(self, value):
        if not value:
            raise serializers.ValidationError('Selecciona al menos un proceso.')
        return value

    def validate_tipos(self, value):
        if not value:
            raise serializers.ValidationError('Selecciona al menos un tipo de hallazgo.')
        return value


class MatrizPriorizacionAuditoriaSerializer(serializers.ModelSerializer):
    proceso_nombre = serializers.SerializerMethodField()
    puntaje_final = serializers.ReadOnlyField()
    prioridad = serializers.ReadOnlyField()

    class Meta:
        model = MatrizPriorizacionAuditoria
        fields = [
            'id', 'proceso', 'proceso_nombre', 'anio', 'criticidad', 'auditorias_previas', 'cambios', 'incidentes',
            'legales', 'relevancia', 'riesgo_residual', 'puntaje_final', 'prioridad', 'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']

    def get_proceso_nombre(self, obj):
        return obj.proceso.nombre


class ProgramaAuditoriaSerializer(serializers.ModelSerializer):
    proceso_nombre = serializers.SerializerMethodField()
    auditor_lider_nombre = serializers.SerializerMethodField()
    mes_planeado_display = serializers.SerializerMethodField()
    tiene_auditoria = serializers.SerializerMethodField()

    class Meta:
        model = ProgramaAuditoria
        fields = [
            'id', 'anio', 'tipo', 'proceso', 'proceso_nombre', 'auditado', 'procedimiento', 'servicio_o_proyecto',
            'auditor_lider', 'auditor_lider_nombre', 'mes_planeado', 'mes_planeado_display', 'tiene_auditoria',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']

    def get_proceso_nombre(self, obj):
        return obj.proceso.nombre if obj.proceso_id else None

    def get_auditor_lider_nombre(self, obj):
        return obj.auditor_lider.nombre_completo if obj.auditor_lider_id else None

    def get_mes_planeado_display(self, obj):
        return obj.get_mes_planeado_display() if obj.mes_planeado else None

    def get_tiene_auditoria(self, obj):
        return obj.auditorias.exists()


class RiesgoPlanAuditoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiesgoPlanAuditoria
        fields = ['id', 'auditoria', 'nombre_riesgo', 'accion_control', 'responsable', 'evidencia']
        read_only_fields = ['id']


class OportunidadPlanAuditoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = OportunidadPlanAuditoria
        fields = ['id', 'auditoria', 'nombre_oportunidad', 'medida_aprovechar', 'responsable', 'evidencia']
        read_only_fields = ['id']


class SesionAuditoriaSerializer(serializers.ModelSerializer):
    proceso_nombre = serializers.SerializerMethodField()
    auditor_nombre = serializers.SerializerMethodField()

    class Meta:
        model = SesionAuditoria
        fields = [
            'id', 'auditoria', 'ciudad', 'fecha', 'hora_inicio', 'hora_fin', 'proceso', 'proceso_nombre', 'tema',
            'procedimiento', 'requisitos_a_auditar', 'auditado', 'auditor', 'auditor_nombre',
        ]
        read_only_fields = ['id']

    def get_proceso_nombre(self, obj):
        return obj.proceso.nombre if obj.proceso_id else None

    def get_auditor_nombre(self, obj):
        return obj.auditor.nombre_completo if obj.auditor_id else None


class ItemVerificacionAuditoriaSerializer(serializers.ModelSerializer):
    proceso_sesion_nombre = serializers.SerializerMethodField()
    hallazgo_generado_codigo = serializers.SerializerMethodField()

    class Meta:
        model = ItemVerificacionAuditoria
        fields = [
            'id', 'auditoria', 'sesion', 'proceso_sesion_nombre', 'etapa', 'descripcion_elemento', 'requisito_iso',
            'otros_requisitos', 'tipo_hallazgo', 'descripcion_hallazgo', 'hallazgo_generado',
            'hallazgo_generado_codigo',
        ]
        read_only_fields = ['id']

    def get_proceso_sesion_nombre(self, obj):
        return obj.sesion.proceso.nombre if obj.sesion_id and obj.sesion.proceso_id else None

    def get_hallazgo_generado_codigo(self, obj):
        return obj.hallazgo_generado.codigo if obj.hallazgo_generado_id else None


class AuditoriaSerializer(serializers.ModelSerializer):
    auditor_lider_nombre = serializers.SerializerMethodField()
    equipo_auditor_nombres = serializers.SerializerMethodField()
    aprobado_por_nombre = serializers.SerializerMethodField()
    procesos_auditados_nombres = serializers.SerializerMethodField()
    programa_descripcion = serializers.SerializerMethodField()
    riesgos_plan = RiesgoPlanAuditoriaSerializer(many=True, read_only=True)
    oportunidades_plan = OportunidadPlanAuditoriaSerializer(many=True, read_only=True)
    sesiones = SesionAuditoriaSerializer(many=True, read_only=True)
    items_verificacion = ItemVerificacionAuditoriaSerializer(many=True, read_only=True)
    total_hallazgos = serializers.SerializerMethodField()

    class Meta:
        model = Auditoria
        fields = [
            'id', 'codigo', 'programa', 'programa_descripcion', 'tipo', 'estado', 'objetivo', 'alcance',
            'criterios', 'metodologia', 'numero_auditados', 'numero_auditores', 'auditor_lider',
            'auditor_lider_nombre', 'equipo_auditor', 'equipo_auditor_nombres', 'ciudad', 'fecha_auditoria',
            'fecha_elaboracion_informe', 'conclusiones_generales', 'aprobado_por', 'aprobado_por_nombre',
            'procesos_auditados_nombres', 'riesgos_plan', 'oportunidades_plan', 'sesiones', 'items_verificacion',
            'total_hallazgos', 'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'codigo', 'creado_en', 'actualizado_en']

    def get_auditor_lider_nombre(self, obj):
        return obj.auditor_lider.nombre_completo if obj.auditor_lider_id else None

    def get_programa_descripcion(self, obj):
        if not obj.programa_id:
            return None
        programa = obj.programa
        objetivo = programa.proceso.nombre if programa.proceso_id else (programa.auditado or programa.servicio_o_proyecto or '—')
        mes = programa.get_mes_planeado_display() if programa.mes_planeado else 'sin mes'
        return f'Programa {programa.anio} — {mes} ({objetivo})'

    def get_equipo_auditor_nombres(self, obj):
        return [e.nombre_completo for e in obj.equipo_auditor.all()]

    def get_aprobado_por_nombre(self, obj):
        return obj.aprobado_por.nombre_completo if obj.aprobado_por_id else None

    def get_procesos_auditados_nombres(self, obj):
        return [p.nombre for p in obj.procesos_auditados]

    def get_total_hallazgos(self, obj):
        return obj.hallazgos.count()
