<#
.SYNOPSIS
    Registra (o reemplaza) la Tarea Programada de Windows que corre el backup diario
    del SGSI a las 2:00 a.m.

.DESCRIPTION
    Ejecutar UNA VEZ, en una PowerShell como Administrador:

        powershell -ExecutionPolicy Bypass -File backend\scripts\registrar_tarea_backup.ps1

    La tarea se configura para "despertar el equipo" si está dormido a esa hora
    (Task Scheduler sí puede hacerlo; si el equipo está APAGADO por completo, o en
    hibernación, ninguna tarea programada puede dispararse — en ese caso hay que
    ajustar la hora del backup a un horario en el que el equipo sí esté encendido).
#>

$ErrorActionPreference = 'Stop'

$NombreTarea = 'SGSI - Backup diario'
$CarpetaScript = $PSScriptRoot
$RutaScriptBackup = Join-Path $CarpetaScript 'backup_sgsi.ps1'

if (-not (Test-Path $RutaScriptBackup)) {
    throw "No se encontró $RutaScriptBackup"
}

$accion = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$RutaScriptBackup`""

$disparador = New-ScheduledTaskTrigger -Daily -At '02:00'

$configuracion = New-ScheduledTaskSettingsSet `
    -WakeToRun `
    -StartWhenAvailable `
    -DontStopOnIdleEnd `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -RestartCount 2 `
    -RestartInterval (New-TimeSpan -Minutes 10)

$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Highest

Register-ScheduledTask -TaskName $NombreTarea `
    -Action $accion `
    -Trigger $disparador `
    -Settings $configuracion `
    -Principal $principal `
    -Description 'Backup diario de la base de datos SQL Server y archivos de Documentos del SGSI (ISO 27001). Ver backend/scripts/backup_sgsi.ps1.' `
    -Force | Out-Null

Write-Host "Tarea '$NombreTarea' registrada: corre todos los días a las 2:00 a.m." -ForegroundColor Green
Write-Host "Nota: si el equipo está apagado (no solo dormido) a esa hora, la tarea no se ejecuta ese día." -ForegroundColor Yellow
Write-Host "Para probarla ya mismo sin esperar a la madrugada: Start-ScheduledTask -TaskName '$NombreTarea'" -ForegroundColor Cyan
