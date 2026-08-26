from django.contrib import admin

from .models import ActividadObjetivo, ArchivoAdjuntoActividad, Objetivo


@admin.register(Objetivo)
class ObjetivoAdmin(admin.ModelAdmin):
    list_display = ['__str__']
    search_fields = ['objetivo', 'componente_politica', 'responsables_seguimiento']
    filter_horizontal = ['procesos_asociados', 'indicadores']


@admin.register(ActividadObjetivo)
class ActividadObjetivoAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'objetivo', 'estado_ejecucion', 'plazo']
    list_filter = ['objetivo']
    search_fields = ['actividad', 'responsables']


@admin.register(ArchivoAdjuntoActividad)
class ArchivoAdjuntoActividadAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'actividad', 'subido_en']
