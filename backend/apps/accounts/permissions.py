from rest_framework.permissions import BasePermission, SAFE_METHODS


class EsAdministrador(BasePermission):
    """Solo administradores (superusuarios) pueden gestionar usuarios y roles."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class PuedeVerUsuarios(BasePermission):
    """Leer (listar/ver) usuarios solo exige el permiso Django accounts.view_usuario —
    así se puede asignar a un grupo/rol (p.ej. para elegir el propietario de un riesgo
    o el responsable de un tratamiento) sin abrir la gestión completa de usuarios.
    Crear, editar o eliminar usuarios sigue reservado a superusuarios."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return request.user.has_perm('accounts.view_usuario')
        return request.user.is_superuser


class EsPropietarioOTienePermiso(BasePermission):
    """
    Permite la escritura si el usuario es el propietario del objeto (campo `propietario`)
    o si tiene el permiso Meta de bypass indicado en `bypass_permission` de la vista.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        bypass_permission = getattr(view, 'bypass_permission', None)
        if bypass_permission and request.user.has_perm(bypass_permission):
            return True

        propietario = getattr(obj, 'propietario', None)
        return propietario is not None and propietario == request.user
