from rest_framework.routers import DefaultRouter

from .views import ActividadObjetivoViewSet, ArchivoAdjuntoActividadViewSet, ObjetivoViewSet

router = DefaultRouter()
router.register('objetivos', ObjetivoViewSet, basename='objetivo')
router.register('actividades-objetivo', ActividadObjetivoViewSet, basename='actividadobjetivo')
router.register('archivos-adjuntos-actividad', ArchivoAdjuntoActividadViewSet, basename='archivoadjuntoactividad')

urlpatterns = router.urls
