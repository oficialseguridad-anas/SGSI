from django.contrib.auth.models import Group, Permission
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Empleado, Rol, Usuario, UsuarioRol


class EmpleadoSerializer(serializers.ModelSerializer):
    tiene_usuario = serializers.SerializerMethodField()

    class Meta:
        model = Empleado
        fields = ['id', 'nombre_completo', 'cargo', 'correo', 'activo', 'tiene_usuario', 'creado_en', 'actualizado_en']
        read_only_fields = ['id', 'creado_en', 'actualizado_en']

    def get_tiene_usuario(self, obj):
        return hasattr(obj, 'usuario') and obj.usuario is not None


class PermisoSerializer(serializers.ModelSerializer):
    app_label = serializers.CharField(source='content_type.app_label', read_only=True)
    modelo = serializers.CharField(source='content_type.model', read_only=True)

    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'app_label', 'modelo']


class RolSerializer(serializers.ModelSerializer):
    # Entrada: ids de Permission a asignar al Group que respalda este Rol — ver
    # create()/update() más abajo, donde se traducen a `grupo.permissions.set(...)`.
    permisos = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Permission.objects.all(), write_only=True, required=False,
    )
    # Salida: detalle legible de los permisos ya asignados (para marcar los checkboxes
    # correctos al editar un rol existente).
    permisos_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'descripcion', 'es_rol_sistema', 'permisos', 'permisos_detalle']
        read_only_fields = ['id', 'es_rol_sistema']

    def get_permisos_detalle(self, obj):
        permisos = obj.grupo.permissions.select_related('content_type').order_by(
            'content_type__app_label', 'content_type__model', 'codename',
        )
        return PermisoSerializer(permisos, many=True).data

    def create(self, validated_data):
        permisos = validated_data.pop('permisos', [])
        grupo = Group.objects.create(name=validated_data['nombre'])
        if permisos:
            grupo.permissions.set(permisos)
        return Rol.objects.create(grupo=grupo, **validated_data)

    def update(self, instance, validated_data):
        permisos = validated_data.pop('permisos', None)
        if permisos is not None:
            instance.grupo.permissions.set(permisos)
        nuevo_nombre = validated_data.get('nombre')
        if nuevo_nombre and nuevo_nombre != instance.grupo.name:
            instance.grupo.name = nuevo_nombre
            instance.grupo.save(update_fields=['name'])
        return super().update(instance, validated_data)


class UsuarioSerializer(serializers.ModelSerializer):
    roles = RolSerializer(many=True, read_only=True)
    # Entrada (edición): ids de Rol a asignar — se traduce a filas `UsuarioRol` reales
    # en update() más abajo (no basta con tocar `usuario.groups` directo, porque
    # `Usuario.roles` se calcula desde `UsuarioRol`, no desde `groups`).
    roles_ids = serializers.PrimaryKeyRelatedField(
        source='roles', many=True, queryset=Rol.objects.all(), write_only=True, required=False,
    )
    permisos_directos = PermisoSerializer(source='user_permissions', many=True, read_only=True)
    permisos_ids = serializers.PrimaryKeyRelatedField(
        source='user_permissions', many=True, queryset=Permission.objects.all(), write_only=True, required=False,
    )
    direccion_nombre = serializers.CharField(source='direccion.nombre', read_only=True, default=None)

    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'nombre_completo', 'cargo', 'direccion', 'direccion_nombre', 'telefono',
            'is_active', 'debe_cambiar_password', 'roles', 'roles_ids', 'permisos_directos', 'permisos_ids',
            'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']

    def update(self, instance, validated_data):
        roles_nuevos = validated_data.pop('roles', None)
        permisos_nuevos = validated_data.pop('user_permissions', None)
        instance = super().update(instance, validated_data)
        if roles_nuevos is not None:
            request = self.context.get('request')
            _sincronizar_roles(instance, roles_nuevos, asignado_por=request.user if request else None)
        if permisos_nuevos is not None:
            instance.user_permissions.set(permisos_nuevos)
        return instance


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    roles_ids = serializers.PrimaryKeyRelatedField(
        source='roles', many=True, queryset=Rol.objects.all(), write_only=True, required=False,
    )
    permisos_ids = serializers.PrimaryKeyRelatedField(
        source='user_permissions', many=True, queryset=Permission.objects.all(), write_only=True, required=False,
    )

    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'nombre_completo', 'cargo', 'direccion', 'telefono',
            'password', 'is_active', 'debe_cambiar_password', 'roles_ids', 'permisos_ids',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        roles = validated_data.pop('roles', [])
        permisos = validated_data.pop('user_permissions', [])
        usuario = Usuario.objects.create_user(password=password, **validated_data)
        if roles:
            request = self.context.get('request')
            _sincronizar_roles(usuario, roles, asignado_por=request.user if request else None)
        if permisos:
            usuario.user_permissions.set(permisos)
        return usuario


