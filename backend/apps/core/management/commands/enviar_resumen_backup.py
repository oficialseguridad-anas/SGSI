"""Envía por correo un resumen del backup más reciente (base de datos, media y
código de la aplicación).

Se invoca desde dos lugares:
- `backend/scripts/backup_sgsi.ps1`, al final de cada corrida (manual o por la Tarea
  Programada de Windows de las 2 a.m.), vía `manage.py enviar_resumen_backup`.
- `apps.core.views_backup.EjecutarBackupView`, justo después de correr el script
  desde el botón "Ejecutar backup ahora" del frontend (llamado en el mismo proceso
  con `call_command`, sin volver a lanzar un subproceso).

No dispara el backup en sí — solo reporta el estado de los archivos que ya están en
`backend/backups/`. Si no logra enviar el correo (SMTP caído, credenciales
inválidas), no debe tumbar el backup: siempre termina con código de salida 0 y deja
constancia del error en stdout, que el script de PowerShell ya registra en su log.

No se adjuntan los archivos de backup al correo (a propósito, tras probarlo): el
.bak de la base de datos (~26 MB) ya supera el límite práctico de la mayoría de
proveedores de correo una vez codificado en base64, y los .zip (media, aplicación)
fueron directamente bloqueados por el filtro de contenido de Gmail ("This message
was blocked because its content presents a potential security issue"), sin importar
el tamaño. El correo es solo un aviso con nombres/tamaños/ruta en el servidor — los
archivos reales se recogen de `backend/backups/` en el servidor.
"""

from pathlib import Path

from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand

from apps.accounts.models import Usuario

CARPETAS = {
    'Base de datos (SQL Server)': ('sqlserver', '*.bak'),
    'Archivos subidos (Documentos, Activos, etc.)': ('media', '*.zip'),
    'Código de la aplicación': ('aplicacion', '*.zip'),
}


class Command(BaseCommand):
    help = 'Envía por correo un resumen del backup más reciente del SGSI.'

    def handle(self, *args, **options):
        raiz_backups = Path(settings.BASE_DIR) / 'backups'

        secciones = []
        hay_algun_backup = False

        for etiqueta, (subcarpeta, patron) in CARPETAS.items():
            carpeta = raiz_backups / subcarpeta
            archivos = sorted(carpeta.glob(patron), key=lambda p: p.stat().st_mtime, reverse=True) if carpeta.exists() else []
            if not archivos:
                secciones.append(f'- {etiqueta}: sin backups todavía.')
                continue

            hay_algun_backup = True
            mas_reciente = archivos[0]
            tamano_mb = mas_reciente.stat().st_size / (1024 * 1024)
            secciones.append(f'- {etiqueta}: {mas_reciente.name} ({tamano_mb:.1f} MB)')

        if not hay_algun_backup:
            self.stdout.write(self.style.WARNING('No hay ningún backup todavía, no se envía correo.'))
            return

        destinatarios = self._destinatarios()
        if not destinatarios:
            self.stdout.write(self.style.WARNING(
                'No hay a quién enviar el resumen: configurar BACKUP_NOTIFICATION_EMAIL en '
                'backend/.env o marcar al menos un Usuario con is_superuser=True.'
            ))
            return

        cuerpo = (
            'Resumen del backup del SGSI (ISO/IEC 27001:2022) - ANAS WAYUU EPSI\n\n'
            + '\n'.join(secciones)
            + '\n\n'
            'Los archivos no se adjuntan a este correo (superan lo que los proveedores '
            'de correo aceptan de forma confiable) — quedan guardados en el servidor, '
            'en backend/backups/, dentro de la subcarpeta indicada en cada línea.\n'
        )

        try:
            send_mail(
                subject='[SGSI] Resumen de backup',
                message=cuerpo,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=destinatarios,
                fail_silently=False,
            )
        except Exception as error:  # noqa: BLE001 - un fallo de correo no debe tumbar el backup
            self.stdout.write(self.style.ERROR(f'No se pudo enviar el correo de resumen: {error}'))
            return

        self.stdout.write(self.style.SUCCESS(f'Correo de resumen enviado a: {", ".join(destinatarios)}'))

    def _destinatarios(self):
        if settings.BACKUP_NOTIFICATION_EMAIL:
            return [correo.strip() for correo in settings.BACKUP_NOTIFICATION_EMAIL.split(',') if correo.strip()]
        return list(
            Usuario.objects.filter(is_superuser=True, is_active=True).exclude(email='').values_list('email', flat=True)
        )
