from django.contrib import admin

from .models import Documento, VersionDocumento


class VersionDocumentoInline(admin.TabularInline):
    model = VersionDocumento
    extra = 0
    autocomplete_fields = ['creado_por']


@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'titulo', 'tipo', 'estado', 'version_actual', 'propietario']
    list_filter = ['tipo', 'estado']
    search_fields = ['codigo', 'titulo', 'descripcion']
    autocomplete_fields = ['propietario', 'aprobado_por']
    inlines = [VersionDocumentoInline]


@admin.register(VersionDocumento)
class VersionDocumentoAdmin(admin.ModelAdmin):
    list_display = ['documento', 'version', 'creado_por', 'creado_en']
    autocomplete_fields = ['documento', 'creado_por']
