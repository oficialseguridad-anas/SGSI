<#
.SYNOPSIS
    Restaura un backup (.bak) de la base de datos del SGSI, por defecto en una base
    de datos TEMPORAL distinta (para verificar que el backup es válido sin tocar la
    base de datos real de producción).

.DESCRIPTION
    Uso típico para PROBAR que un backup sirve (no toca la base real):

        powershell -ExecutionPolicy Bypass -File backend\scripts\restore_sqlserver.ps1

    (sin parámetros: restaura el .bak más reciente en una base llamada
    "<MSSQL_NAME>_restore_test", y la deja creada para que el usuario la revise a
    mano; no la borra automáticamente).

    Para restaurar sobre la base REAL (recuperación real ante un incidente, pisa los
    datos actuales):

        powershell -ExecutionPolicy Bypass -File backend\scripts\restore_sqlserver.ps1 -SobreBaseReal -Confirmar

    Para elegir un .bak específico en vez del más reciente:

        powershell -ExecutionPolicy Bypass -File backend\scripts\restore_sqlserver.ps1 -ArchivoBak "sgsi_20260922_020000.bak"
#>

param(
    [string]$ArchivoBak,
    [switch]$SobreBaseReal,
    [switch]$Confirmar
)

$ErrorActionPreference = 'Stop'

$CarpetaScript = $PSScriptRoot
$RaizBackend = Split-Path -Parent $CarpetaScript
$RutaEnv = Join-Path $RaizBackend '.env'
$CarpetaBackupsSql = Join-Path $RaizBackend 'backups\sqlserver'
$ContenedorSql = 'sgsi-sqlserver'

function Leer-VariableEnv {
    param([string]$Nombre)
    $linea = Get-Content $RutaEnv | Where-Object { $_ -match "^$Nombre=" } | Select-Object -First 1
    if (-not $linea) { throw "No se encontró la variable $Nombre en $RutaEnv" }
    return ($linea -split '=', 2)[1].Trim()
}

$NombreBd = Leer-VariableEnv 'MSSQL_NAME'
$PasswordSa = Leer-VariableEnv 'MSSQL_SA_PASSWORD'

if (-not $ArchivoBak) {
    $masReciente = Get-ChildItem -Path $CarpetaBackupsSql -Filter '*.bak' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $masReciente) { throw "No hay ningún .bak en $CarpetaBackupsSql" }
    $ArchivoBak = $masReciente.Name
}

$RutaBakEnHost = Join-Path $CarpetaBackupsSql $ArchivoBak
if (-not (Test-Path $RutaBakEnHost)) { throw "No existe $RutaBakEnHost" }
$RutaBakEnContenedor = "/var/opt/mssql/backup/$ArchivoBak"

if ($SobreBaseReal) {
    if (-not $Confirmar) {
        throw "Vas a restaurar sobre la base de datos REAL '$NombreBd' (se pierden los datos actuales). Repite el comando agregando -Confirmar si estás seguro."
    }
    $BaseDestino = $NombreBd
    Write-Host "Restaurando '$ArchivoBak' SOBRE LA BASE REAL '$BaseDestino'..." -ForegroundColor Red
}
else {
    $BaseDestino = "${NombreBd}_restore_test"
    Write-Host "Restaurando '$ArchivoBak' en la base de PRUEBA '$BaseDestino' (la base real no se toca)..." -ForegroundColor Cyan
}

# Hay que leer los nombres lógicos de los archivos dentro del .bak (RESTORE FILELISTONLY)
# porque SQL Server no permite restaurar con el mismo nombre de archivo físico que ya
# usa la base real cuando el destino es una base distinta (MOVE es obligatorio).
$consultaFilelist = "RESTORE FILELISTONLY FROM DISK = N'$RutaBakEnContenedor';"
$salidaFilelist = docker exec $ContenedorSql /opt/mssql-tools18/bin/sqlcmd -C -b -S localhost -U sa -P "$PasswordSa" -s "|" -W -Q "$consultaFilelist"
if ($LASTEXITCODE -ne 0) { throw "No se pudo leer el contenido del backup (RESTORE FILELISTONLY)." }

$filas = $salidaFilelist | Where-Object { $_ -match '\|' -and $_ -notmatch '^LogicalName' -and $_ -notmatch '^-+\|' }
$nombreLogicoDatos = ($filas[0] -split '\|')[0].Trim()
$nombreLogicoLog = ($filas[1] -split '\|')[0].Trim()

$RutaDatosContenedor = "/var/opt/mssql/data/${BaseDestino}.mdf"
$RutaLogContenedor = "/var/opt/mssql/data/${BaseDestino}_log.ldf"

$consultaRestore = @"
RESTORE DATABASE [$BaseDestino] FROM DISK = N'$RutaBakEnContenedor'
WITH MOVE N'$nombreLogicoDatos' TO N'$RutaDatosContenedor',
     MOVE N'$nombreLogicoLog' TO N'$RutaLogContenedor',
     REPLACE, STATS = 10;
"@

docker exec $ContenedorSql /opt/mssql-tools18/bin/sqlcmd -C -b -S localhost -U sa -P "$PasswordSa" -Q "$consultaRestore"
if ($LASTEXITCODE -ne 0) { throw "RESTORE DATABASE falló." }

Write-Host "Restauración completada en la base '$BaseDestino'." -ForegroundColor Green
if (-not $SobreBaseReal) {
    Write-Host "Esta es una base de PRUEBA para verificar el backup. Cuando termines de revisarla, bórrala con:" -ForegroundColor Yellow
    Write-Host "  docker exec $ContenedorSql /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P `"<password>`" -Q `"DROP DATABASE [$BaseDestino];`"" -ForegroundColor Yellow
}
