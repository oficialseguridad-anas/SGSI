# Estado del proyecto — SGSI ISO/IEC 27001:2022 (ANAS WAYUU EPSI)

Documento de referencia para retomar el proyecto en cualquier momento, sin depender
de que Claude recuerde la conversación anterior. Última actualización: 2026-08-24.

## 1. Qué es esto

Aplicación web de Sistema de Gestión de Seguridad de la Información (SGSI) para
ANAS WAYUU EPSI, alineada a ISO/IEC 27001:2022. Módulos activos: Dashboard,
Activos, Riesgos, Controles (Anexo A / SoA), Documentos, Usuarios, Seguridad (2FA).

## 2. Stack técnico

- **Backend:** Django 6.1 + Django REST Framework, servido con `waitress` (no
  `runserver`). Autenticación JWT (`rest_framework_simplejwt`), 2FA (TOTP con
  `pyotp` y OTP por correo).
- **Base de datos:** **SQL Server 2022 en un contenedor Docker** (migrado desde
  MySQL). Backend se conecta vía `mssql-django` + `pyodbc`. El motor se
  selecciona con `DB_ENGINE` en `backend/.env` (`mssql` es el actual; `mysql`
  quedó como fallback pero ya no se usa).
- **Frontend:** React 19 + Vite + antd v6 + `@tanstack/react-query` v5 +
  `react-router-dom` v7. Gráficas del dashboard con **ECharts**
  (`echarts` + `echarts-for-react`).
- **Branding institucional:** colores tomados de epsianaswayuu.com (teal/verde
  oscuro, naranja, dorado) en `frontend/src/shared/theme/brand.ts`. Logo en
  `frontend/public/logo-anaswayuu.png`.

## 3. Cómo iniciar todo (en este orden)

### 3.1 Docker Desktop + SQL Server (necesario antes del backend)

Si Docker Desktop no está corriendo, iniciarlo primero y esperar a que el motor
esté listo (el ícono de la bandeja se pone verde/estable):

