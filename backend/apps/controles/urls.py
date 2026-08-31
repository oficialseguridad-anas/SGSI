from rest_framework.routers import DefaultRouter

from .views import AplicabilidadControlViewSet, ControlViewSet, NumeralNormaViewSet

router = DefaultRouter()
router.register('controles', ControlViewSet, basename='control')
router.register('numerales-norma', NumeralNormaViewSet, basename='numeralnorma')
router.register('soa', AplicabilidadControlViewSet, basename='aplicabilidadcontrol')

urlpatterns = router.urls
