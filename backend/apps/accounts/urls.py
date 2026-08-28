from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    Activar2FAView,
    ActivarEmailOtpView,
    CambiarPasswordView,
    ConfirmarRecuperacionPasswordView,
    Desactivar2FAView,
    EnviarCodigoEmailActivacionView,
    MeView,
    ReenviarCodigoOtpView,
    RolViewSet,
    Setup2FAView,
    SgsiLogoutView,
    SgsiTokenObtainPairView,
    SgsiTokenRefreshView,
    SolicitarRecuperacionPasswordView,
    UsuarioRolViewSet,
    UsuarioViewSet,
    VerificarOtpView,
)

router = DefaultRouter()
router.register('usuarios', UsuarioViewSet, basename='usuario')
router.register('roles', RolViewSet, basename='rol')
router.register('usuario-roles', UsuarioRolViewSet, basename='usuariorol')

urlpatterns = [
    path('auth/token/', SgsiTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/verificar-otp/', VerificarOtpView.as_view(), name='token_verificar_otp'),
    path('auth/token/reenviar-otp/', ReenviarCodigoOtpView.as_view(), name='token_reenviar_otp'),
    path('auth/token/refresh/', SgsiTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', SgsiLogoutView.as_view(), name='logout'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/cambiar-password/', CambiarPasswordView.as_view(), name='cambiar_password'),
    path(
        'auth/password/solicitar/', SolicitarRecuperacionPasswordView.as_view(), name='password_recuperar_solicitar'
    ),
    path(
        'auth/password/confirmar/', ConfirmarRecuperacionPasswordView.as_view(), name='password_recuperar_confirmar'
    ),
    path('auth/2fa/setup/', Setup2FAView.as_view(), name='2fa_setup'),
    path('auth/2fa/activar/', Activar2FAView.as_view(), name='2fa_activar'),
    path('auth/2fa/email/enviar/', EnviarCodigoEmailActivacionView.as_view(), name='2fa_email_enviar'),
    path('auth/2fa/email/activar/', ActivarEmailOtpView.as_view(), name='2fa_email_activar'),
    path('auth/2fa/desactivar/', Desactivar2FAView.as_view(), name='2fa_desactivar'),
    path('', include(router.urls)),
]
