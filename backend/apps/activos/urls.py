from rest_framework.routers import DefaultRouter

from .views import ActivoViewSet, DireccionViewSet, ProcesoViewSet

router = DefaultRouter()
router.register('procesos', ProcesoViewSet, basename='proceso')
router.register('direcciones', DireccionViewSet, basename='direccion')
router.register('activos', ActivoViewSet, basename='activo')

urlpatterns = router.urls
