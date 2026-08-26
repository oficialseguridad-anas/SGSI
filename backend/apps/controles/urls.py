from rest_framework.routers import DefaultRouter

from .views import AplicabilidadControlViewSet, ControlViewSet

router = DefaultRouter()
router.register('controles', ControlViewSet, basename='control')
router.register('soa', AplicabilidadControlViewSet, basename='aplicabilidadcontrol')

urlpatterns = router.urls
