from django.conf import settings
from django.http import FileResponse, HttpResponse
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.views import DescargaArchivoMixin

from .excel_builder_informe import generar_informe_auditoria_xlsx
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
from .serializers import (
    ArchivoAdjuntoSeguimientoSerializer,
    AuditoriaSerializer,
    HallazgoSerializer,
    ItemVerificacionAuditoriaSerializer,
    MatrizPriorizacionAuditoriaSerializer,
    OportunidadPlanAuditoriaSerializer,
    ProgramaAuditoriaSerializer,
    RiesgoPlanAuditoriaSerializer,
    SeguimientoHallazgoSerializer,
    SesionAuditoriaSerializer,
    TipoHallazgoSerializer,
)


class TipoHallazgoViewSet(viewsets.ReadOnlyModelViewSet):
    """Catálogo de tipos de hallazgo: se administra desde /admin/, de solo lectura en la API."""

    queryset = TipoHallazgo.objects.all()
    serializer_class = TipoHallazgoSerializer
    permission_classes = [IsAuthenticated]


class HallazgoViewSet(viewsets.ModelViewSet):
    queryset = Hallazgo.objects.select_related('auditoria').prefetch_related(
        'procesos', 'tipos', 'controles', 'numerales', 'seguimientos', 'seguimientos__archivos_adjuntos',
        'seguimientos__responsables', 'items_verificacion_origen',
    ).all()
    serializer_class = HallazgoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['procesos', 'tipos', 'controles', 'numerales', 'auditoria']
    search_fields = ['codigo', 'descripcion']
    ordering_fields = ['fecha_deteccion', 'codigo']


class SeguimientoHallazgoViewSet(viewsets.ModelViewSet):
    queryset = SeguimientoHallazgo.objects.select_related('hallazgo').prefetch_related(
        'archivos_adjuntos', 'responsables'
    ).all()
    serializer_class = SeguimientoHallazgoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['hallazgo', 'verificacion_eficacia', 'responsables']
    ordering_fields = ['fecha_seguimiento']


class ArchivoAdjuntoSeguimientoViewSet(DescargaArchivoMixin, viewsets.ModelViewSet):
    queryset = ArchivoAdjuntoSeguimiento.objects.select_related('seguimiento').all()
    serializer_class = ArchivoAdjuntoSeguimientoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['seguimiento']


class MatrizPriorizacionAuditoriaViewSet(viewsets.ModelViewSet):
    queryset = MatrizPriorizacionAuditoria.objects.select_related('proceso').all()
    serializer_class = MatrizPriorizacionAuditoriaSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['anio', 'proceso']
    ordering_fields = ['anio', 'proceso__nombre']


class ProgramaAuditoriaViewSet(viewsets.ModelViewSet):
    queryset = ProgramaAuditoria.objects.select_related('proceso', 'auditor_lider').prefetch_related('auditorias').all()
    serializer_class = ProgramaAuditoriaSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['anio', 'tipo', 'proceso', 'mes_planeado']
    ordering_fields = ['anio', 'mes_planeado']

    @action(detail=True, methods=['post'], url_path='crear-auditoria')
    def crear_auditoria(self, request, pk=None):
        """Materializa esta fila del programa anual en una Auditoria real (el Plan de
        Auditoría, FO-860-24) que el Auditor Líder termina de diligenciar."""
        programa = self.get_object()
        if programa.auditorias.exists():
            raise ValidationError('Esta fila del programa ya tiene una auditoría creada.')
        auditoria = Auditoria.objects.create(
            programa=programa,
            tipo=Auditoria.TipoAuditoria.ORDINARIA,
            auditor_lider=programa.auditor_lider,
        )
        return Response(AuditoriaSerializer(auditoria).data, status=201)


