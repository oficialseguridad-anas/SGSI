from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ArchivoAdjuntoSeguimientoViewSet,
    AuditoriaViewSet,
    HallazgoViewSet,
    ItemVerificacionAuditoriaViewSet,
    MatrizPriorizacionAuditoriaViewSet,
    OportunidadPlanAuditoriaViewSet,
    PlantillaInformeAuditoriaView,
    PlantillaPlanAuditoriaView,
    ProgramaAuditoriaViewSet,
    RiesgoPlanAuditoriaViewSet,
    SeguimientoHallazgoViewSet,
    SesionAuditoriaViewSet,
    TipoHallazgoViewSet,
)

router = DefaultRouter()
router.register('hallazgos', HallazgoViewSet, basename='hallazgo')
router.register('tipos-hallazgo', TipoHallazgoViewSet, basename='tipohallazgo')
router.register('seguimientos-hallazgo', SeguimientoHallazgoViewSet, basename='seguimientohallazgo')
router.register('archivos-adjuntos-seguimiento', ArchivoAdjuntoSeguimientoViewSet, basename='archivoadjuntoseguimiento')
router.register('matriz-priorizacion-auditoria', MatrizPriorizacionAuditoriaViewSet, basename='matrizpriorizacionauditoria')
router.register('programa-auditoria', ProgramaAuditoriaViewSet, basename='programaauditoria')
router.register('auditorias', AuditoriaViewSet, basename='auditoria')
router.register('riesgos-plan-auditoria', RiesgoPlanAuditoriaViewSet, basename='riesgoplanauditoria')
router.register('oportunidades-plan-auditoria', OportunidadPlanAuditoriaViewSet, basename='oportunidadplanauditoria')
router.register('sesiones-auditoria', SesionAuditoriaViewSet, basename='sesionauditoria')
router.register('items-verificacion-auditoria', ItemVerificacionAuditoriaViewSet, basename='itemverificacionauditoria')

urlpatterns = router.urls + [
    path('auditorias-plantillas/plan/', PlantillaPlanAuditoriaView.as_view(), name='plantilla-plan-auditoria'),
    path('auditorias-plantillas/informe/', PlantillaInformeAuditoriaView.as_view(), name='plantilla-informe-auditoria'),
]
