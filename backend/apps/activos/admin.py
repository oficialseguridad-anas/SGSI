from django.contrib import admin

from .models import Activo, Direccion, Proceso


class DireccionInline(admin.TabularInline):
    model = Direccion
    extra = 0
    fields = ['codigo', 'nombre', 'descripcion']


@admin.register(Proceso)
class ProcesoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'total_direcciones']
    search_fields = ['nombre']
    inlines = [DireccionInline]

    @admin.display(description='Direcciones')
    def total_direcciones(self, obj):
        return obj.direcciones.count()


@admin.register(Direccion)
class DireccionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'proceso']
    list_filter = ['proceso']
    search_fields = ['codigo', 'nombre', 'proceso__nombre']
    autocomplete_fields = ['proceso']


@admin.register(Activo)
class ActivoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'nombre', 'proceso', 'direccion', 'tipo_activo', 'clase_activo', 'etiquetado',
        'criticidad', 'estado',
    ]
    list_filter = [
        'direccion__proceso', 'tipo_activo', 'clase_activo', 'naturaleza', 'etiquetado', 'estado',
        'contiene_datos_personales',
    ]
    search_fields = ['codigo', 'nombre', 'descripcion', 'propietario', 'custodio']
    autocomplete_fields = ['direccion']

    @admin.display(description='Proceso')
    def proceso(self, obj):
        return obj.proceso

    @admin.display(description='Criticidad')
    def criticidad(self, obj):
        return obj.criticidad.label
