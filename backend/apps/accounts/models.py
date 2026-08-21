from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser, Group
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.core.models import TimeStampedModel


class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('El superusuario debe tener is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True')
        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractUser):
    username = None
    email = models.EmailField('email', unique=True)
    nombre_completo = models.CharField(max_length=150)
    cargo = models.CharField(max_length=100, blank=True)
    area = models.CharField(max_length=100, blank=True)
    telefono = models.CharField(max_length=30, blank=True)
    debe_cambiar_password = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UsuarioManager()

    class Meta:
        verbose_name = 'usuario'
        verbose_name_plural = 'usuarios'

    def __str__(self):
        return self.email

    @property
    def roles(self):
        return Rol.objects.filter(usuario_roles__usuario=self)


class Rol(TimeStampedModel):
    grupo = models.OneToOneField(Group, on_delete=models.CASCADE, related_name='rol')
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    es_rol_sistema = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'rol'
        verbose_name_plural = 'roles'

    def __str__(self):
        return self.nombre


class UsuarioRol(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='usuario_roles')
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, related_name='usuario_roles')
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    asignado_por = models.ForeignKey(
        Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='roles_asignados'
    )

    class Meta:
        unique_together = ('usuario', 'rol')
        verbose_name = 'rol de usuario'
        verbose_name_plural = 'roles de usuario'

    def __str__(self):
        return f'{self.usuario} - {self.rol}'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.usuario.groups.add(self.rol.grupo)

    def delete(self, *args, **kwargs):
        usuario, grupo = self.usuario, self.rol.grupo
        super().delete(*args, **kwargs)
        usuario.groups.remove(grupo)


class BitacoraAcceso(models.Model):
    class TipoEvento(models.TextChoices):
        LOGIN = 'LOGIN', 'Inicio de sesión'
        LOGOUT = 'LOGOUT', 'Cierre de sesión'
        LOGIN_FALLIDO = 'LOGIN_FALLIDO', 'Intento fallido'

    usuario = models.ForeignKey(
        Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='accesos'
    )
    email_intentado = models.EmailField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)
    tipo_evento = models.CharField(max_length=20, choices=TipoEvento.choices)

    class Meta:
        verbose_name = 'registro de acceso'
        verbose_name_plural = 'bitácora de accesos'
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.tipo_evento} - {self.usuario or self.email_intentado} - {self.timestamp}'


class BitacoraAccion(models.Model):
    class Accion(models.TextChoices):
        CREATE = 'CREATE', 'Creación'
        UPDATE = 'UPDATE', 'Actualización'
        DELETE = 'DELETE', 'Eliminación'
        APPROVE = 'APPROVE', 'Aprobación'
        CLOSE = 'CLOSE', 'Cierre'

    usuario = models.ForeignKey(
        Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='acciones'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=64)
    content_object = GenericForeignKey('content_type', 'object_id')
    modulo = models.CharField(max_length=50)
    accion = models.CharField(max_length=20, choices=Accion.choices)
    detalle = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        verbose_name = 'registro de acción'
        verbose_name_plural = 'bitácora de acciones'
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.modulo}:{self.accion} - {self.usuario} - {self.timestamp}'
