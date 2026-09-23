from django.urls import path

from .views_backup import EjecutarBackupView, EstadoBackupView

urlpatterns = [
    path('sistema/backups/', EstadoBackupView.as_view(), name='sistema-backups'),
    path('sistema/backups/ejecutar/', EjecutarBackupView.as_view(), name='sistema-backups-ejecutar'),
]
