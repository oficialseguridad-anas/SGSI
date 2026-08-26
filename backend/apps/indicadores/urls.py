from rest_framework.routers import DefaultRouter

from .views import IndicadorViewSet, SeguimientoIndicadorViewSet

router = DefaultRouter()
router.register('indicadores', IndicadorViewSet, basename='indicador')
router.register('seguimientos-indicador', SeguimientoIndicadorViewSet, basename='seguimientoindicador')

urlpatterns = router.urls
