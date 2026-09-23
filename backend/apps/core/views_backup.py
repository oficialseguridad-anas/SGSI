"""Backup manual del SGSI desde el frontend (botón "Ejecutar backup ahora").

El backup automático diario (2 a.m., Tarea Programada de Windows) ya corre
`backend/scripts/backup_sgsi.ps1` de forma independiente de Django — ver
ESTADO_PROYECTO.md sección 5, "Backups automáticos". Esta vista permite disparar el
mismo script a demanda (p. ej. si alguien va a hacer un cambio importante en horario
de oficina y no quiere esperar hasta la madrugada), sin duplicar su lógica: llama al
mismo .ps1 por subprocess.

Solo administradores (`EsAdministrador`) pueden disparar esto o ver el estado: corre
`BACKUP DATABASE` sobre la base de datos real y puede tardar bastantes segundos, no
es una operación de lectura común.
"""

import io
import subprocess
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import EsAdministrador

RUTA_SCRIPT_BACKUP = Path(settings.BASE_DIR) / 'scripts' / 'backup_sgsi.ps1'

CATEGORIAS = {
    'base_datos': ('sqlserver', '*.bak'),
    'media': ('media', '*.zip'),
    'aplicacion': ('aplicacion', '*.zip'),
}


def _listar_backups():
    raiz = Path(settings.BASE_DIR) / 'backups'
    resultado = {}
    for clave, (subcarpeta, patron) in CATEGORIAS.items():
        carpeta = raiz / subcarpeta
        archivos = sorted(carpeta.glob(patron), key=lambda p: p.stat().st_mtime, reverse=True) if carpeta.exists() else []
        if archivos:
            mas_reciente = archivos[0]
            resultado[clave] = {
                'nombre': mas_reciente.name,
                'tamano_mb': round(mas_reciente.stat().st_size / (1024 * 1024), 1),
                'fecha': mas_reciente.stat().st_mtime,
                'total_backups': len(archivos),
            }
        else:
            resultado[clave] = None
    return resultado


class EstadoBackupView(APIView):
    permission_classes = [EsAdministrador]

    def get(self, request):
        return Response({'backups': _listar_backups()})


class EjecutarBackupView(APIView):
    permission_classes = [EsAdministrador]

    def post(self, request):
        if not RUTA_SCRIPT_BACKUP.exists():
            return Response(
                {'exito': False, 'error': f'No se encontró el script de backup en {RUTA_SCRIPT_BACKUP}.'},
                status=500,
            )

        try:
            proceso = subprocess.run(
                [
                    'powershell.exe',
                    '-NoProfile',
                    '-ExecutionPolicy', 'Bypass',
                    '-File', str(RUTA_SCRIPT_BACKUP),
                ],
                capture_output=True,
                text=True,
                timeout=600,
            )
        except subprocess.TimeoutExpired:
            return Response(
                {'exito': False, 'error': 'El backup superó los 10 minutos y se canceló. Revisar backend/backups/backup_log.txt.'},
                status=504,
            )

        exito = proceso.returncode == 0
        salida = (proceso.stdout or '') + (('\n' + proceso.stderr) if proceso.stderr else '')

        correo_salida = ''
        if exito:
            buffer = io.StringIO()
            try:
                call_command('enviar_resumen_backup', stdout=buffer, stderr=buffer)
            except Exception as error:  # noqa: BLE001 - un fallo de correo no debe ocultar que el backup sí sirvió
                correo_salida = f'No se pudo enviar el correo de resumen: {error}'
            else:
                correo_salida = buffer.getvalue().strip()

        return Response({
            'exito': exito,
            'salida': salida.strip(),
            'correo': correo_salida,
            'backups': _listar_backups(),
        }, status=200 if exito else 500)
