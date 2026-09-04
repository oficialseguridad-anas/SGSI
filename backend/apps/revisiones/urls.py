from rest_framework.routers import DefaultRouter

from .views import (
    PreguntaChecklistPersonasViewSet,
    RespuestaChecklistPersonasViewSet,
    RevisionPersonasViewSet,
)

router = DefaultRouter()
router.register('revisiones-personas', RevisionPersonasViewSet, basename='revisionpersonas')
router.register(
    'preguntas-checklist-personas', PreguntaChecklistPersonasViewSet, basename='preguntachecklistpersonas'
)
router.register(
    'respuestas-checklist-personas', RespuestaChecklistPersonasViewSet, basename='respuestachecklistpersonas'
)

urlpatterns = router.urls
