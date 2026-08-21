from rest_framework import serializers

from .models import Rol, Usuario, UsuarioRol


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'descripcion', 'es_rol_sistema']


class UsuarioSerializer(serializers.ModelSerializer):
    roles = RolSerializer(many=True, read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'nombre_completo', 'cargo', 'area', 'telefono',
            'is_active', 'debe_cambiar_password', 'roles', 'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'nombre_completo', 'cargo', 'area', 'telefono',
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

    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'nombre_completo', 'cargo', 'area',
            'is_superuser', 'is_staff', 'roles', 'permisos',
        ]

    def get_roles(self, obj):
        return list(obj.roles.values_list('nombre', flat=True))

    def get_permisos(self, obj):
        return sorted(obj.get_all_permissions())
