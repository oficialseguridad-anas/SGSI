from rest_framework.routers import DefaultRouter

from .views import (
    ArchivoAdjuntoSeguimientoViewSet,
    HallazgoViewSet,
    SeguimientoHallazgoViewSet,
    TipoHallazgoViewSet,
)

router = DefaultRouter()
router.register('hallazgos', HallazgoViewSet, basename='hallazgo')
router.register('tipos-hallazgo', TipoHallazgoViewSet, basename='tipohallazgo')
router.register('seguimientos-hallazgo', SeguimientoHallazgoViewSet, basename='seguimientohallazgo')
router.register('archivos-adjuntos-seguimiento', ArchivoAdjuntoSeguimientoViewSet, basename='archivoadjuntoseguimiento')

urlpatterns = router.urls
