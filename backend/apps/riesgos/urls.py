from rest_framework.routers import DefaultRouter

from .views import ArchivoAdjuntoTratamientoViewSet, AmenazaViewSet, RiesgoViewSet, TratamientoRiesgoViewSet

router = DefaultRouter()
router.register('amenazas', AmenazaViewSet, basename='amenaza')
router.register('riesgos', RiesgoViewSet, basename='riesgo')
router.register('tratamientos-riesgo', TratamientoRiesgoViewSet, basename='tratamientoriesgo')
router.register('archivos-adjuntos-tratamiento', ArchivoAdjuntoTratamientoViewSet, basename='archivoadjuntotratamiento')

urlpatterns = router.urls
