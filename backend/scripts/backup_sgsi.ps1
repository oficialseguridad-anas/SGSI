<#
.SYNOPSIS
    Backup diario del SGSI: base de datos SQL Server (vía BACKUP DATABASE nativo,
    dentro del contenedor Docker) + archivos subidos en Documentos (backend/media) +
    código fuente de la aplicación (backend/frontend), con rotación automática y
    aviso por correo al administrador. Cada backup queda guardado dos veces: en
    backend/backups/ (dentro del repo) y en la carpeta "Documentos" de Windows del
    usuario (Documentos\SGSI_Backups\), para no depender de un solo lugar en disco.

.DESCRIPTION
    Pensado para ejecutarse como Tarea Programada de Windows (ver
    registrar_tarea_backup.ps1 en esta misma carpeta) o a demanda desde el botón
    "Ejecutar backup ahora" del frontend (ver apps/core/views_backup.py), pero
    también se puede correr a mano en cualquier momento:

        powershell -ExecutionPolicy Bypass -File backend\scripts\backup_sgsi.ps1

    Requiere que docker-compose.yml tenga montada la carpeta
    backend/backups/sqlserver dentro del contenedor en /var/opt/mssql/backup (ya
    configurado) — si no, BACKUP DATABASE escribe el .bak dentro del contenedor y
    nunca aparece en el host.

    Si Docker Desktop o el contenedor no están corriendo (muy probable en un horario
    de madrugada en un equipo de trabajo, no un servidor 24/7), el script intenta
    levantarlos antes de hacer el backup, igual que el ritual manual de "inicia
    proyecto" — no asume que ya están arriba.
#>

$ErrorActionPreference = 'Stop'

$CarpetaScript = $PSScriptRoot
$RaizBackend = Split-Path -Parent $CarpetaScript
$RaizRepo = Split-Path -Parent $RaizBackend
$RutaEnv = Join-Path $RaizBackend '.env'
$CarpetaBackupsSql = Join-Path $RaizBackend 'backups\sqlserver'
$CarpetaBackupsMedia = Join-Path $RaizBackend 'backups\media'
$CarpetaBackupsApp = Join-Path $RaizBackend 'backups\aplicacion'
$RutaLog = Join-Path $RaizBackend 'backups\backup_log.txt'
$RutaVenvPython = Join-Path $RaizBackend 'venv\Scripts\python.exe'
$RetencionBackups = 14

# Copia adicional en la carpeta "Documentos" de Windows del usuario que corre el
# script (funciona igual si lo corre la Tarea Programada, que usa el mismo usuario
# — ver registrar_tarea_backup.ps1). [Environment]::GetFolderPath resuelve la
# ubicación REAL de Documentos incluso si está redirigida a OneDrive, en vez de
# asumir "$env:USERPROFILE\Documents" a mano.
$CarpetaDocumentos = [Environment]::GetFolderPath('MyDocuments')
$CarpetaDocumentosBackups = Join-Path $CarpetaDocumentos 'SGSI_Backups'
$CarpetaDocumentosSql = Join-Path $CarpetaDocumentosBackups 'sqlserver'
$CarpetaDocumentosMedia = Join-Path $CarpetaDocumentosBackups 'media'
$CarpetaDocumentosApp = Join-Path $CarpetaDocumentosBackups 'aplicacion'
$ContenedorSql = 'sgsi-sqlserver'
$DockerDesktopExe = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'

# Carpetas que se excluyen del backup de "aplicación" (código fuente): generadas,
# reinstalables desde requirements.txt/package.json, o ya respaldadas aparte.
$CarpetasExcluidasApp = @('venv', 'node_modules', '__pycache__', 'dist', 'staticfiles', '.git', 'backups', 'media', '.vscode', '.idea')

function Escribir-Log {
    param([string]$Mensaje)
    $linea = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Mensaje"
    Write-Output $linea
    Add-Content -Path $RutaLog -Value $linea
}

function Leer-VariableEnv {
    param([string]$Nombre)
    $linea = Get-Content $RutaEnv | Where-Object { $_ -match "^$Nombre=" } | Select-Object -First 1
    if (-not $linea) { throw "No se encontró la variable $Nombre en $RutaEnv" }
    return ($linea -split '=', 2)[1].Trim()
}

