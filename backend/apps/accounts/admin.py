from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import BitacoraAcceso, BitacoraAccion, Rol, Usuario, UsuarioRol


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    ordering = ['email']
    list_display = ['email', 'nombre_completo', 'area', 'is_active', 'is_staff']
    search_fields = ['email', 'nombre_completo']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Datos personales', {'fields': ('nombre_completo', 'cargo', 'area', 'telefono')}),
        ('Permisos', {
            'fields': (
                'is_active', 'is_staff', 'is_superuser', 'debe_cambiar_password',
                'groups', 'user_permissions',
            ),
        }),
        ('Fechas', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nombre_completo', 'password1', 'password2'),
        }),
    )


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'es_rol_sistema']
    search_fields = ['nombre']


@admin.register(UsuarioRol)
class UsuarioRolAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'rol', 'fecha_asignacion', 'asignado_por']
    autocomplete_fields = ['usuario', 'rol', 'asignado_por']


@admin.register(BitacoraAcceso)
class BitacoraAccesoAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'usuario', 'tipo_evento', 'ip_address']
    list_filter = ['tipo_evento']
    readonly_fields = [f.name for f in BitacoraAcceso._meta.fields]

    def has_add_permission(self, request):
        return False


@admin.register(BitacoraAccion)
class BitacoraAccionAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'usuario', 'modulo', 'accion', 'content_type']
    list_filter = ['modulo', 'accion']
    readonly_fields = [f.name for f in BitacoraAccion._meta.fields]

    def has_add_permission(self, request):
        return False
