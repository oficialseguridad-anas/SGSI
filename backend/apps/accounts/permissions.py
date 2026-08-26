from rest_framework.permissions import BasePermission, SAFE_METHODS


class EsAdministrador(BasePermission):
    """Solo administradores (superusuarios) pueden gestionar usuarios y roles."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


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