class AuditoriaViewSet(viewsets.ModelViewSet):
    queryset = Auditoria.objects.select_related('programa', 'auditor_lider', 'aprobado_por').prefetch_related(
        'equipo_auditor', 'riesgos_plan', 'oportunidades_plan', 'sesiones', 'items_verificacion', 'hallazgos',
    ).all()
    serializer_class = AuditoriaSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['estado', 'tipo', 'programa', 'auditor_lider']
    search_fields = ['codigo', 'objetivo', 'alcance']
    ordering_fields = ['fecha_auditoria', 'codigo']

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.estado == Auditoria.Estado.CERRADA and not self.request.user.is_superuser:
            raise PermissionDenied('Esta auditoría ya fue cerrada. Solo un administrador puede modificarla.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.estado == Auditoria.Estado.CERRADA and not self.request.user.is_superuser:
            raise PermissionDenied('Esta auditoría ya fue cerrada. Solo un administrador puede eliminarla.')
        instance.delete()

    @action(detail=True, methods=['get'])
    def xlsx(self, request, pk=None):
        auditoria = self.get_object()
        if auditoria.estado != Auditoria.Estado.CERRADA:
            raise ValidationError('Solo se puede descargar el informe de una auditoría ya cerrada.')
        buffer = generar_informe_auditoria_xlsx(auditoria)
        nombre_archivo = f'FO-860-22_informe_auditoria_{auditoria.codigo}.xlsx'.replace(' ', '_')
        respuesta = HttpResponse(
            buffer.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        respuesta['Content-Disposition'] = f'attachment; filename="{nombre_archivo}"'
        return respuesta


class RiesgoPlanAuditoriaViewSet(viewsets.ModelViewSet):
    queryset = RiesgoPlanAuditoria.objects.all()
    serializer_class = RiesgoPlanAuditoriaSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['auditoria']


class OportunidadPlanAuditoriaViewSet(viewsets.ModelViewSet):
    queryset = OportunidadPlanAuditoria.objects.all()
    serializer_class = OportunidadPlanAuditoriaSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['auditoria']


class SesionAuditoriaViewSet(viewsets.ModelViewSet):
    queryset = SesionAuditoria.objects.select_related('proceso', 'auditor').all()
    serializer_class = SesionAuditoriaSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['auditoria', 'proceso']
    ordering_fields = ['fecha', 'hora_inicio']


class ItemVerificacionAuditoriaViewSet(viewsets.ModelViewSet):
    queryset = ItemVerificacionAuditoria.objects.select_related(
        'sesion', 'sesion__proceso', 'hallazgo_generado',
    ).all()
    serializer_class = ItemVerificacionAuditoriaSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['auditoria', 'sesion', 'tipo_hallazgo']

    @action(detail=True, methods=['post'], url_path='generar-hallazgo')
    def generar_hallazgo(self, request, pk=None):
        """Formaliza este item del checklist como un Hallazgo real del módulo existente,
        para heredar el flujo de seguimiento y cierre. Solo tiene sentido si el tipo no
        es Conformidad (una conformidad no requiere acción)."""
        item = self.get_object()
        if item.hallazgo_generado_id:
            raise ValidationError('Este item ya tiene un hallazgo generado.')
        if not item.tipo_hallazgo or item.tipo_hallazgo == ItemVerificacionAuditoria.TipoHallazgoChecklist.CONFORMIDAD:
            raise ValidationError('Solo se puede generar un hallazgo cuando el tipo no es Conformidad.')

        mapa_tipos = {
            ItemVerificacionAuditoria.TipoHallazgoChecklist.NO_CONFORMIDAD: 'NC',
            ItemVerificacionAuditoria.TipoHallazgoChecklist.OPORTUNIDAD_MEJORA: 'AM',
            ItemVerificacionAuditoria.TipoHallazgoChecklist.FORTALEZA: 'FORT',
        }
        codigo_tipo = mapa_tipos.get(item.tipo_hallazgo)
        tipo_hallazgo = TipoHallazgo.objects.filter(codigo=codigo_tipo).first()

        hallazgo = Hallazgo.objects.create(
            fecha_deteccion=item.auditoria.fecha_auditoria or timezone.localdate(),
            descripcion=item.descripcion_hallazgo or item.descripcion_elemento,
            auditoria=item.auditoria,
        )
        if tipo_hallazgo:
            hallazgo.tipos.add(tipo_hallazgo)
        if item.sesion_id and item.sesion.proceso_id:
            hallazgo.procesos.add(item.sesion.proceso_id)

        item.hallazgo_generado = hallazgo
        item.save(update_fields=['hallazgo_generado'])
        return Response(ItemVerificacionAuditoriaSerializer(item).data, status=201)


class PlantillaPlanAuditoriaView(APIView):
    """Descarga la plantilla en blanco del Plan de Auditoría (FO-860-24), tal cual —
    no rellena datos de ninguna auditoría en particular. Pensada para que el Auditor
    Líder la diligencie a mano antes/durante la auditoría, o como referencia."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        ruta = settings.BASE_DIR / 'apps' / 'auditorias' / 'excel_templates' / 'FO-860-24_plan_auditoria.xlsx'
        return FileResponse(
            open(ruta, 'rb'), as_attachment=True, filename='FO-860-24_Plan_de_auditoria.xlsx',
        )


class PlantillaInformeAuditoriaView(APIView):
    """Descarga la plantilla en blanco del Informe de Auditoría Interna (FO-860-22)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        ruta = settings.BASE_DIR / 'apps' / 'auditorias' / 'excel_templates' / 'FO-860-22_informe_auditoria_interna.xlsx'
        return FileResponse(
            open(ruta, 'rb'), as_attachment=True, filename='FO-860-22_Informe_de_auditoria_interna.xlsx',
        )
