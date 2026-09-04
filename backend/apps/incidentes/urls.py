from rest_framework.routers import DefaultRouter

from .views import ArchivoAdjuntoIncidenteViewSet, IncidenteViewSet

router = DefaultRouter()
router.register('incidentes', IncidenteViewSet, basename='incidente')
router.register('archivos-adjuntos-incidente', ArchivoAdjuntoIncidenteViewSet, basename='archivoadjuntoincidente')

urlpatterns = router.urls
