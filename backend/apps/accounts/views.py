from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from . import otp as otp_utils
from .models import BitacoraAcceso, Rol, Usuario, UsuarioRol
from .permissions import EsAdministrador, PuedeVerUsuarios
from .serializers import (
    Activar2FASerializer,
    ActivarEmailOtpSerializer,
    CambiarPasswordSerializer,
    ConfirmarRecuperacionPasswordSerializer,
    Desactivar2FASerializer,
    MeSerializer,
    ReenviarCodigoOtpSerializer,
    RolSerializer,
    Setup2FASerializer,
    SolicitarRecuperacionPasswordSerializer,
    UsuarioCreateSerializer,
    UsuarioRolSerializer,
    UsuarioSerializer,
    VerificarOtpSerializer,
)


def _registrar_acceso(request, usuario, email_intentado, tipo_evento):
    BitacoraAcceso.objects.create(
        usuario=usuario,
        email_intentado=email_intentado,
        ip_address=request.META.get('REMOTE_ADDR') if request else None,
        user_agent=(request.META.get('HTTP_USER_AGENT', '')[:300] if request else ''),
        tipo_evento=tipo_evento,
    )


def _set_refresh_cookie(response, refresh):
    """Guarda el refresh token en una cookie httpOnly en vez de exponerlo en el cuerpo
    JSON — así un script inyectado por XSS no puede leerlo desde localStorage (A.8.24)."""
    response.set_cookie(
        settings.REFRESH_TOKEN_COOKIE,
        str(refresh),
        max_age=int(jwt_settings.REFRESH_TOKEN_LIFETIME.total_seconds()),
        path=settings.REFRESH_TOKEN_COOKIE_PATH,
        httponly=True,
        secure=settings.REFRESH_TOKEN_COOKIE_SECURE,
        samesite=settings.REFRESH_TOKEN_COOKIE_SAMESITE,
    )


def _clear_refresh_cookie(response):
    response.delete_cookie(
        settings.REFRESH_TOKEN_COOKIE,
        path=settings.REFRESH_TOKEN_COOKIE_PATH,
        samesite=settings.REFRESH_TOKEN_COOKIE_SAMESITE,
    )


class SgsiTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        request = self.context.get('request')
        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            # Credenciales incorrectas: se deja constancia igual que un fallo de OTP,
            # para poder detectar fuerza bruta / credential stuffing (A.8.15/A.8.16).
            _registrar_acceso(
                request, None, attrs.get(self.username_field, ''), BitacoraAcceso.TipoEvento.LOGIN_FALLIDO
            )
            raise

        if self.user.otp_habilitado:
            if self.user.otp_metodo == Usuario.MetodoOtp.EMAIL:
                otp_utils.enviar_codigo_email(self.user, asunto='Tu código para iniciar sesión')
            return {
                'requiere_otp': True,
                'metodo': self.user.otp_metodo,
                'otp_token': otp_utils.firmar_token_pendiente(self.user),
            }

        _registrar_acceso(request, self.user, self.user.email, BitacoraAcceso.TipoEvento.LOGIN)
        return data


class SgsiTokenObtainPairView(TokenObtainPairView):
    serializer_class = SgsiTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        refresh = response.data.pop('refresh', None)
        if refresh:
            _set_refresh_cookie(response, refresh)
        return response