function Asegurar-DockerListo {
    # 1) ¿Docker Desktop ya está corriendo? (docker ps responde sin error)
    docker ps 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Escribir-Log "Docker Desktop no está corriendo. Iniciándolo..."
        if (-not (Test-Path $DockerDesktopExe)) {
            throw "No se encontró Docker Desktop en $DockerDesktopExe"
        }
        Start-Process $DockerDesktopExe
        $intentos = 0
        do {
            Start-Sleep -Seconds 5
            docker ps 2>$null | Out-Null
            $intentos++
        } while ($LASTEXITCODE -ne 0 -and $intentos -lt 20)
        if ($LASTEXITCODE -ne 0) {
            throw "Docker Desktop no respondió después de $($intentos * 5) segundos."
        }
        Escribir-Log "Docker Desktop listo."
    }

    # 2) ¿El contenedor de SQL Server existe y está saludable?
    $estado = docker inspect --format='{{.State.Health.Status}}' $ContenedorSql 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "El contenedor '$ContenedorSql' no existe. Levántalo con 'docker compose up -d' antes de programar el backup."
    }
    $intentos = 0
    while ($estado -ne 'healthy' -and $intentos -lt 20) {
        Escribir-Log "Esperando a que '$ContenedorSql' esté 'healthy' (estado actual: $estado)..."
        Start-Sleep -Seconds 5
        $estado = docker inspect --format='{{.State.Health.Status}}' $ContenedorSql 2>$null
        $intentos++
    }
    if ($estado -ne 'healthy') {
        throw "El contenedor '$ContenedorSql' no llegó a 'healthy' (último estado: $estado)."
    }
}

function Copiar-A-Documentos {
    param([string]$RutaOrigen, [string]$CarpetaDestino)
    New-Item -ItemType Directory -Force -Path $CarpetaDestino | Out-Null
    Copy-Item -Path $RutaOrigen -Destination $CarpetaDestino -Force
    Escribir-Log "  -> copiado también a $CarpetaDestino\$(Split-Path -Leaf $RutaOrigen)"
}

function Respaldar-Aplicacion {
    param([string]$Timestamp)

    $CarpetaStaging = Join-Path $env:TEMP "sgsi_backup_app_$Timestamp"
    New-Item -ItemType Directory -Force -Path $CarpetaStaging | Out-Null

    # robocopy /XD excluye por nombre de carpeta en cualquier nivel del árbol — así
    # no se copian venv/node_modules/__pycache__/etc. (serían decenas/cientos de MB
    # y son reinstalables, no hace falta respaldarlos). Los códigos de salida de
    # robocopy no son 0/1 como la mayoría de comandos: 0-7 es éxito, 8+ es error real.
    robocopy $RaizRepo $CarpetaStaging /E /XD $CarpetasExcluidasApp /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) {
        Remove-Item $CarpetaStaging -Recurse -Force -ErrorAction SilentlyContinue
        throw "robocopy falló copiando el código de la aplicación (código $LASTEXITCODE)."
    }

    $NombreZipApp = "aplicacion_$Timestamp.zip"
    $RutaZipApp = Join-Path $CarpetaBackupsApp $NombreZipApp
    Compress-Archive -Path (Join-Path $CarpetaStaging '*') -DestinationPath $RutaZipApp -CompressionLevel Optimal
    Remove-Item $CarpetaStaging -Recurse -Force -ErrorAction SilentlyContinue

    $TamanoMbApp = [math]::Round((Get-Item $RutaZipApp).Length / 1MB, 1)
    # | Out-Null: Escribir-Log hace Write-Output además de escribir al log, y sin
    # suprimirlo aquí ese texto se mezclaría con $RutaZipApp en lo que la función
    # devuelve (PowerShell junta todo lo no capturado en el valor de retorno).
    Escribir-Log "Backup de la aplicación (código fuente) OK: $NombreZipApp ($TamanoMbApp MB)" | Out-Null
    return $RutaZipApp
}

function Rotar-Backups {
    param([string]$Carpeta)
    $archivos = Get-ChildItem -Path $Carpeta -File | Sort-Object LastWriteTime -Descending
    if ($archivos.Count -gt $RetencionBackups) {
        $aBorrar = $archivos | Select-Object -Skip $RetencionBackups
        foreach ($archivo in $aBorrar) {
            Remove-Item $archivo.FullName -Force
            Escribir-Log "Backup antiguo eliminado (rotación, se conservan los últimos $RetencionBackups): $($archivo.Name)"
        }
    }
}

