from django.http import FileResponse, Http404
from rest_framework.decorators import action


class DescargaArchivoMixin:
    """Expone GET /<recurso>/<pk>/descargar/ para servir un FileField pasando por la
    misma autenticación y permisos del ViewSet (self.get_object() aplica
    check_permissions/check_object_permissions igual que list/retrieve).

    Sin esto, los archivos quedan accesibles por su URL de /media/ sin ningún control
    de acceso propio de la aplicación — cualquiera con el enlace (incluso sin sesión)
    podía descargarlos (ISO/IEC 27001:2022 Anexo A — A.8.3 restricción de acceso a la
    información, A.5.12 clasificación de la información).
    """

    campo_archivo = 'archivo'

    @action(detail=True, methods=['get'], url_path='descargar')
    def descargar(self, request, pk=None):
        instancia = self.get_object()
        archivo = getattr(instancia, self.campo_archivo)
        if not archivo:
            raise Http404('Este registro no tiene un archivo adjunto.')

        nombre = archivo.name.rsplit('/', 1)[-1]
        return FileResponse(archivo.open('rb'), as_attachment=True, filename=nombre)
