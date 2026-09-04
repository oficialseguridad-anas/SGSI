from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.accounts.views_admin import verificar_otp_admin

urlpatterns = [
    # Debe quedar antes de 'admin/' para que no la capture el catch-all del admin.
    path('admin/verificar-otp/', verificar_otp_admin, name='admin_verificar_otp'),
    path('admin/', admin.site.urls),
    path('api/v1/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.activos.urls')),
    path('api/v1/', include('apps.controles.urls')),
    path('api/v1/', include('apps.riesgos.urls')),
    path('api/v1/', include('apps.documentos.urls')),
    path('api/v1/', include('apps.indicadores.urls')),
    path('api/v1/', include('apps.objetivos.urls')),
    path('api/v1/', include('apps.auditorias.urls')),
    path('api/v1/', include('apps.incidentes.urls')),
]

# El explorador de la API (esquema OpenAPI + Swagger UI) revela la estructura completa
# de endpoints, campos y modelos: útil en desarrollo, pero innecesaria superficie de
# información para un atacante en producción (A.8.9 — minimizar exposición de
# configuración/diseño interno). Igual que la carpeta media/, se limita a DEBUG=True.
if settings.DEBUG:
    urlpatterns += [
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
