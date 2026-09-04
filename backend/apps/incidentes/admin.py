from django.contrib import admin

from .models import ArchivoAdjuntoIncidente, Incidente


class ArchivoAdjuntoIncidenteInline(admin.TabularInline):
    model = ArchivoAdjuntoIncidente
    extra = 0


@admin.register(Incidente)
class IncidenteAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'fecha', 'hora', 'nombre_evento', 'tipo', 'responsable', 'registrado_por']
    list_filter = ['tipo']
    search_fields = ['codigo', 'nombre_evento', 'descripcion']
    autocomplete_fields = ['responsable', 'registrado_por']
    readonly_fields = ['codigo']
    inlines = [ArchivoAdjuntoIncidenteInline]
