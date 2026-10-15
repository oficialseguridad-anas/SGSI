from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated
from rest_framework.views import APIView

from apps.core.views import DescargaArchivoMixin

from .excel_builder_listado import generar_listado_maestro_xlsx
from .models import Documento, VersionDocumento
from .serializers import DocumentoSerializer, VersionDocumentoSerializer


class DocumentoViewSet(DescargaArchivoMixin, viewsets.ModelViewSet):
    queryset = Documento.objects.select_related('propietario', 'aprobado_por').prefetch_related('versiones').all()
    serializer_class = DocumentoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['tipo', 'estado', 'propietario']
    search_fields = ['codigo', 'titulo']
    ordering_fields = ['codigo', 'fecha_aprobacion', 'fecha_proxima_revision']

    def perform_create(self, serializer):
        documento = serializer.save()
        # Deja registrada la versión inicial en el historial de control de versiones,
        # para que ningún documento arranque con un archivo "de la nada" sin trazabilidad.
        if documento.archivo:
            VersionDocumento.objects.create(
                documento=documento,
                version=documento.version_actual,
                fecha_version=timezone.localdate(),
                cambios='Versión inicial del documento.',
                archivo=documento.archivo,
                creado_por=self.request.user,
            )


class ListadoMaestroDocumentosView(APIView):
    """Genera y descarga el Listado Maestro de Documentos SGSI (FO institucional real,
    con una hoja por tipo de documento) a partir de los `Documento` actuales — se
    regenera en cada descarga, así que siempre refleja lo que haya guardado en ese
    momento, sin necesidad de mantener un archivo aparte actualizado a mano."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        buffer = generar_listado_maestro_xlsx()
        respuesta = HttpResponse(
            buffer.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        respuesta['Content-Disposition'] = 'attachment; filename="Listado_Maestro_de_Documentos_SGSI.xlsx"'
        return respuesta


class VersionDocumentoViewSet(DescargaArchivoMixin, viewsets.ModelViewSet):
    queryset = VersionDocumento.objects.select_related('documento', 'creado_por').all()
    serializer_class = VersionDocumentoSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['documento']
    ordering_fields = ['fecha_version', 'creado_en']

    def perform_create(self, serializer):
        version = serializer.save()
        # Registrar una nueva versión actualiza el documento a esa versión (y su archivo
        # vigente, si se adjuntó uno) — el control de versiones no debe requerir crear un
        # documento nuevo por cada revisión, solo sumar una fila a su propio historial.
        documento = version.documento
        documento.version_actual = version.version
        campos_actualizados = ['version_actual']
        if version.archivo:
            documento.archivo = version.archivo
            campos_actualizados.append('archivo')
        documento.save(update_fields=campos_actualizados)