def _sincronizar_roles(usuario, roles_nuevos, asignado_por=None):
    """Crea/elimina filas `UsuarioRol` para que terminen siendo exactamente
    `roles_nuevos` — nunca se tocan `usuario.groups` directamente, eso ya lo hace
    `UsuarioRol.save()`/`.delete()` (ver models.py).

    Las eliminaciones se hacen instancia por instancia (`.delete()` en cada una), NO
    con un `.delete()` sobre el queryset filtrado: un `.delete()` de queryset hace un
    DELETE masivo en SQL y NO llama al `.delete()` sobreescrito del modelo — se perdía
    silenciosamente el `usuario.groups.remove(grupo)`, dejando al usuario con los
    permisos del rol aunque la fila `UsuarioRol` ya no existiera (bug real, detectado
    probando con datos reales, no solo revisando el código)."""
    actuales = set(usuario.usuario_roles.values_list('rol_id', flat=True))
    nuevos = {rol.id for rol in roles_nuevos}
    for rol_id in nuevos - actuales:
        UsuarioRol.objects.get_or_create(usuario=usuario, rol_id=rol_id, defaults={'asignado_por': asignado_por})
    for usuario_rol in usuario.usuario_roles.filter(rol_id__in=(actuales - nuevos)):
        usuario_rol.delete()


class UsuarioRolSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsuarioRol
        fields = ['id', 'usuario', 'rol', 'fecha_asignacion', 'asignado_por']
        read_only_fields = ['id', 'fecha_asignacion', 'asignado_por']


class MeSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    permisos = serializers.SerializerMethodField()
    direccion_nombre = serializers.CharField(source='direccion.nombre', read_only=True, default=None)

    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'nombre_completo', 'cargo', 'direccion_nombre',
            'is_superuser', 'is_staff', 'otp_habilitado', 'otp_metodo', 'debe_cambiar_password',
            'roles', 'permisos',
        ]

    def get_roles(self, obj):
        return list(obj.roles.values_list('nombre', flat=True))

    def get_permisos(self, obj):
        return sorted(obj.get_all_permissions())


class Setup2FASerializer(serializers.Serializer):
    secreto = serializers.CharField(read_only=True)
    otpauth_url = serializers.CharField(read_only=True)


class Activar2FASerializer(serializers.Serializer):
    codigo = serializers.CharField()


class Desactivar2FASerializer(serializers.Serializer):
    password = serializers.CharField()
    codigo = serializers.CharField()


class VerificarOtpSerializer(serializers.Serializer):
    otp_token = serializers.CharField()
    codigo = serializers.CharField()


class ActivarEmailOtpSerializer(serializers.Serializer):
    codigo = serializers.CharField()


class ReenviarCodigoOtpSerializer(serializers.Serializer):
    otp_token = serializers.CharField()


class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField()
    password_nueva = serializers.CharField()

    def validate_password_nueva(self, value):
        validate_password(value, user=self.context['usuario'])
        return value

    def validate(self, attrs):
        usuario = self.context['usuario']
        if not usuario.check_password(attrs['password_actual']):
            raise serializers.ValidationError({'password_actual': 'Contraseña actual incorrecta.'})
        return attrs


class SolicitarRecuperacionPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not Usuario.objects.filter(email__iexact=value, is_active=True).exists():
            raise serializers.ValidationError('Este correo no está registrado.')
        return value


class ConfirmarRecuperacionPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    codigo = serializers.CharField()
    password_nueva = serializers.CharField()

    def validate(self, attrs):
        try:
            usuario = Usuario.objects.get(email__iexact=attrs['email'], is_active=True)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError({'email': 'Este correo no está registrado.'})
        validate_password(attrs['password_nueva'], user=usuario)
        attrs['usuario'] = usuario
        return attrs