class VerificarOtpView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = VerificarOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = otp_utils.resolver_token_pendiente(serializer.validated_data['otp_token'])
        if user_id is None:
            return Response(
                {'detail': 'El token de verificación no es válido o expiró. Inicia sesión de nuevo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario = Usuario.objects.filter(pk=user_id, is_active=True).first()
        if usuario is None:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_400_BAD_REQUEST)

        if not otp_utils.verificar_segundo_factor(usuario, serializer.validated_data['codigo']):
            _registrar_acceso(request, usuario, usuario.email, BitacoraAcceso.TipoEvento.LOGIN_FALLIDO)
            return Response({'detail': 'Código de verificación inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        refresh = SgsiTokenObtainPairSerializer.get_token(usuario)
        _registrar_acceso(request, usuario, usuario.email, BitacoraAcceso.TipoEvento.LOGIN)
        response = Response({'access': str(refresh.access_token)})
        _set_refresh_cookie(response, refresh)
        return response


class ReenviarCodigoOtpView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = ReenviarCodigoOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = otp_utils.resolver_token_pendiente(serializer.validated_data['otp_token'])
        usuario = Usuario.objects.filter(pk=user_id, is_active=True).first() if user_id else None
        if usuario is None:
            return Response(
                {'detail': 'El token de verificación no es válido o expiró. Inicia sesión de nuevo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if usuario.otp_metodo != Usuario.MetodoOtp.EMAIL:
            return Response(
                {'detail': 'Esta cuenta no usa verificación por correo.'}, status=status.HTTP_400_BAD_REQUEST
            )
        if not otp_utils.puede_reenviar_codigo_email(usuario):
            return Response(
                {'detail': 'Espera unos segundos antes de solicitar otro código.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        otp_utils.enviar_codigo_email(usuario, asunto='Tu código para iniciar sesión')
        return Response(status=status.HTTP_204_NO_CONTENT)


class SgsiTokenRefreshView(APIView):
    """Como TokenRefreshView, pero lee el refresh token de la cookie httpOnly en vez
    de pedirlo en el body — el frontend nunca tiene el valor para poder mandarlo."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'token_refresh'

    def post(self, request):
        token = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE)
        if not token:
            return Response({'detail': 'No hay sesión activa.'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = TokenRefreshSerializer(data={'refresh': token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            response = Response(
                {'detail': 'La sesión expiró. Inicia sesión de nuevo.'}, status=status.HTTP_401_UNAUTHORIZED
            )
            _clear_refresh_cookie(response)
            return response

        data = dict(serializer.validated_data)
        nuevo_refresh = data.pop('refresh', None)
        response = Response(data)
        if nuevo_refresh:
            _set_refresh_cookie(response, nuevo_refresh)
        return response


class SgsiLogoutView(APIView):
    """Invalida el refresh token (lista negra) y limpia la cookie. No exige estar
    autenticado: si el access token ya expiró, igual debe poder cerrar la sesión."""

    permission_classes = [AllowAny]

    def post(self, request):
        token = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        if token:
            try:
                RefreshToken(token).blacklist()
            except TokenError:
                pass
        _clear_refresh_cookie(response)
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class CambiarPasswordView(APIView):
    """Cambio de contraseña por el propio usuario — usado tanto para el cambio
    obligatorio en el primer inicio de sesión (debe_cambiar_password) como para un
    cambio voluntario posterior."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = CambiarPasswordSerializer(data=request.data, context={'usuario': request.user})
        serializer.is_valid(raise_exception=True)

        usuario = request.user
        usuario.set_password(serializer.validated_data['password_nueva'])
        usuario.debe_cambiar_password = False
        usuario.save(update_fields=['password', 'debe_cambiar_password'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class SolicitarRecuperacionPasswordView(APIView):
    """Paso 1 de "olvidé mi contraseña": recibe el correo, confirma que esté
    registrado y le envía un código de un solo uso para continuar."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = SolicitarRecuperacionPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario = Usuario.objects.get(email__iexact=serializer.validated_data['email'], is_active=True)
        if not otp_utils.puede_reenviar_codigo_password(usuario):
            return Response(
                {'detail': 'Espera unos segundos antes de solicitar otro código.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        otp_utils.enviar_codigo_recuperacion_password(usuario)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ConfirmarRecuperacionPasswordView(APIView):
    """Paso 2: valida el código enviado por correo y fija la contraseña nueva."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = ConfirmarRecuperacionPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario = serializer.validated_data['usuario']
        if not otp_utils.verificar_codigo_recuperacion_password(usuario, serializer.validated_data['codigo']):
            return Response({'detail': 'Código de verificación inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        usuario.set_password(serializer.validated_data['password_nueva'])
        usuario.debe_cambiar_password = False
        usuario.save(update_fields=['password', 'debe_cambiar_password'])
        _registrar_acceso(request, usuario, usuario.email, BitacoraAcceso.TipoEvento.LOGIN)
        return Response(status=status.HTTP_204_NO_CONTENT)


class Setup2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Si ya hay un secreto pendiente de confirmar, se reutiliza para no invalidar
        # un QR que el usuario ya haya escaneado (p.ej. si recarga la página o hace
        # doble clic antes de confirmar).
        if request.user.otp_secreto and not request.user.otp_habilitado:
            secreto = request.user.otp_secreto
        else:
            secreto = otp_utils.generar_secreto()
            request.user.otp_secreto = secreto
            request.user.otp_habilitado = False
            request.user.save(update_fields=['otp_secreto', 'otp_habilitado'])
        data = {
            'secreto': secreto,
            'otpauth_url': otp_utils.uri_aprovisionamiento(request.user, secreto),
        }
        return Response(Setup2FASerializer(data).data)


class Activar2FAView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = Activar2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario = request.user
        if not usuario.otp_secreto:
            return Response(
                {'detail': 'Primero debes iniciar la configuración del segundo factor.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not otp_utils.verificar_codigo_totp(usuario.otp_secreto, serializer.validated_data['codigo']):
            return Response({'detail': 'Código de verificación inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        usuario.otp_habilitado = True
        usuario.otp_metodo = Usuario.MetodoOtp.APP
        usuario.save(update_fields=['otp_habilitado', 'otp_metodo'])
        codigos_recuperacion = otp_utils.generar_codigos_recuperacion(usuario)
        return Response({'codigos_recuperacion': codigos_recuperacion})


class EnviarCodigoEmailActivacionView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        if not otp_utils.puede_reenviar_codigo_email(request.user):
            return Response(
                {'detail': 'Espera unos segundos antes de solicitar otro código.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        otp_utils.enviar_codigo_email(request.user, asunto='Activa el doble factor por correo')
        return Response(status=status.HTTP_204_NO_CONTENT)


class ActivarEmailOtpView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = ActivarEmailOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario = request.user
        if not otp_utils.verificar_codigo_email(usuario, serializer.validated_data['codigo']):
            return Response({'detail': 'Código de verificación inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        usuario.otp_habilitado = True
        usuario.otp_metodo = Usuario.MetodoOtp.EMAIL
        usuario.otp_secreto = ''
        usuario.save(update_fields=['otp_habilitado', 'otp_metodo', 'otp_secreto'])
        codigos_recuperacion = otp_utils.generar_codigos_recuperacion(usuario)
        return Response({'codigos_recuperacion': codigos_recuperacion})


class Desactivar2FAView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = Desactivar2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario = request.user
        if not usuario.check_password(serializer.validated_data['password']):
            return Response({'detail': 'Contraseña incorrecta.'}, status=status.HTTP_400_BAD_REQUEST)
        if not otp_utils.verificar_segundo_factor(usuario, serializer.validated_data['codigo']):
            return Response({'detail': 'Código de verificación inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        usuario.otp_secreto = ''
        usuario.otp_habilitado = False
        usuario.save(update_fields=['otp_secreto', 'otp_habilitado'])
        usuario.codigos_recuperacion_otp.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by('email')
    permission_classes = [PuedeVerUsuarios]
    filterset_fields = ['is_active', 'direccion']
    search_fields = ['email', 'nombre_completo', 'cargo', 'direccion__nombre']
    ordering_fields = ['email', 'date_joined']

    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCreateSerializer
        return UsuarioSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pk == request.user.pk:
            return Response(
                {'detail': 'No puedes eliminar tu propio usuario.'}, status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all().order_by('nombre')
    serializer_class = RolSerializer
    permission_classes = [EsAdministrador]
    search_fields = ['nombre']


class UsuarioRolViewSet(viewsets.ModelViewSet):
    queryset = UsuarioRol.objects.select_related('usuario', 'rol').all()
    serializer_class = UsuarioRolSerializer
    permission_classes = [EsAdministrador]
    filterset_fields = ['usuario', 'rol']

    def perform_create(self, serializer):
        serializer.save(asignado_por=self.request.user)
