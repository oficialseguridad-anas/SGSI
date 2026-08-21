from rest_framework import viewsets
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import BitacoraAcceso, Rol, Usuario, UsuarioRol
from .serializers import (
    MeSerializer,
    RolSerializer,
    UsuarioCreateSerializer,
    UsuarioRolSerializer,
    UsuarioSerializer,
)


class SgsiTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        request = self.context.get('request')
        BitacoraAcceso.objects.create(
            usuario=self.user,
            email_intentado=self.user.email,
            ip_address=request.META.get('REMOTE_ADDR') if request else None,
            user_agent=(request.META.get('HTTP_USER_AGENT', '')[:300] if request else ''),
            tipo_evento=BitacoraAcceso.TipoEvento.LOGIN,
        )
        return data


class SgsiTokenObtainPairView(TokenObtainPairView):
    serializer_class = SgsiTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by('email')
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['is_active']
    search_fields = ['email', 'nombre_completo', 'area', 'cargo']
    ordering_fields = ['email', 'date_joined']

    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCreateSerializer
        return UsuarioSerializer


class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all().order_by('nombre')
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    search_fields = ['nombre']


class UsuarioRolViewSet(viewsets.ModelViewSet):
    queryset = UsuarioRol.objects.select_related('usuario', 'rol').all()
    serializer_class = UsuarioRolSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filterset_fields = ['usuario', 'rol']

    def perform_create(self, serializer):
        serializer.save(asignado_por=self.request.user)
