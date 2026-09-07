from rest_framework import mixins, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated

from .models import PreguntaChecklistPersonas, RespuestaChecklistPersonas, RevisionPersonas
from .serializers import (
    PreguntaChecklistPersonasSerializer,
    RespuestaChecklistPersonasSerializer,
    RevisionPersonasSerializer,
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
