# Estado del proyecto — SGSI ISO/IEC 27001:2022 (ANAS WAYUU EPSI)

Documento de referencia para retomar el proyecto en cualquier momento, sin depender
de que Claude recuerde la conversación anterior. **Este archivo se debe mantener
actualizado en cada sesión** — al terminar cambios relevantes (nuevo módulo,
decisión de diseño, cambio de flujo, pendiente nuevo), reflejarlos aquí.

Última actualización: 2026-09-21 (agregado módulo de Revisiones semestrales de
Activos, descarga de reporte Excel filtrable de Activos, y checklists de
Seguimiento Anexo A para Organizacionales/Físicos/Tecnológicos).

## 1. Qué es esto

Aplicación web de Sistema de Gestión de Seguridad de la Información (SGSI) para
ANAS WAYUU EPSI, alineada a ISO/IEC 27001:2022. Módulos activos (ver menú lateral
real en `frontend/src/shared/layout/Shell.tsx`):

Dashboard, Activos, Riesgos, Controles (Anexo A / SoA), Seguimiento Anexo A
(Organizacionales / Personas / Físicos / Tecnológicos), Hallazgos de auditoría,
Matriz de incidentes, Documentos, Indicadores, Objetivos, Usuarios, Seguridad (2FA).

## 2. Stack técnico

- **Backend:** Django 6.1 + Django REST Framework, servido con `waitress` (no
  `runserver`). Autenticación JWT (`rest_framework_simplejwt`), 2FA (TOTP con
  `pyotp` y OTP por correo).
- **Base de datos:** SQL Server 2022 en un contenedor Docker (`sgsi-sqlserver`).
  Backend se conecta vía `mssql-django` + `pyodbc`. El motor se selecciona con
  `DB_ENGINE` en `backend/.env` (`mssql` es el actual).
