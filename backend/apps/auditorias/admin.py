from django import forms
from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe

from .models import ArchivoAdjuntoSeguimiento, Hallazgo, SeguimientoHallazgo, TipoHallazgo


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


@admin.register(TipoHallazgo)
class TipoHallazgoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre']
    search_fields = ['codigo', 'nombre']


class SeguimientoHallazgoInline(admin.TabularInline):
    model = SeguimientoHallazgo
    extra = 0


@admin.register(Hallazgo)
class HallazgoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'fecha_deteccion', 'lista_tipos', 'lista_procesos', 'estado']
    list_filter = ['tipos', 'procesos']
    search_fields = ['codigo', 'descripcion']
    autocomplete_fields = ['procesos', 'tipos', 'controles', 'numerales']
    inlines = [SeguimientoHallazgoInline]

    @admin.display(description='Tipo(s)')
    def lista_tipos(self, obj):
        return ', '.join(t.codigo for t in obj.tipos.all())

    @admin.display(description='Proceso(s)')
    def lista_procesos(self, obj):
        return ', '.join(p.nombre for p in obj.procesos.all())


@admin.register(ArchivoAdjuntoSeguimiento)
class ArchivoAdjuntoSeguimientoAdmin(admin.ModelAdmin):
    list_display = ['seguimiento', 'archivo', 'subido_en']
    autocomplete_fields = ['seguimiento']
    readonly_fields = ['subido_en']


class SeguimientoHallazgoAdminForm(forms.ModelForm):
    archivos_nuevos = CampoMultipleArchivos(
        required=False,
        label='Adjuntar evidencias de cierre',
        help_text='Puedes seleccionar uno o varios archivos a la vez.',
    )

    class Meta:
        model = SeguimientoHallazgo
        fields = '__all__'


@admin.register(SeguimientoHallazgo)
class SeguimientoHallazgoAdmin(admin.ModelAdmin):
    form = SeguimientoHallazgoAdminForm
    list_display = ['hallazgo', 'fecha_seguimiento', 'verificacion_eficacia', 'lista_responsables']
    list_filter = ['verificacion_eficacia']
    search_fields = ['hallazgo__codigo', 'avance_notas']
    autocomplete_fields = ['hallazgo', 'responsables']
    readonly_fields = ['archivos_existentes']
    fields = [
        'hallazgo', 'accion_correctiva', 'fecha_compromiso', 'responsables', 'fecha_seguimiento',
        'avance_notas', 'verificacion_eficacia', 'archivos_existentes', 'archivos_nuevos',
    ]

    @admin.display(description='Responsables')
    def lista_responsables(self, obj):
        return ', '.join(u.nombre_completo for u in obj.responsables.all())

    @admin.display(description='Evidencias ya adjuntas')
    def archivos_existentes(self, obj):
        if not obj or not obj.pk:
            return '(se podrán ver aquí después de guardar)'
        archivos = obj.archivos_adjuntos.all()
        if not archivos:
            return 'Ninguna evidencia adjunta todavía.'
        return mark_safe('<br>'.join(
            format_html('<a href="{}" target="_blank">{}</a>', a.archivo.url, a.archivo.name)
            for a in archivos
        ))

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        for archivo in form.cleaned_data.get('archivos_nuevos') or []:
            ArchivoAdjuntoSeguimiento.objects.create(seguimiento=obj, archivo=archivo)