try {
    New-Item -ItemType Directory -Force -Path $CarpetaBackupsSql | Out-Null
    New-Item -ItemType Directory -Force -Path $CarpetaBackupsMedia | Out-Null
    New-Item -ItemType Directory -Force -Path $CarpetaBackupsApp | Out-Null

    Escribir-Log "=== Iniciando backup del SGSI ==="
    Asegurar-DockerListo

    $NombreBd = Leer-VariableEnv 'MSSQL_NAME'
    $PasswordSa = Leer-VariableEnv 'MSSQL_SA_PASSWORD'
    $Timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'

    # --- Backup de la base de datos (BACKUP DATABASE nativo de SQL Server) ---
    $NombreArchivoBak = "${NombreBd}_$Timestamp.bak"
    $RutaBakEnContenedor = "/var/opt/mssql/backup/$NombreArchivoBak"
    # Nota: WITH COMPRESSION no está disponible en SQL Server Express (motor usado
    # aquí, ver MSSQL_PID: Express en docker-compose.yml) — solo en ediciones
    # Standard/Enterprise. Se omite.
    $consulta = "BACKUP DATABASE [$NombreBd] TO DISK = N'$RutaBakEnContenedor' WITH INIT, STATS = 10;"

    Escribir-Log "Ejecutando BACKUP DATABASE [$NombreBd]..."
    # -b: aborta y devuelve código de salida distinto de cero si el T-SQL falla:
    # sin esto, sqlcmd devuelve 0 aunque el BACKUP DATABASE haya fallado.
    docker exec $ContenedorSql /opt/mssql-tools18/bin/sqlcmd -C -b -S localhost -U sa -P "$PasswordSa" -Q "$consulta"
    if ($LASTEXITCODE -ne 0) { throw "sqlcmd devolvió código de salida $LASTEXITCODE al hacer el BACKUP DATABASE." }

    $RutaBakEnHost = Join-Path $CarpetaBackupsSql $NombreArchivoBak
    if (-not (Test-Path $RutaBakEnHost)) {
        throw "El backup no apareció en $RutaBakEnHost — revisar el volumen montado en docker-compose.yml (backend/backups/sqlserver -> /var/opt/mssql/backup)."
    }
    $TamanoMb = [math]::Round((Get-Item $RutaBakEnHost).Length / 1MB, 1)
    Escribir-Log "Backup de base de datos OK: $NombreArchivoBak ($TamanoMb MB)"
    Copiar-A-Documentos -RutaOrigen $RutaBakEnHost -CarpetaDestino $CarpetaDocumentosSql

    # --- Backup de archivos subidos (media) ---
    $RutaMedia = Join-Path $RaizBackend 'media'
    if ((Test-Path $RutaMedia) -and (Get-ChildItem $RutaMedia -Force | Measure-Object).Count -gt 0) {
        $NombreZipMedia = "media_$Timestamp.zip"
        $RutaZipMedia = Join-Path $CarpetaBackupsMedia $NombreZipMedia
        Compress-Archive -Path (Join-Path $RutaMedia '*') -DestinationPath $RutaZipMedia -CompressionLevel Optimal
        $TamanoMbMedia = [math]::Round((Get-Item $RutaZipMedia).Length / 1MB, 1)
        Escribir-Log "Backup de archivos (media) OK: $NombreZipMedia ($TamanoMbMedia MB)"
        Copiar-A-Documentos -RutaOrigen $RutaZipMedia -CarpetaDestino $CarpetaDocumentosMedia
    }
    else {
        Escribir-Log "Carpeta media vacía o inexistente, se omite ese backup."
    }

    # --- Backup del código de la aplicación (backend + frontend, sin generados) ---
    $RutaZipApp = Respaldar-Aplicacion -Timestamp $Timestamp
    Copiar-A-Documentos -RutaOrigen $RutaZipApp -CarpetaDestino $CarpetaDocumentosApp

    # --- Rotación: conservar solo los últimos N de cada tipo (en backend/backups/
    # y también en la copia de Documentos) ---
    Rotar-Backups -Carpeta $CarpetaBackupsSql
    Rotar-Backups -Carpeta $CarpetaBackupsMedia
    Rotar-Backups -Carpeta $CarpetaBackupsApp
    Rotar-Backups -Carpeta $CarpetaDocumentosSql
    Rotar-Backups -Carpeta $CarpetaDocumentosMedia
    Rotar-Backups -Carpeta $CarpetaDocumentosApp

    Escribir-Log "=== Backup completo finalizado sin errores ==="

    # --- Aviso por correo al administrador ---
    # Un fallo de correo (SMTP caído, credenciales inválidas) no debe hacer que el
    # backup se reporte como fallido — el backup en sí ya terminó bien.
    if (Test-Path $RutaVenvPython) {
        try {
            Escribir-Log "Enviando correo de resumen..."
            $salidaCorreo = & $RutaVenvPython (Join-Path $RaizBackend 'manage.py') enviar_resumen_backup 2>&1
            $salidaCorreo | ForEach-Object { Escribir-Log "  $_" }
        }
        catch {
            Escribir-Log "ADVERTENCIA: no se pudo enviar el correo de resumen: $($_.Exception.Message)"
        }
    }
    else {
        Escribir-Log "ADVERTENCIA: no se encontró $RutaVenvPython, se omite el correo de resumen."
    }

    exit 0
}
catch {
    Escribir-Log "ERROR: $($_.Exception.Message)"
    exit 1
}
