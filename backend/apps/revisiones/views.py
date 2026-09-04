from rest_framework import mixins, viewsets
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