- **Frontend:** React 19 + TypeScript + Vite + antd v6 + `@tanstack/react-query`
  v5 + `react-router-dom` v7 + `axios`. Gráficas con **Apache ECharts**
  (`echarts` + `echarts-for-react`), siguiendo el skill interno de dataviz
  (paleta categórica fija de 8 tonos validada por daltonismo/contraste — ver
  `frontend/src/features/dashboard/components/*` para el patrón). Vista previa
  de Excel con `xlsx` (SheetJS) — **instalado desde el CDN oficial de SheetJS**
  (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`), NO desde el registro
  de npm: la versión de npm (`xlsx@0.18.5`) tiene 2 vulnerabilidades conocidas
  sin parche (ReDoS + prototype pollution); la de SheetJS CDN sí está corregida.
  Si se necesita actualizar esa librería, repetir el mismo patrón (nunca volver
  al paquete `xlsx` del registro de npm sin verificar antes con `npm audit`).
- **Branding institucional:** colores tomados de epsianaswayuu.com en
  `frontend/src/shared/theme/brand.ts` (`BRAND.tealDark` = fondo del menú lateral
  Y del header superior — ambos deben ir siempre del mismo color, es una
  decisión explícita del usuario). Logo en `frontend/public/logo-anaswayuu.png`,
  usado también como favicon (`frontend/index.html`) y título de pestaña
  "SGSI ANAS WAYUU EPSI".

## 3. Cómo iniciar todo ("inicia proyecto")

Ritual verificado y usado en todas las sesiones recientes:

### 3.1 Docker Desktop + SQL Server

```bash
docker ps --filter name=sgsi-sqlserver
```

Si Docker Desktop no está corriendo, lanzarlo y esperar (puede tardar hasta
~100s en aceptar comandos):

```powershell
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

Reintentar `docker ps` cada 5s hasta que responda, luego verificar salud:

```bash
docker inspect --format='{{.State.Health.Status}}' sgsi-sqlserver
```

hasta que devuelva `healthy`.

### 3.2 Backend (puerto 8000) y Frontend (puerto 5173)

Se lanzan en background con `nohup` + `disown` (Git Bash), no en foreground:

```bash
cd backend && nohup ./venv/Scripts/waitress-serve.exe --host=0.0.0.0 --port=8000 config.wsgi:application > backend.log 2>&1 & disown
cd frontend && nohup npm run dev > frontend.log 2>&1 & disown
```

Verificar con curl (esperar `401` en un endpoint autenticado del backend — es la
respuesta correcta sin token — y `200` en el frontend):

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/v1/riesgos/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
```

Si alguno no responde, reintentar tras unos segundos (el arranque de waitress y
de Vite no es instantáneo). Entrar a **http://localhost:5173**.

### 3.3 Problema recurrente

A veces quedan procesos `waitress-serve.exe` "zombis" de sesiones anteriores
ocupando el puerto 8000. Antes de reiniciar el backend, revisar y matar:

```powershell
Get-CimInstance Win32_Process -Filter "Name='waitress-serve.exe'" | Select-Object -ExpandProperty ProcessId
Stop-Process -Id <ese_numero> -Force
```

## 4. Estructura de módulos

| Módulo | Backend (`backend/apps/`) | Frontend (`frontend/src/features/`) |
|---|---|---|
| Cuentas / 2FA / Usuarios | `accounts` | `accounts` |
| Activos | `activos` | `activos` |
| Riesgos | `riesgos` | `riesgos` |
| Controles (Anexo A / SoA) | `controles` | `controles` |
| Seguimiento Anexo A (checklist Personas, etc.) | `revisiones` (p.ej. `RevisionPersonas`, checklist) | `seguimientoAnexoA` |
| Hallazgos de auditoría | `auditorias` (`Hallazgo`, `SeguimientoHallazgo`, `TipoHallazgo`) | `auditorias` |
| Matriz de incidentes | `incidentes` (`Incidente`, `ArchivoAdjuntoIncidente`) | `incidentes` |
| Documentos (con control de versiones) | `documentos` (`Documento`, `VersionDocumento`) | `documentos` |
| Indicadores | `indicadores` (`Indicador`, `SeguimientoIndicador`) | `indicadores` |
| Objetivos | `objetivos` (`Objetivo`, `ActividadObjetivo`) | `objetivos` |
| Dashboard / gráficas | — (consume varias APIs) | `dashboard` |

## 5. Decisiones de diseño importantes (para no reinventar ni deshacer sin querer)

### Activos
- Relación real `Proceso → Dirección (1-N) → Activo`. Al crear un activo solo se
  elige la Dirección; el Proceso se deriva y se muestra en la lista.
- `codigo` se autogenera (0001, 0002...) y no se muestra en el formulario.
- Criticidad = suma de Confidencialidad+Integridad+Disponibilidad
  (Baja=1/Media=2/Alta=3): ≤3 Baja, 4-7 Media, 8-9 Alta.
- `Propietario`/`Custodio` son texto libre (no FK a Usuario — decisión explícita).
- **Tarjetas KPI** (`ActivosPage.tsx`) agrupadas por **Proceso** (catálogo
  dinámico, no un enum fijo): tarjeta "Total" + una por proceso presente en los
  datos (+ "Sin proceso asignado" si aplica), ordenadas de mayor a menor
  cantidad, con la misma paleta cíclica de 7 colores que ya usa
  `GraficaHallazgosPorProceso` en el Dashboard. Cada tarjeta clicable filtra la
  tabla (toggle); además cada tarjeta muestra un **desglose por Criticidad**
  (Alta/Media/Baja) debajo del número.

### Activos — Revisiones semestrales (trazabilidad ISO 27001 A.5.9)
- Requisito del usuario: revisa la matriz de activos cada semestre y quería una
  "traza"/"foto" de cómo estaba cada activo en cada revisión (por proceso,
  estado, criticidad), no solo el estado actual.
- Modelos nuevos en `backend/apps/activos/models.py`:
  `RevisionSemestralActivos` (periodo único p.ej. `"2026-S1"`, fecha_revision,
  realizada_por FK a Usuario, observaciones) y `SnapshotActivo` (una fila por
  cada Activo existente al momento de cerrar la revisión, con **todos los
  campos copiados como valores planos**, no como referencias — así el
  histórico no cambia si el Activo original se edita o se elimina después;
  `activo_original` es un FK opcional solo para trazabilidad, `on_delete=SET_NULL`).
- Al crear una `RevisionSemestralActivos` (`POST /api/v1/revisiones-activos/`),
  `RevisionSemestralActivosViewSet.perform_create` recorre **todos** los
  Activos (incluye `RETIRADO`, es una foto completa) y hace `bulk_create` de un
  `SnapshotActivo` por cada uno. `GET /api/v1/snapshots-activo/?revision=<id>`
  lista la foto de una revisión puntual (filtrable también por
  `estado`/`criticidad`/`tipo_activo`/`clase_activo`/`etiquetado`).
- Frontend: `frontend/src/features/activos/pages/RevisionesActivosPage.tsx`
  (ruta `/activos/revisiones`, accesible desde un botón "Revisiones
  semestrales" en `ActivosPage`). Lista las revisiones cerradas + botón para
  cerrar una nueva (con periodo sugerido automáticamente: `<año>-S1` si el mes
  actual es ≤ junio, si no `<año>-S2` — función `periodoActual()`). "Ver foto"
  abre un `Drawer` (`DetalleRevisionDrawer`) con las mismas tarjetas KPI +
  desglose por criticidad + filtro por proceso que ya tiene `ActivosPage`, pero
  sobre los `SnapshotActivo` de esa revisión en vez de los Activos en vivo — es
  de solo lectura (sin acciones de editar/eliminar activos individuales).
- Probado end-to-end con Django shell + DRF APIClient (crear revisión con los
  200 activos reales → 200 snapshots generados → filtro por criticidad ALTA →
  limpieza), sin dejar datos de prueba.

### Activos — Reporte Excel filtrable por criterios
- Botón "Descargar Excel" en `ActivosPage` abre
  `frontend/src/features/activos/components/ExportarActivosModal.tsx`: permite
  elegir criterios (Proceso, Dirección, Criticidad, Estado — multi-select,
  cada uno opcional) y descarga un `.xlsx` solo con los activos que cumplen
  **todos** los criterios elegidos (AND entre criterios, OR dentro de cada
  uno). Las opciones de Proceso/Dirección se derivan de los propios activos ya
  cargados en memoria (no pega a `/procesos/` ni `/direcciones/`), y la lista
  de Direcciones se acota si ya se eligió Proceso.
- Generado **100% en el navegador** con `xlsx` (SheetJS, la misma librería que
  ya se usa para previsualizar Excel en Documentos — ver nota de seguridad en
  la sección de Stack técnico), sin endpoint nuevo en el backend: usa
  `XLSX.utils.json_to_sheet` + `XLSX.writeFile`. Columnas del reporte: Código,
  Nombre, Proceso, Dirección, Tipo, Clase, Naturaleza, Propietario, Custodio,
  Etiquetado, ¿Datos personales?, Confidencialidad, Integridad,
  Disponibilidad, Puntaje, Criticidad, Estado, Fecha de baja.

### Seguimiento Anexo A — Checklists de Organizacionales, Físicos y Tecnológicos
- Ya existía el checklist de **Personas** (A.6.1-A.6.8), hecho a mano con sus
  propios modelos/componentes (2 responsables: Talento Humano + Tecnología).
  Para los 3 grupos restantes (Organizacionales A.5.1-A.5.37, Físicos
  A.7.1-A.7.14, Tecnológicos A.8.1-A.8.34) se construyó **infraestructura
  genérica compartida** en vez de triplicar el código de Personas — Personas
  se dejó intacta, sin tocar.
- Backend (`backend/apps/revisiones/models.py`): clases abstractas
  `RevisionAnexoABase`, `PreguntaChecklistAnexoABase`,
  `RespuestaChecklistAnexoABase` con la lógica común (cálculo de
  `porcentaje_general`/`porcentajes_por_control`, escala de resultado
  C/CP/NC/NE con su puntaje). Cada categoría nueva tiene sus propios modelos
  concretos (`RevisionOrganizacionales`, `PreguntaChecklistFisicos`,
  `RespuestaChecklistTecnologicos`, etc. — 9 modelos en total) con un único
  campo `responsable` (a diferencia de Personas que tiene 2), cuya
  `verbose_name` cambia por categoría ("Responsable de Gestión de Procesos" /
  "Responsable de Infraestructura y Recursos Físicos" / "Responsable de
  Tecnología"). Las vistas (`views.py`) comparten mixins
  (`RevisionAnexoAViewSetMixin`, `RespuestaChecklistAnexoAViewSetMixin`) para
  no repetir 3 veces la lógica de "crear respuestas en blanco al crear la
  revisión" y "solo un admin puede reabrir un checklist finalizado".
- **Bug real detectado y corregido durante la construcción**: ordenar los
  controles por `control_codigo` como texto (ej. para agrupar el checklist)
  pone "A.5.10" antes que "A.5.2" (orden alfabético), algo que nunca se notó
  con Personas porque A.6 solo llega hasta A.6.8. Se agregó un campo
  `control_orden` (entero, calculado en `save()` a partir del número tras el
  último punto de `control_codigo`) a `PreguntaChecklistAnexoABase`, con
  backfill para las preguntas ya sembradas (migración
  `0016_alter_preguntachecklistfisicos_options_and_more`). **Si se agrega un
  cuarto grupo con este mismo patrón, no reintroducir el bug: ordenar por
  `control_orden`, nunca por `control_codigo` como texto.**
- Las preguntas de cada control (catálogo completo de los 85 controles
  restantes del Anexo A, ~198 preguntas) se sembraron con migraciones de
  datos: `0013_seed_preguntas_organizacionales.py`,
  `0014_seed_preguntas_fisicos.py`, `0015_seed_preguntas_tecnologicos.py` —
  cada una con TODOS los controles de su categoría en un solo archivo (a
  diferencia de Personas, que tiene una migración por control porque se fue
  construyendo incrementalmente en sesiones distintas).
- Frontend (`frontend/src/features/seguimientoAnexoA/`): tipos genéricos
  `RevisionAnexoA`/`PreguntaChecklistAnexoA`/`RespuestaChecklistAnexoA` en
  `types.ts` (reutilizables por las 3 categorías, porque comparten la misma
  forma); fábrica `crearApiRevisionAnexoA(prefijo)` en `api.ts` que genera las
  6 funciones de API a partir del prefijo de la categoría (`apiOrganizacionales`,
  `apiFisicos`, `apiTecnologicos`); `configCategorias.ts` con un objeto de
  configuración por categoría (título, rango de controles, etiqueta del
  responsable, funciones de API, query keys, nombre del modelo para permisos).
  Dos componentes genéricos nuevos —`RevisionAnexoAFormModal.tsx` y
  `ChecklistAnexoAModal.tsx`— reciben esa configuración por props y son usados
  por las 3 categorías; `SeguimientoCategoriaPage.tsx` (antes un placeholder
  "aún no implementado") ahora es la página funcional genérica, montada en
  `App.tsx` como `<SeguimientoCategoriaPage config={CONFIG_ORGANIZACIONALES} />`
  (y análogas para Físicos/Tecnológicos). Los componentes específicos de
  Personas (`RevisionPersonasFormModal.tsx`, `ChecklistPersonasModal.tsx`,
  `SeguimientoPersonasPage.tsx`) **no se tocaron ni se generalizaron** — siguen
  siendo su propia implementación, para no arriesgar la funcionalidad ya en uso.
- Probado end-to-end contra el backend real (crear revisión Organizacionales →
  92 respuestas en blanco generadas → responder una → verificar
  `porcentaje_general` y `porcentajes_por_control` → finalizar → eliminar sin
  dejar huérfanos), sin dejar datos de prueba.

### Usuarios
- El campo "Área" fue reemplazado por "Dirección" (FK, `Dirección 1 — N
  Usuarios`). El módulo de Usuarios (menú, ruta y API) solo es visible para
  administradores (`is_superuser`).

### Riesgos
- `activos` es multi-selección (M2M), no un solo activo.
- Se eliminó el campo/modelo `Vulnerabilidad` por completo.
- `Probabilidad` (1-5) e `Impacto` (1/5/10/15/20) son listas desplegables con
  nombre y descripción, no números libres.
- `Riesgo inherente` = Probabilidad × Impacto.
- `Nivel de riesgo` (Bajo/Medio/Alto/Crítico) es una **matriz de referencia
  exacta 5×5** de la entidad (`Riesgo._MATRIZ_NIVEL_DE_RIESGO` en el backend, y
  copia idéntica en `frontend/src/features/riesgos/nivelRiesgo.ts`). Si se
  ajusta, editar **ambos** archivos.
- Mapa de calor visual (`MapaCalorRiesgosModal`) accesible desde el formulario y
  la lista.
- El campo `estado` de Riesgo se eliminó del modelo; la "Opción de Tratamiento"
  (Mitigar/Transferir/Evitar/Aceptar) vive en `TratamientoRiesgo`, con
  formulario propio en el frontend (`GestionarTratamientoModal`).
- **`codigo` de Riesgo (R-001, R-002...) es autogenerado, secuencial y
  no editable** desde el formulario (se quitó el campo del formulario de
  creación). Backend: `Riesgo.save()` llama a `_siguiente_codigo()` (mismo
  patrón que `Hallazgo`/`Incidente` con prefijos `H-`/`INC-`) si `codigo` viene
  vacío; `codigo` está en `read_only_fields` del serializer.
- **Tarjetas KPI** (`RiesgosPage.tsx`): "Total" + una por cada estado de
  tratamiento (`Sin tratamiento` / `Pendiente` / `Vencido` / `Completado`,
  calculado sobre el tratamiento más reciente de cada riesgo), clicables
  (toggle) para filtrar la tabla. Cada tarjeta muestra un **desglose por Nivel
  de riesgo** (Crítico/Alto/Medio/Bajo) debajo del número. Las tarjetas usan
  `Row align="stretch"` + `Card height:'100%'` para que todas queden de la
  misma altura aunque alguna no tenga desglose que mostrar (p.ej. "Sin
  tratamiento" en 0).
- Columna **"Amenaza"** de la tabla: el texto visible es `amenaza_nombre`
  (`Amenaza.nombre`, `CharField(max_length=150)` — puede venir truncado si el
  dato original era más largo). El **tooltip al pasar el mouse** usa
  `amenaza_descripcion` (`Amenaza.descripcion`, `TextField` sin límite, suele
  tener el texto completo) con fallback a `amenaza_nombre` si no hay
  descripción — expuesto como `amenaza_descripcion` en `RiesgoSerializer`.

### Documentos (control de versiones estilo ISO 9001)
- Se eliminó el campo `descripcion` de `Documento`.
- Las nuevas versiones de un documento **ya NO crean una fila nueva** en la
  tabla de Documentos: se acumulan como historial en `VersionDocumento`
  (versión, `fecha_version`, cambios/descripción, responsable, archivo
  evidencia). Al crear un `Documento` con archivo se genera automáticamente la
  "Versión inicial" (`DocumentoViewSet.perform_create`); al agregar una nueva
  `VersionDocumento` se sincroniza `Documento.version_actual`/`archivo`
  (`VersionDocumentoViewSet.perform_create`).
- El **título/nombre del documento es clicable** y abre
  `HistorialVersionesModal` con todas las versiones históricas + formulario
  para agregar una nueva.
- **Vista previa de archivos** (`PrevisualizarDocumentoModal.tsx`): soporta
  PDF, imágenes (png/jpg/jpeg), texto plano (txt/csv) y **Excel**
  (xlsx/xls/xlsm — parseado en el navegador con `xlsx`/SheetJS, renderizado
  como tabla HTML con pestañas si el libro tiene varias hojas). Otros formatos
  (doc, ppt, zip...) solo se pueden descargar.
- **Tarjetas KPI** (`DocumentosPage.tsx`) agrupadas por **Tipo** (11 tipos fijos
  del enum `TipoDocumento`): "Total" + una por tipo, paleta categórica de 11
  colores (8 validados del skill de dataviz + 3 extendidos), clicables (toggle).

### Hallazgos de auditoría
- **Tarjetas KPI** (`HallazgosPage.tsx`) por columna **Estado**
  (`ABIERTA`/`EN_PROCESO`/`CERRADA`): "Total" + una por estado, clicables
  (toggle), mismos colores que la columna Estado y la gráfica del Dashboard.

### Interfaz general (Shell / layout)
- Header superior y menú lateral usan el **mismo color** (`BRAND.tealDark`) —
  tanto en `main.tsx` (token `Layout.headerBg`) como en el `style` inline del
  `Header` en `Shell.tsx` (que tiene prioridad sobre el token). Íconos/texto del
  header en blanco para contraste.
- El `Header` es **sticky** (`position: sticky; top: 0; zIndex: 10`), igual que
  el `Sider` — al hacer scroll en el contenido, tanto el menú lateral como la
  barra superior quedan siempre visibles.
- Patrón de **tarjetas KPI clicables** replicado en Activos, Riesgos, Hallazgos
  y Documentos: cada página define localmente `TarjetaKpi` + `fondoClaro()`
  (no está extraído a un componente compartido — se mantuvo duplicado a
  propósito, seguir el mismo patrón si se agrega a un módulo nuevo). Fondo de
  la tarjeta = color del estado/categoría al 14% de opacidad (22% si está
  seleccionada), barra lateral de 4px con el color sólido, número grande +
  etiqueta, clic hace toggle de un filtro sobre la tabla, con tag "Filtrando
  por: X" cerrable junto al buscador.

## 6. Bug corregido (para no reintroducirlo)

En `frontend/src/shared/api/client.ts` había un interceptor de Axios que, ante
**cualquier** 401 (incluido el del propio login con credenciales incorrectas),
intentaba refrescar el token y —al fallar— hacía `window.location.href =
'/login'`, recargando la página y borrando el mensaje de error. Se corrigió
excluyendo `/auth/token/`, `/auth/token/verificar-otp/` y
`/auth/token/refresh/` de esa lógica. Revisar que esta exclusión siga vigente
si se tocan las rutas de autenticación.

## 7. Pendientes / cosas sin resolver

- No hay backups automáticos configurados para SQL Server.
- Un registro de Activo se perdió en la migración temprana (código `890601`,
  "ANAS WAYUU EPSI") y nunca se recuperó — reingresar manualmente si hace falta.
- Posible error de tipeo sin confirmar: código de dirección "DAU" con
  descripción "Dierección de auditoria".
- Sin confirmar: interpretación de "LaaS" como "IaaS" en una fila de
  servidores GCP del import de Activos.
- El dashboard tiene ya varias gráficas por módulo (Activos, Riesgos,
  Hallazgos, Objetivos, Indicadores) — no revisado a fondo si falta alguna
  combinación pedida por el usuario.

## 8. Dónde están las credenciales

Todo vive en `backend/.env` (gitignored). Incluye: `DB_ENGINE`, credenciales de
SQL Server, `DJANGO_SECRET_KEY`, credenciales SMTP (Gmail) para OTP por correo.

**Usuario administrador actual:** `oficialseguridad@epsianaswayuu.com`
(superusuario, con 2FA por aplicación ya activado).
