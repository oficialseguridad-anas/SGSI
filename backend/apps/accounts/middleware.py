from django.shortcuts import redirect
from django.urls import reverse


class AdminOtpMiddleware:
    """Exige el segundo factor también para entrar a /admin/.

    El panel de Django usa su propio login (usuario + contraseña) y no pasa por el
    flujo de OTP del resto de la aplicación: un superusuario con 2FA activado en la
    app podía entrar a /admin/ con solo su contraseña, sorteando por completo esa capa
    (ISO/IEC 27001:2022 Anexo A — A.8.5, autenticación segura). Este middleware
    intercepta cualquier vista de /admin/ una vez que Django ya autenticó la sesión por
    contraseña, y si el usuario tiene otp_habilitado, exige el mismo segundo factor
    (TOTP, correo o código de recuperación) antes de dejarlo continuar.
    """

    RUTAS_EXENTAS = ('/admin/login/', '/admin/logout/')
    PREFIJO_VERIFICAR_OTP = '/admin/verificar-otp/'

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        redireccion = self._exigir_otp(request)
        if redireccion:
            return redireccion
        return self.get_response(request)

    def _exigir_otp(self, request):
        if not request.path.startswith('/admin/'):
            return None
        if request.path in self.RUTAS_EXENTAS or request.path.startswith(self.PREFIJO_VERIFICAR_OTP):
            return None

        usuario = request.user
        if not usuario.is_authenticated:
            return None  # Django admin se encarga de pedir login.
        if not getattr(usuario, 'otp_habilitado', False):
            return None  # Cuenta sin 2FA activado: nada nuevo que exigir aquí.
        if request.session.get('admin_otp_verificado'):
            return None

        return redirect(f'{reverse("admin_verificar_otp")}?next={request.path}')
