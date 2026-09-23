from django.http import HttpResponse
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated

from .docx_builder import generar_acta_docx
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
from .serializers import (
    CompromisoRevisionDireccionSerializer,
    PreguntaChecklistFisicosSerializer,
    PreguntaChecklistOrganizacionalesSerializer,
    PreguntaChecklistPersonasSerializer,
    PreguntaChecklistTecnologicosSerializer,
    RespuestaChecklistFisicosSerializer,
    RespuestaChecklistOrganizacionalesSerializer,
    RespuestaChecklistPersonasSerializer,
    RespuestaChecklistTecnologicosSerializer,
    RevisionDireccionSerializer,
    RevisionFisicosSerializer,
    RevisionOrganizacionalesSerializer,
    RevisionPersonasSerializer,
    RevisionTecnologicosSerializer,
)


class RevisionPersonasViewSet(viewsets.ModelViewSet):
    queryset = RevisionPersonas.objects.select_related(
        'revisor', 'responsable_talento_humano', 'responsable_tecnologia'
    ).all()
    serializer_class = RevisionPersonasSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    ordering_fields = ['fecha_revision']

    def perform_create(self, serializer):
        revision = serializer.save()
        # Una respuesta en blanco por cada pregunta del catálogo, para que el checklist
        # de esta revisión nazca completo y listo para llenar (igual que AplicabilidadControl
        # se crea junto con cada Control del catálogo del Anexo A).
        RespuestaChecklistPersonas.objects.bulk_create(
            RespuestaChecklistPersonas(revision=revision, pregunta=pregunta)
            for pregunta in PreguntaChecklistPersonas.objects.all()
        )

    def perform_update(self, serializer):
        # Cualquier usuario con el permiso puede finalizar el checklist (False -> True) al
        # terminarlo, pero solo un administrador puede reabrirlo (True -> False) — evita que
        # un usuario normal se "autodesbloquee" un checklist ya finalizado.
        instance = serializer.instance
        finalizada_nueva = serializer.validated_data.get('finalizada', instance.finalizada)
        if instance.finalizada and not finalizada_nueva and not self.request.user.is_superuser:
            raise PermissionDenied('Solo un administrador puede reabrir un checklist finalizado.')
        serializer.save()


class PreguntaChecklistPersonasViewSet(viewsets.ReadOnlyModelViewSet):
    """Catálogo de preguntas: se administra desde /admin/, de solo lectura en la API."""

    queryset = PreguntaChecklistPersonas.objects.all()
    serializer_class = PreguntaChecklistPersonasSerializer
    permission_classes = [IsAuthenticated]


class RespuestaChecklistPersonasViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    """Solo lectura/actualización: las respuestas se crean automáticamente junto con la
    revisión (ver RevisionPersonasViewSet.perform_create), nunca sueltas por el usuario."""

    queryset = RespuestaChecklistPersonas.objects.select_related('pregunta', 'revision').all()
    serializer_class = RespuestaChecklistPersonasSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['revision']

    def perform_update(self, serializer):
        # Una vez finalizado el checklist de la revisión, las respuestas quedan de solo
        # lectura salvo para un administrador que necesite hacer un ajuste puntual.
        revision = serializer.instance.revision
        if revision.finalizada and not self.request.user.is_superuser:
            raise PermissionDenied('Este checklist ya fue finalizado. Solo un administrador puede modificarlo.')
        serializer.save()


# --- Infraestructura compartida por las 3 categorías nuevas (Organizacionales, Físicos,
# Tecnológicos): misma mecánica que Personas (crear respuestas en blanco al crear la
# revisión, bloquear reapertura de un checklist finalizado salvo administrador), pero
# factorizada en mixins para no repetir la lógica 3 veces. -----------------------------

class RevisionAnexoAViewSetMixin:
    """`modelo_pregunta` y `modelo_respuesta` los define cada subclase concreta."""

    modelo_pregunta = None
    modelo_respuesta = None

    def perform_create(self, serializer):
        revision = serializer.save()
        self.modelo_respuesta.objects.bulk_create(
            self.modelo_respuesta(revision=revision, pregunta=pregunta)
            for pregunta in self.modelo_pregunta.objects.all()
        )

    def perform_update(self, serializer):
        instance = serializer.instance
        finalizada_nueva = serializer.validated_data.get('finalizada', instance.finalizada)
        if instance.finalizada and not finalizada_nueva and not self.request.user.is_superuser:
            raise PermissionDenied('Solo un administrador puede reabrir un checklist finalizado.')
        serializer.save()


class RespuestaChecklistAnexoAViewSetMixin:
    def perform_update(self, serializer):
        revision = serializer.instance.revision
        if revision.finalizada and not self.request.user.is_superuser:
            raise PermissionDenied('Este checklist ya fue finalizado. Solo un administrador puede modificarlo.')
        serializer.save()


