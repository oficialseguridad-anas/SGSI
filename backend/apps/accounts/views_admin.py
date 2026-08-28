from django import forms
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.cache import never_cache

from . import otp as otp_utils
from .models import Usuario


class CodigoOtpForm(forms.Form):
    codigo = forms.CharField(label='Código de verificación', max_length=20)


@never_cache
@login_required(login_url='admin:login')
def verificar_otp_admin(request):
    """Segundo factor exigido por AdminOtpMiddleware antes de dejar entrar a /admin/."""
    usuario = request.user
    next_url = request.GET.get('next') or request.POST.get('next') or reverse('admin:index')
    if not url_has_allowed_host_and_scheme(next_url, allowed_hosts={request.get_host()}):
        next_url = reverse('admin:index')

    if not usuario.otp_habilitado:
        return redirect(next_url)

    if usuario.otp_metodo == Usuario.MetodoOtp.EMAIL and request.method == 'GET':
        if otp_utils.puede_reenviar_codigo_email(usuario):
            otp_utils.enviar_codigo_email(usuario, asunto='Tu código para entrar al panel de administración')

    error = None
    if request.method == 'POST':
        form = CodigoOtpForm(request.POST)
        if form.is_valid():
            if otp_utils.verificar_segundo_factor(usuario, form.cleaned_data['codigo']):
                request.session['admin_otp_verificado'] = True
                return redirect(next_url)
            error = 'Código de verificación inválido.'
    else:
        form = CodigoOtpForm()

    return render(
        request,
        'accounts/admin_otp.html',
        {
            'form': form,
            'error': error,
            'next': next_url,
            'metodo': usuario.otp_metodo,
            'usuario': usuario,
        },
    )
