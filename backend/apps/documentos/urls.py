from rest_framework.routers import DefaultRouter

from .views import DocumentoViewSet, VersionDocumentoViewSet

router = DefaultRouter()
router.register('documentos', DocumentoViewSet, basename='documento')
router.register('versiones-documento', VersionDocumentoViewSet, basename='versiondocumento')

urlpatterns = router.urls
