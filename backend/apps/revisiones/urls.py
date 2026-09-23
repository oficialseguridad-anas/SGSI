from rest_framework.routers import DefaultRouter

from .views import (
    CompromisoRevisionDireccionViewSet,
    PreguntaChecklistFisicosViewSet,
    PreguntaChecklistOrganizacionalesViewSet,
    PreguntaChecklistPersonasViewSet,
    PreguntaChecklistTecnologicosViewSet,
    RespuestaChecklistFisicosViewSet,
    RespuestaChecklistOrganizacionalesViewSet,
    RespuestaChecklistPersonasViewSet,
    RespuestaChecklistTecnologicosViewSet,
    RevisionDireccionViewSet,
    RevisionFisicosViewSet,
    RevisionOrganizacionalesViewSet,
    RevisionPersonasViewSet,
    RevisionTecnologicosViewSet,
)

router = DefaultRouter()
router.register('revisiones-personas', RevisionPersonasViewSet, basename='revisionpersonas')
router.register(
    'preguntas-checklist-personas', PreguntaChecklistPersonasViewSet, basename='preguntachecklistpersonas'
)
router.register(
    'respuestas-checklist-personas', RespuestaChecklistPersonasViewSet, basename='respuestachecklistpersonas'
)

router.register('revisiones-organizacionales', RevisionOrganizacionalesViewSet, basename='revisionorganizacionales')
router.register(
    'preguntas-checklist-organizacionales',
    PreguntaChecklistOrganizacionalesViewSet,
    basename='preguntachecklistorganizacionales',
)
router.register(
    'respuestas-checklist-organizacionales',
    RespuestaChecklistOrganizacionalesViewSet,
    basename='respuestachecklistorganizacionales',
)

router.register('revisiones-fisicos', RevisionFisicosViewSet, basename='revisionfisicos')
router.register(
    'preguntas-checklist-fisicos', PreguntaChecklistFisicosViewSet, basename='preguntachecklistfisicos'
)
router.register(
    'respuestas-checklist-fisicos', RespuestaChecklistFisicosViewSet, basename='respuestachecklistfisicos'
)

router.register('revisiones-tecnologicos', RevisionTecnologicosViewSet, basename='revisiontecnologicos')
router.register(
    'preguntas-checklist-tecnologicos', PreguntaChecklistTecnologicosViewSet, basename='preguntachecklisttecnologicos'
)
router.register(
    'respuestas-checklist-tecnologicos',
    RespuestaChecklistTecnologicosViewSet,
    basename='respuestachecklisttecnologicos',
)

router.register('revisiones-direccion', RevisionDireccionViewSet, basename='revisiondireccion')
router.register(
    'compromisos-revision-direccion', CompromisoRevisionDireccionViewSet, basename='compromisorevisiondireccion'
)

urlpatterns = router.urls