```powershell
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

Luego, desde la raíz del proyecto:

```powershell
cd C:\Users\oberrio\source\repos\sgsi-iso27001
docker compose --env-file backend\.env up -d
```

Verificar que quedó "healthy":

```powershell
docker ps --format "{{.Names}}: {{.Status}}"
```

### 3.2 Backend (puerto 8000)

```powershell
cd C:\Users\oberrio\source\repos\sgsi-iso27001\backend
.\venv\Scripts\waitress-serve.exe --host=127.0.0.1 --port=8000 config.wsgi:application
```

### 3.3 Frontend (puerto 5173)

```powershell
cd C:\Users\oberrio\source\repos\sgsi-iso27001\frontend
npm run dev
```

Luego entrar a **http://localhost:5173**.

### 3.4 Para detener

- `Ctrl+C` en cada terminal, o buscar el proceso por puerto y matarlo:
  ```powershell
  Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select -ExpandProperty OwningProcess -Unique
  Stop-Process -Id <ese_numero> -Force
  ```
  (cambiar `8000` por `5173` para el frontend).
- `docker compose down` para bajar SQL Server (los datos quedan en el volumen
  Docker, no se pierden).

**⚠️ Problema recurrente:** a veces quedan procesos `waitress-serve.exe`
"zombis" de sesiones anteriores ocupando el puerto 8000, y el backend falla al
iniciar. Si eso pasa, revisar el puerto con el comando de arriba y matar el
proceso antes de reintentar.

## 4. Estructura de módulos

| Módulo | Backend | Frontend |
|---|---|---|
| Cuentas / 2FA / Usuarios | `backend/apps/accounts` | `frontend/src/features/accounts` |
| Activos | `backend/apps/activos` | `frontend/src/features/activos` |
| Riesgos | `backend/apps/riesgos` | `frontend/src/features/riesgos` |
| Controles (Anexo A / SoA) | `backend/apps/controles` | `frontend/src/features/controles` |
| Documentos | `backend/apps/documentos` | `frontend/src/features/documentos` |
| Dashboard / gráficas | — | `frontend/src/features/dashboard` |

## 5. Decisiones de diseño importantes (para no reinventar ni deshacer sin querer)

- **Activos:** relación real `Proceso → Dirección (1-N) → Activo`. Al crear un
  activo solo se elige la Dirección; el Proceso se deriva y se muestra en la
  lista. El campo `codigo` se genera automáticamente (0001, 0002...) y no se
  muestra en el formulario. Criticidad = suma de Confidencialidad+Integridad+
  Disponibilidad (Baja=1/Media=2/Alta=3): ≤3 Baja, 4-7 Media, 8-9 Alta.
  `Propietario`/`Custodio` son texto libre (decisión explícita del usuario, no
  FK a Usuario).
- **Usuarios:** el campo "Área" fue reemplazado por "Dirección" (FK,
  `Dirección 1 — N Usuarios`). El módulo de Usuarios (menú, ruta y API) solo es
  visible para administradores (`is_superuser`).
- **Riesgos:**
  - `activos` es multi-selección (M2M), no un solo activo.
  - Se eliminó el campo/modelo `Vulnerabilidad` por completo.
  - `Probabilidad` (1-5: Muy Rara…Casi Seguro) e `Impacto` (1/5/10/15/20:
    Insignificante…Catastrófico) son listas desplegables con nombre y
    descripción, no números libres.
  - `Riesgo inherente` = Probabilidad × Impacto (cálculo honesto, sin trucos).
  - `Nivel de riesgo` (Bajo/Medio/Alto/Crítico) **NO** es un umbral simple sobre
    el producto — es una **matriz de referencia exacta 5×5** de la entidad
    (`Riesgo._MATRIZ_NIVEL_DE_RIESGO` en el backend, y su copia idéntica en
    `frontend/src/features/riesgos/nivelRiesgo.ts`). Incluye una excepción
    puntual: Casi Seguro × Mayor (5×15=75) se clasifica como **Crítico**
    aunque el producto matemático sea 75 (en la tabla de referencia esa celda
    estaba marcada con "76"). Si se ajusta esta matriz, hay que editarla en
    **ambos** archivos para que coincidan.
  - Hay un "Mapa de calor" visual (componente `MapaCalorRiesgosModal`)
    accesible desde el formulario y desde la lista de Riesgos.
  - El campo `estado` de Riesgo (Identificado/En tratamiento/...) **se eliminó**
    del modelo. El concepto real de "Opción de Tratamiento"
    (Mitigar/Transferir/Evitar/Aceptar) vive en el modelo `TratamientoRiesgo`.
  - **`TratamientoRiesgo` (Opción de tratamiento) todavía NO tiene formulario
    en el frontend React** — por ahora solo se gestiona desde el admin de
    Django (`/admin/riesgos/tratamientoriesgo/`). Campos: Opción de
    tratamiento, Descripción, Acción de mitigación, Recursos necesarios,
    Responsable, Fecha límite (plazo), Fecha de seguimiento, Fecha de próximo
    seguimiento, Evidencias esperadas + carga de varios archivos adjuntos
    (campo `archivos_nuevos`, widget de selección múltiple dentro del mismo
    formulario), Probabilidad/Impacto residual, Estado (Pendiente/En
    progreso/Completado/Vencido) — este queda como **último** campo del
    formulario a propósito.
- **Migración a SQL Server:** el script de migración de datos vive en
  `backend/apps/core/management/commands/migrar_mysql_a_sqlserver.py`. Ya se
  ejecutó una vez y no debería necesitar correr de nuevo salvo que se vuelva a
  MySQL por algún motivo.
- **Dashboard:** una sola gráfica por ahora ("Activos por criticidad", dona
  animada con ECharts). Falta decidir con el usuario cuál es la siguiente
  gráfica a agregar.

## 6. Bug corregido recientemente (para no reintroducirlo)

En `frontend/src/shared/api/client.ts` había un interceptor de Axios que, ante
**cualquier** 401 (incluido el del propio login con credenciales incorrectas),
intentaba refrescar el token y —al fallar— hacía `window.location.href =
'/login'`, recargando toda la página y borrando el mensaje de error antes de
que se pudiera mostrar. Se corrigió excluyendo las rutas `/auth/token/`,
`/auth/token/verificar-otp/` y `/auth/token/refresh/` de esa lógica. Si se
tocan las rutas de autenticación, revisar que esta exclusión siga vigente.

## 7. Pendientes / cosas sin resolver

- **No hay backups automáticos configurados** para SQL Server (se ofreció
  durante la sesión, el usuario no ha respondido si los quiere).
- Un registro de Activo se perdió durante el trabajo de migración temprano
  (código `890601`, "ANAS WAYUU EPSI") y nunca se pudo recuperar — hay que
  volver a ingresarlo manualmente si hace falta.
- Posible error de tipeo sin confirmar: código de dirección "DAU" con
  descripción "Dierección de auditoria" (¿debería decir "Dirección"?).
- Sin confirmar: la interpretación de "LaaS" como "IaaS" en una fila de
  servidores GCP del import de Activos.
- Falta construir el formulario de "Tratamiento de Riesgo" en el frontend
  React (hoy solo existe en el admin de Django — ver sección 5).
- Falta definir con el usuario cuál es la siguiente gráfica del dashboard.

## 8. Dónde están las credenciales

Todo vive en `backend/.env` (con extensión `.gitignore`d, nunca se sube a git).
Incluye: `DB_ENGINE`, credenciales de SQL Server, credenciales del MySQL legado
(solo para el script de migración), `DJANGO_SECRET_KEY`, credenciales SMTP
(Gmail) para el envío de códigos OTP por correo.

**Usuario administrador actual:** `oficialseguridad@epsianaswayuu.com`
(superusuario, con 2FA por aplicación ya activado — el código QR ya se
escaneó, no hay que reconfigurarlo).
