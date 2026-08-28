from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Rol, Usuario, UsuarioRol


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'descripcion', 'es_rol_sistema']


class UsuarioSerializer(serializers.ModelSerializer):
    roles = RolSerializer(many=True, read_only=True)
    direccion_nombre = serializers.CharField(source='direccion.nombre', read_only=True, default=None)

    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'nombre_completo', 'cargo', 'direccion', 'direccion_nombre', 'telefono',
            'is_active', 'debe_cambiar_password', 'roles', 'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'nombre_completo', 'cargo', 'direccion', 'telefono',
            'password', 'is_active', 'debe_cambiar_password',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        return Usuario.objects.create_user(password=password, **validated_data)


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
