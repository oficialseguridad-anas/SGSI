from django.contrib import admin

from .models import Indicador, SeguimientoIndicador


@admin.register(Indicador)
class IndicadorAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo', 'frecuencia', 'meta']
    list_filter = ['tipo', 'frecuencia']
    search_fields = ['codigo', 'nombre', 'objetivo', 'descripcion']


@admin.register(SeguimientoIndicador)
class SeguimientoIndicadorAdmin(admin.ModelAdmin):
    list_display = ['indicador', 'periodo', 'fecha_cargue', 'resultado']
    list_filter = ['indicador__tipo']
    search_fields = ['indicador__codigo', 'indicador__nombre', 'periodo']
    autocomplete_fields = ['indicador']
