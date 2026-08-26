from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView

from .views import (
    Activar2FAView,
    ActivarEmailOtpView,
    Desactivar2FAView,
    EnviarCodigoEmailActivacionView,
    MeView,
    ReenviarCodigoOtpView,
    RolViewSet,
    Setup2FAView,
    SgsiTokenObtainPairView,
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
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/blacklist/', TokenBlacklistView.as_view(), name='token_blacklist'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/2fa/setup/', Setup2FAView.as_view(), name='2fa_setup'),
    path('auth/2fa/activar/', Activar2FAView.as_view(), name='2fa_activar'),
    path('auth/2fa/email/enviar/', EnviarCodigoEmailActivacionView.as_view(), name='2fa_email_enviar'),
    path('auth/2fa/email/activar/', ActivarEmailOtpView.as_view(), name='2fa_email_activar'),
    path('auth/2fa/desactivar/', Desactivar2FAView.as_view(), name='2fa_desactivar'),
    path('', include(router.urls)),
]
