from rest_framework import viewsets
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated

from .models import Documento, VersionDocumento
from .serializers import DocumentoSerializer, VersionDocumentoSerializer


class DocumentoViewSet(viewsets.ModelViewSet):
    queryset = Documento.objects.select_related('propietario', 'aprobado_por').prefetch_related('versiones').all()
    serializer_class = DocumentoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['tipo', 'estado', 'propietario']
    search_fields = ['codigo', 'titulo', 'descripcion']
    ordering_fields = ['codigo', 'fecha_aprobacion', 'fecha_proxima_revision']


class VersionDocumentoViewSet(viewsets.ModelViewSet):
    queryset = VersionDocumento.objects.select_related('documento', 'creado_por').all()
    serializer_class = VersionDocumentoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['documento']
    ordering_fields = ['creado_en']
