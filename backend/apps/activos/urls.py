from rest_framework.routers import DefaultRouter

from .views import (
    ActivoViewSet,
    DireccionViewSet,
    ProcesoViewSet,
    RevisionSemestralActivosViewSet,
    SnapshotActivoViewSet,
)

router = DefaultRouter()
router.register('procesos', ProcesoViewSet, basename='proceso')
router.register('direcciones', DireccionViewSet, basename='direccion')
router.register('activos', ActivoViewSet, basename='activo')
router.register('revisiones-activos', RevisionSemestralActivosViewSet, basename='revisionsemestralactivos')
router.register('snapshots-activo', SnapshotActivoViewSet, basename='snapshotactivo')

urlpatterns = router.urls
