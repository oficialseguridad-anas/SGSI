from django.contrib import admin

from .models import PreguntaChecklistPersonas, RespuestaChecklistPersonas, RevisionPersonas


@admin.register(RevisionPersonas)
class RevisionPersonasAdmin(admin.ModelAdmin):
    list_display = ['fecha_revision', 'revisor', 'responsable_talento_humano', 'responsable_tecnologia']
    autocomplete_fields = ['revisor', 'responsable_talento_humano', 'responsable_tecnologia']
    search_fields = ['fecha_revision']


@admin.register(PreguntaChecklistPersonas)
class PreguntaChecklistPersonasAdmin(admin.ModelAdmin):
    list_display = ['control_codigo', 'numero', 'control_nombre', 'texto']
    list_filter = ['control_codigo']
    search_fields = ['control_codigo', 'texto']
    ordering = ['control_codigo', 'numero']


@admin.register(RespuestaChecklistPersonas)
class RespuestaChecklistPersonasAdmin(admin.ModelAdmin):
    list_display = ['revision', 'pregunta', 'resultado']
    list_filter = ['resultado']
    autocomplete_fields = ['revision', 'pregunta']
