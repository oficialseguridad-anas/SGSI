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
    nombre_completo = models.CharField(max_length=150, db_column='nombreCompleto')
    cargo = models.CharField(max_length=100, blank=True)
    direccion = models.ForeignKey(
        'activos.Direccion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios',
        verbose_name='Dirección',
        db_column='direccionId',
    )
    telefono = models.CharField(max_length=30, blank=True)
    debe_cambiar_password = models.BooleanField(default=False, db_column='debeCambiarPassword')

    class MetodoOtp(models.TextChoices):
        APP = 'APP', 'Aplicación de autenticación'
        EMAIL = 'EMAIL', 'Correo electrónico'

    otp_secreto = models.CharField(max_length=32, blank=True, db_column='otpSecreto')
    otp_habilitado = models.BooleanField(default=False, db_column='otpHabilitado')
    otp_metodo = models.CharField(
        max_length=10, choices=MetodoOtp.choices, default=MetodoOtp.APP, db_column='otpMetodo'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UsuarioManager()

    class Meta:
        verbose_name = 'usuario'
        verbose_name_plural = 'usuarios'
        db_table = 'usuario'

    def __str__(self):
        return self.email

    @property
    def roles(self):
        return Rol.objects.filter(usuario_roles__usuario=self)


class Rol(TimeStampedModel):
    grupo = models.OneToOneField(Group, on_delete=models.CASCADE, related_name='rol', db_column='grupoId')
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    es_rol_sistema = models.BooleanField(default=False, db_column='esRolSistema')

    class Meta:
        verbose_name = 'rol'
        verbose_name_plural = 'roles'
        db_table = 'rol'

    def __str__(self):
        return self.nombre


class UsuarioRol(models.Model):
    usuario = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, related_name='usuario_roles', db_column='usuarioId'
    )
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, related_name='usuario_roles', db_column='rolId')
    fecha_asignacion = models.DateTimeField(auto_now_add=True, db_column='fechaAsignacion')
    asignado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='roles_asignados',
        db_column='asignadoPorId',
    )

    class Meta:
        unique_together = ('usuario', 'rol')
        verbose_name = 'rol de usuario'
        verbose_name_plural = 'roles de usuario'
        db_table = 'usuarioRol'

    def __str__(self):
        return f'{self.usuario} - {self.rol}'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.usuario.groups.add(self.rol.grupo)

    def delete(self, *args, **kwargs):
        usuario, grupo = self.usuario, self.rol.grupo
        super().delete(*args, **kwargs)
        usuario.groups.remove(grupo)


class CodigoRecuperacionOtp(models.Model):
    usuario = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, related_name='codigos_recuperacion_otp', db_column='usuarioId'
    )
    codigo_hash = models.CharField(max_length=128, db_column='codigoHash')
    usado = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True, db_column='creadoEn')
    usado_en = models.DateTimeField(null=True, blank=True, db_column='usadoEn')

    class Meta:
        verbose_name = 'código de recuperación OTP'
        verbose_name_plural = 'códigos de recuperación OTP'
        db_table = 'codigoRecuperacionOtp'

    def __str__(self):
        return f'{self.usuario} - {"usado" if self.usado else "disponible"}'


class CodigoOtpCorreo(models.Model):
    usuario = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, related_name='codigos_otp_correo', db_column='usuarioId'
    )
    codigo_hash = models.CharField(max_length=128, db_column='codigoHash')
    expira_en = models.DateTimeField(db_column='expiraEn')
    usado = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True, db_column='creadoEn')

    class Meta:
        verbose_name = 'código OTP por correo'
        verbose_name_plural = 'códigos OTP por correo'
        ordering = ['-creado_en']
        db_table = 'codigoOtpCorreo'

    def __str__(self):
        return f'{self.usuario} - {"usado" if self.usado else "vigente"}'


class BitacoraAcceso(models.Model):
    class TipoEvento(models.TextChoices):
        LOGIN = 'LOGIN', 'Inicio de sesión'
        LOGOUT = 'LOGOUT', 'Cierre de sesión'
        LOGIN_FALLIDO = 'LOGIN_FALLIDO', 'Intento fallido'

    usuario = models.ForeignKey(
        Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='accesos', db_column='usuarioId'
    )
    email_intentado = models.EmailField(blank=True, db_column='emailIntentado')
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True, db_column='ipAddress')
    user_agent = models.CharField(max_length=300, blank=True, db_column='userAgent')
    tipo_evento = models.CharField(max_length=20, choices=TipoEvento.choices, db_column='tipoEvento')

    class Meta:
        verbose_name = 'registro de acceso'
        verbose_name_plural = 'bitácora de accesos'
        ordering = ['-timestamp']
        db_table = 'bitacoraAcceso'

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
        Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='acciones', db_column='usuarioId'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, db_column='contentTypeId')
    object_id = models.CharField(max_length=64, db_column='objectId')
    content_object = GenericForeignKey('content_type', 'object_id')
    modulo = models.CharField(max_length=50)
    accion = models.CharField(max_length=20, choices=Accion.choices)
    detalle = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True, db_column='ipAddress')

    class Meta:
        verbose_name = 'registro de acción'
        verbose_name_plural = 'bitácora de acciones'
        ordering = ['-timestamp']
        db_table = 'bitacoraAccion'

    def __str__(self):
        return f'{self.modulo}:{self.accion} - {self.usuario} - {self.timestamp}'