class RevisionOrganizacionalesViewSet(RevisionAnexoAViewSetMixin, viewsets.ModelViewSet):
    queryset = RevisionOrganizacionales.objects.select_related('revisor', 'responsable').all()
    serializer_class = RevisionOrganizacionalesSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    ordering_fields = ['fecha_revision']
    modelo_pregunta = PreguntaChecklistOrganizacionales
    modelo_respuesta = RespuestaChecklistOrganizacionales


class PreguntaChecklistOrganizacionalesViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PreguntaChecklistOrganizacionales.objects.all()
    serializer_class = PreguntaChecklistOrganizacionalesSerializer
    permission_classes = [IsAuthenticated]


class RespuestaChecklistOrganizacionalesViewSet(
    RespuestaChecklistAnexoAViewSetMixin,
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet,
):
    queryset = RespuestaChecklistOrganizacionales.objects.select_related('pregunta', 'revision').all()
    serializer_class = RespuestaChecklistOrganizacionalesSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['revision']


class RevisionFisicosViewSet(RevisionAnexoAViewSetMixin, viewsets.ModelViewSet):
    queryset = RevisionFisicos.objects.select_related('revisor', 'responsable').all()
    serializer_class = RevisionFisicosSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    ordering_fields = ['fecha_revision']
    modelo_pregunta = PreguntaChecklistFisicos
    modelo_respuesta = RespuestaChecklistFisicos


class PreguntaChecklistFisicosViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PreguntaChecklistFisicos.objects.all()
    serializer_class = PreguntaChecklistFisicosSerializer
    permission_classes = [IsAuthenticated]


class RespuestaChecklistFisicosViewSet(
    RespuestaChecklistAnexoAViewSetMixin,
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet,
):
    queryset = RespuestaChecklistFisicos.objects.select_related('pregunta', 'revision').all()
    serializer_class = RespuestaChecklistFisicosSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['revision']


class RevisionTecnologicosViewSet(RevisionAnexoAViewSetMixin, viewsets.ModelViewSet):
    queryset = RevisionTecnologicos.objects.select_related('revisor', 'responsable').all()
    serializer_class = RevisionTecnologicosSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    ordering_fields = ['fecha_revision']
    modelo_pregunta = PreguntaChecklistTecnologicos
    modelo_respuesta = RespuestaChecklistTecnologicos


class PreguntaChecklistTecnologicosViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PreguntaChecklistTecnologicos.objects.all()
    serializer_class = PreguntaChecklistTecnologicosSerializer
    permission_classes = [IsAuthenticated]


class RespuestaChecklistTecnologicosViewSet(
    RespuestaChecklistAnexoAViewSetMixin,
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet,
):
    queryset = RespuestaChecklistTecnologicos.objects.select_related('pregunta', 'revision').all()
    serializer_class = RespuestaChecklistTecnologicosSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['revision']


# --- Revisión por la Dirección (9.3) ---------------------------------------------------

class RevisionDireccionViewSet(viewsets.ModelViewSet):
    queryset = RevisionDireccion.objects.select_related('preside').prefetch_related(
        'asistentes', 'compromisos__responsable'
    ).all()
    serializer_class = RevisionDireccionSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    ordering_fields = ['fecha_revision']

    def perform_update(self, serializer):
        # Mismo criterio que las revisiones del Anexo A: cualquiera con el permiso puede
        # finalizar el acta, pero solo un administrador puede reabrirla.
        instance = serializer.instance
        finalizada_nueva = serializer.validated_data.get('finalizada', instance.finalizada)
        if instance.finalizada and not finalizada_nueva and not self.request.user.is_superuser:
            raise PermissionDenied('Solo un administrador puede reabrir un acta finalizada.')
        serializer.save()

    @action(detail=True, methods=['get'], url_path='docx')
    def docx(self, request, pk=None):
        """Evidencia en Word (.docx) del acta — solo para revisiones ya finalizadas, para
        que el documento descargado sea siempre el contenido definitivo (no un borrador a
        medio llenar). Se rellena la plantilla institucional real (ver docx_builder.py) en
        vez de generar un PDF: xhtml2pdf no pagina bien un documento largo cuando se le
        agrega una franja lateral fija por página, y Word sí maneja eso de forma nativa."""
        revision = self.get_object()
        if not revision.finalizada:
            raise ValidationError('Solo se puede descargar el documento de un acta ya finalizada.')

        buffer = generar_acta_docx(revision)
        nombre_archivo = f'acta_revision_direccion_{revision.periodo}.docx'.replace(' ', '_')
        respuesta = HttpResponse(
            buffer.read(),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        )
        respuesta['Content-Disposition'] = f'attachment; filename="{nombre_archivo}"'
        return respuesta


class CompromisoRevisionDireccionViewSet(viewsets.ModelViewSet):
    """Sin bloqueo por `finalizada`: a diferencia de las respuestas de checklist, un
    compromiso sigue avanzando (Pendiente -> En proceso -> Completado) después de
    finalizada el acta que lo originó — es la fuente de la siguiente revisión."""

    queryset = CompromisoRevisionDireccion.objects.select_related('revision', 'responsable').all()
    serializer_class = CompromisoRevisionDireccionSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['revision', 'estado']
