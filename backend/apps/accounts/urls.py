from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView

from .views import MeView, RolViewSet, SgsiTokenObtainPairView, UsuarioRolViewSet, UsuarioViewSet

router = DefaultRouter()
router.register('usuarios', UsuarioViewSet, basename='usuario')
router.register('roles', RolViewSet, basename='rol')
router.register('usuario-roles', UsuarioRolViewSet, basename='usuariorol')

urlpatterns = [
    path('auth/token/', SgsiTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/blacklist/', TokenBlacklistView.as_view(), name='token_blacklist'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('', include(router.urls)),
]
