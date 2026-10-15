from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import DocumentoViewSet, ListadoMaestroDocumentosView, VersionDocumentoViewSet

router = DefaultRouter()
router.register('documentos', DocumentoViewSet, basename='documento')
router.register('versiones-documento', VersionDocumentoViewSet, basename='versiondocumento')

urlpatterns = router.urls + [
    path('documentos-listado-maestro/', ListadoMaestroDocumentosView.as_view(), name='documentos-listado-maestro'),
]
