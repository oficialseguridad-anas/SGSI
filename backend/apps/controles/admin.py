from django.contrib import admin

from .models import AplicabilidadControl, Control, NumeralNorma


@admin.register(Control)
class ControlAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'categoria']
    list_filter = ['categoria']
    search_fields = ['codigo', 'nombre']

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(NumeralNorma)
class NumeralNormaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'capitulo']
    list_filter = ['capitulo']
    search_fields = ['codigo', 'nombre']

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(AplicabilidadControl)
class AplicabilidadControlAdmin(admin.ModelAdmin):
    list_display = ['control', 'aplica', 'estado_implementacion']
    list_filter = ['aplica', 'estado_implementacion', 'control__categoria']
    search_fields = ['control__codigo', 'control__nombre']
    autocomplete_fields = ['control']
