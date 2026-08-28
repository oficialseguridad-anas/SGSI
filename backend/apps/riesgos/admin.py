from django import forms
from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe

from .models import ArchivoAdjuntoTratamiento, Amenaza, Riesgo, TratamientoRiesgo


class EntradaMultipleArchivos(forms.ClearableFileInput):
    allow_multiple_selected = True


class CampoMultipleArchivos(forms.FileField):
    """Permite seleccionar y subir varios archivos a la vez en un solo campo."""

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('widget', EntradaMultipleArchivos())
        super().__init__(*args, **kwargs)

    def clean(self, data, initial=None):
        if isinstance(data, (list, tuple)):
            return [super(CampoMultipleArchivos, self).clean(d, initial) for d in data]
        return super().clean(data, initial)


@admin.register(Amenaza)
class AmenazaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'origen']
    list_filter = ['origen']
    search_fields = ['nombre']


class TratamientoRiesgoInline(admin.TabularInline):
    model = TratamientoRiesgo
    extra = 0
    autocomplete_fields = ['responsables']


@admin.register(Riesgo)
class RiesgoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'lista_activos', 'amenaza', 'riesgo_inherente', 'nivel_de_riesgo_display',
        'esta_activo', 'lista_propietarios',
    ]
    list_filter = ['esta_activo', 'amenaza']
    search_fields = ['codigo', 'descripcion', 'activos__nombre']
    autocomplete_fields = ['activos', 'amenaza', 'propietarios_riesgo', 'controles']
    readonly_fields = ['riesgo_inherente']
    inlines = [TratamientoRiesgoInline]

    @admin.display(description='Activos afectados')
    def lista_activos(self, obj):
        return ', '.join(a.codigo for a in obj.activos.all())

    @admin.display(description='Propietarios del riesgo')
    def lista_propietarios(self, obj):
        return ', '.join(u.nombre_completo for u in obj.propietarios_riesgo.all())

    @admin.display(description='Nivel de riesgo')
    def nivel_de_riesgo_display(self, obj):
        return obj.nivel_de_riesgo.label


@admin.register(ArchivoAdjuntoTratamiento)
class ArchivoAdjuntoTratamientoAdmin(admin.ModelAdmin):
    list_display = ['tratamiento', 'archivo', 'subido_en']
    autocomplete_fields = ['tratamiento']
    readonly_fields = ['subido_en']


class TratamientoRiesgoAdminForm(forms.ModelForm):
    archivos_nuevos = CampoMultipleArchivos(
        required=False,
        label='Adjuntar evidencias',
        help_text='Puedes seleccionar uno o varios archivos a la vez.',
    )

    class Meta:
        model = TratamientoRiesgo
        fields = '__all__'


@admin.register(TratamientoRiesgo)
class TratamientoRiesgoAdmin(admin.ModelAdmin):
    form = TratamientoRiesgoAdminForm
    list_display = ['riesgo', 'opcion', 'estado', 'lista_responsables', 'fecha_limite']
    list_filter = ['opcion']
    search_fields = ['riesgo__codigo', 'descripcion']
    autocomplete_fields = ['riesgo', 'responsables']
    readonly_fields = ['archivos_existentes', 'riesgo_residual', 'nivel_de_riesgo_residual_display', 'estado']
    fields = [
        'riesgo', 'opcion', 'descripcion', 'accion_mitigacion', 'recursos_necesarios',
        'responsables', 'fecha_limite', 'fecha_cierre', 'fecha_proximo_seguimiento',
        'evidencias_esperadas', 'archivos_existentes', 'archivos_nuevos',
        'probabilidad_residual', 'impacto_residual', 'riesgo_residual', 'nivel_de_riesgo_residual_display',
        'estado',
    ]

    @admin.display(description='Responsables')
    def lista_responsables(self, obj):
        return ', '.join(u.nombre_completo for u in obj.responsables.all())

    @admin.display(description='Nivel de riesgo residual')
    def nivel_de_riesgo_residual_display(self, obj):
        nivel = obj.nivel_de_riesgo_residual if obj and obj.pk else None
        return nivel.label if nivel else '—'

    @admin.display(description='Archivos ya adjuntos')
    def archivos_existentes(self, obj):
        if not obj or not obj.pk:
            return '(se podrán ver aquí después de guardar)'
        archivos = obj.archivos_adjuntos.all()
        if not archivos:
            return 'Ningún archivo adjunto todavía.'
        return mark_safe('<br>'.join(
            format_html('<a href="{}" target="_blank">{}</a>', a.archivo.url, a.archivo.name)
            for a in archivos
        ))

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        for archivo in form.cleaned_data.get('archivos_nuevos') or []:
            ArchivoAdjuntoTratamiento.objects.create(tratamiento=obj, archivo=archivo)
