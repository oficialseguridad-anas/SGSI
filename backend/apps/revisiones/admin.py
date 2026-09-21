from django.contrib import admin

from .models import (
    PreguntaChecklistFisicos,
    PreguntaChecklistOrganizacionales,
    PreguntaChecklistPersonas,
    PreguntaChecklistTecnologicos,
    RespuestaChecklistFisicos,
    RespuestaChecklistOrganizacionales,
    RespuestaChecklistPersonas,
    RespuestaChecklistTecnologicos,
    RevisionFisicos,
    RevisionOrganizacionales,
    RevisionPersonas,
    RevisionTecnologicos,
)


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


def registrar_categoria_anexo_a(modelo_revision, modelo_pregunta, modelo_respuesta):
    """Registra el mismo trío de ModelAdmin (Revisión / Pregunta / Respuesta) para una
    categoría del Anexo A — evita repetir 3 clases de admin por cada una de las 3
    categorías nuevas (Organizacionales, Físicos, Tecnológicos)."""

    @admin.register(modelo_revision)
    class RevisionAdmin(admin.ModelAdmin):
        list_display = ['fecha_revision', 'revisor', 'responsable', 'finalizada']
        autocomplete_fields = ['revisor', 'responsable']
        search_fields = ['fecha_revision']

    @admin.register(modelo_pregunta)
    class PreguntaAdmin(admin.ModelAdmin):
        list_display = ['control_codigo', 'numero', 'control_nombre', 'texto']
        list_filter = ['control_codigo']
        search_fields = ['control_codigo', 'texto']
        ordering = ['control_codigo', 'numero']

    @admin.register(modelo_respuesta)
    class RespuestaAdmin(admin.ModelAdmin):
        list_display = ['revision', 'pregunta', 'resultado']
        list_filter = ['resultado']
        autocomplete_fields = ['revision', 'pregunta']


registrar_categoria_anexo_a(RevisionOrganizacionales, PreguntaChecklistOrganizacionales, RespuestaChecklistOrganizacionales)
registrar_categoria_anexo_a(RevisionFisicos, PreguntaChecklistFisicos, RespuestaChecklistFisicos)
registrar_categoria_anexo_a(RevisionTecnologicos, PreguntaChecklistTecnologicos, RespuestaChecklistTecnologicos)
