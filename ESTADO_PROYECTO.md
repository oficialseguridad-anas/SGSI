# Estado del proyecto — SGSI ISO/IEC 27001:2022 (ANAS WAYUU EPSI)

Documento de referencia para retomar el proyecto en cualquier momento, sin depender
de que Claude recuerde la conversación anterior. **Este archivo se debe mantener
actualizado en cada sesión** — al terminar cambios relevantes (nuevo módulo,
decisión de diseño, cambio de flujo, pendiente nuevo), reflejarlos aquí.

Última actualización: 2026-09-22 (agregado módulo de Revisión por la Dirección,
cláusula 9.3; el modelo/módulo `Empleado` como directorio de personas separado
de `Usuario`; descarga de evidencia por cada acta finalizada — **terminó como
.docx rellenando la plantilla Word oficial real, no PDF**; backups
automáticos diarios de SQL Server + media + código de la aplicación, con botón de
ejecución manual en el frontend y aviso por correo; y el módulo de **Auditoría
Interna (cláusula 9.2)** completo — Matriz de Priorización, Programa Anual,
Auditorías con Plan/Cronograma/Checklist, conectado al módulo de Hallazgos ya
existente, con la auditoría real de diciembre 2025 cargada (Plan + Informe +
Checklist reales, 40 hallazgos, 119 items) y su informe descargable en Word
**y en Excel con el formato real FO-860-22** — ver sección 5).

## 0. Opinión sobre cobertura frente a la norma (para retomar el roadmap)

En 2026-09-22 se le dio al usuario una evaluación honesta de qué tanto este
proyecto sirve como SGSI real frente a ISO/IEC 27001:2022, con una lista
priorizada de ajustes/mejoras/creaciones. Resumen para no repetir el análisis
desde cero en la próxima sesión:

- **🔴 Crítico (ambos resueltos):**
  1. ~~Revisión por la Dirección (9.3)~~ — **hecho** en esta sesión (ver
     sección 5).
  2. ~~Backups automáticos de SQL Server~~ — **hecho** en esta sesión (base de
     datos + carpeta `media`, diario 2 a.m., retención de 14) — falta solo que
     el usuario registre la Tarea Programada de Windows como Administrador
     (un comando, ver sección 5, "Backups automáticos").
- **🟠 Importante:**
  3. ~~Programa de auditoría interna (9.2)~~ — **hecho** en esta sesión: Matriz
     de Priorización + Programa Anual + Auditorías (Plan/Cronograma/
     Checklist) + informe en Word, conectado al módulo de Hallazgos ya
     existente (ver sección 5, "Auditoría Interna").
  4. Desconexión entre "Controles (SoA)" y "Seguimiento Anexo A": son dos
     fuentes de verdad separadas sobre si un control está implementado — no
     están cruzadas.
  5. Registro de requisitos legales/contractuales (5.31) como matriz viva
     (hoy solo es una pregunta de checklist genérica).
  6. Registro de proveedores (5.19-5.23): 5 controles de Anexo A sin un
     maestro de datos "Proveedor" al que amarrar la evidencia.
- **🟡 Recomendable:** trazabilidad de cambios (audit trail) — **corrección**:
  ya existe el modelo `BitacoraAccion` en `apps/accounts/models.py` (usuario,
  timestamp, `content_type`/`object_id` genéricos, acción CREATE/UPDATE/
  DELETE/APPROVE/CLOSE, `detalle` JSON), pero **no está conectado a nada** —
  ningún viewset lo llena (`grep BitacoraAccion.objects.create` no da
  resultados fuera de la definición del modelo). Si se retoma este punto, la
  tarea real es "conectar `BitacoraAccion` a los viewsets", no "diseñar un
  audit trail desde cero". Dashboard de "madurez del SGSI" combinando SoA +
  checklists + riesgos + objetivos sigue sin empezar.
- **Extra no listado originalmente, resuelto en 2026-09-22**: el usuario notó
  que casi todos los campos "responsable"/"revisor"/"preside" en el proyecto
  apuntan a `Usuario` (cuenta de acceso al sistema), obligando a crear una
  cuenta con login solo para poder *nombrar* a alguien (ej. un gerente que
  preside una Revisión por la Dirección pero nunca entra a la app). Se
  resolvió con un modelo `Empleado` nuevo — ver sección 5 ("Empleados: un
  directorio de personas separado de Usuario"). Se aplicó primero solo a
  Revisión por la Dirección; **hay que preguntar al usuario, módulo por
  módulo, antes de migrar los demás campos "responsable" existentes** (no
  hacerlo de oficio: son migraciones de esquema sobre tablas con datos reales).
- Si el usuario pide seguir el roadmap, preguntar cuál de estos sigue antes
  de asumir — no repetir automáticamente el orden sugerido.

## 1. Qué es esto

Aplicación web de Sistema de Gestión de Seguridad de la Información (SGSI) para
ANAS WAYUU EPSI, alineada a ISO/IEC 27001:2022. Módulos activos (ver menú lateral
real en `frontend/src/shared/layout/Shell.tsx`):

Dashboard, Activos, Riesgos, Controles (Anexo A / SoA), Seguimiento Anexo A
(Organizacionales / Personas / Físicos / Tecnológicos), Hallazgos de auditoría,
Matriz de incidentes, Documentos, Indicadores, Objetivos, Revisión por la
Dirección, Empleados, Usuarios, Seguridad (2FA).

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
| Cuentas / 2FA / Usuarios / Empleados | `accounts` | `accounts` |
| Activos | `activos` | `activos` |
| Riesgos | `riesgos` | `riesgos` |
| Controles (Anexo A / SoA) | `controles` | `controles` |
| Seguimiento Anexo A (checklist Personas, etc.) | `revisiones` (p.ej. `RevisionPersonas`, checklist) | `seguimientoAnexoA` |
| Hallazgos de auditoría | `auditorias` (`Hallazgo`, `SeguimientoHallazgo`, `TipoHallazgo`) | `auditorias` |
| Matriz de incidentes | `incidentes` (`Incidente`, `ArchivoAdjuntoIncidente`) | `incidentes` |
| Documentos (con control de versiones) | `documentos` (`Documento`, `VersionDocumento`) | `documentos` |
| Indicadores | `indicadores` (`Indicador`, `SeguimientoIndicador`) | `indicadores` |
| Objetivos | `objetivos` (`Objetivo`, `ActividadObjetivo`) | `objetivos` |
| Revisión por la Dirección (9.3) | `revisiones` (`RevisionDireccion`, `CompromisoRevisionDireccion`) | `revisionDireccion` |
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

### Revisión por la Dirección (ISO/IEC 27001:2022, cláusula 9.3)
- Primer ítem del roadmap de gap-analysis (sección 0) — no existía ningún
  módulo que cubriera la revisión formal y periódica del SGSI por la Alta
  Dirección, con las entradas/salidas específicas que exige 9.3.2/9.3.3.
- Backend: modelos nuevos en `backend/apps/revisiones/models.py` (mismo app
  que los checklists de Anexo A, porque también es una "revisión periódica
  del SGSI", pero **no** hereda de `RevisionAnexoABase` — es un acta de
  reunión con secciones de texto, no un checklist de preguntas):
  - `RevisionDireccion`: periodo (texto libre, ej. `"2026-S2"`), fecha,
    `preside` (FK Usuario), `asistentes` (M2M), `lugar_modalidad`, y **un
    campo de texto por cada entrada de 9.3.2** (a, b, c, d.1-d.4, e, f, g) +
    `conclusiones_generales` + `finalizada`.
  - `CompromisoRevisionDireccion`: las salidas/decisiones (9.3.3) — FK a la
    revisión, descripción, responsable, fecha límite, `estado`
    (Pendiente/En proceso/Completado) y `esta_vencido` (property). **A
    diferencia de las respuestas de checklist, los compromisos NO se
    bloquean cuando `RevisionDireccion.finalizada=True`** — su estado debe
    poder seguir avanzando hasta la próxima revisión, porque son
    justamente la fuente de la entrada a) "estado de acciones previas" de
    la siguiente acta.
  - **`RevisionDireccion.resumen_datos`** (property, no se guarda, se
    calcula al vuelo en cada `GET`): trae cifras reales de otros módulos
    para que quien diligencia el acta no tenga que ir módulo por módulo —
    riesgos por nivel + tratamientos pendientes/vencidos, hallazgos por
    estado, actividades de objetivos por estado, indicadores al día/que
    cumplen meta, total de incidentes, y de la última revisión finalizada
    anterior (para la sección a): su periodo, fecha, `conclusiones_generales`
    y sus compromisos (`revision_anterior_periodo`, `revision_anterior_fecha`,
    `revision_anterior_conclusiones`, `compromisos_revision_anterior`) — el
    frontend muestra todo esto en una caja encima del textarea de la
    sección a), para que quien diligencia el acta parta de un resumen real
    de la revisión pasada en vez de una caja vacía. Hace imports perezosos
    de `apps.riesgos`, `apps.auditorias`, `apps.objetivos`,
    `apps.indicadores`, `apps.incidentes` dentro del método (evita import
    circular a nivel de módulo).
  - **Cuidado al tocar esto**: `TratamientoRiesgo.estado`,
    `Hallazgo.estado` y `ActividadObjetivo.estado_ejecucion` son
    **`@property` calculadas, no campos de BD** — no se pueden usar en
    `.filter(estado=...)` desde el ORM (ya pasó este error una vez al
    construir `resumen_datos`: hay que traer los objetos con `list(...)` y
    contar en Python).
  - **Bug real #2, corregido 2026-09-22**: "la revisión anterior" se buscaba
    con `fecha_revision__lt=self.fecha_revision`, pero dos actas pueden
    compartir la misma `fecha_revision` (ej. ambas creadas el mismo día) — en
    ese caso `__lt` nunca encontraba la anterior y la sección a) se veía
    vacía aunque sí existiera una revisión finalizada. Se corrigió
    comparando por `id__lt=self.pk` (orden real de creación) en vez de por
    fecha. **Si se toca esta lógica de nuevo, nunca comparar revisiones por
    `fecha_revision` — usar `id` o `creado_en`.**
  - **`compromisos_pendientes_anteriores`** (property nueva, mismo criterio
    que `resumen_datos`): trae los compromisos que quedaron en
    `PENDIENTE`/`EN_PROCESO` en **cualquier** revisión anterior (no solo la
    inmediatamente pasada), para que la sección de Salidas de la revisión
    actual permita seguirles dando cierre sin ir a buscar cada acta vieja.
    Expuesto en el serializer con el mismo
    `CompromisoRevisionDireccionSerializer` de siempre (ahora con
    `revision_periodo` agregado, para que el frontend pueda mostrar de qué
    acta viene cada compromiso). El frontend combina
    `revision.compromisos` + `revision.compromisos_pendientes_anteriores` en
    una sola tabla con columna "Origen" (`DetalleRevisionDireccionDrawer.tsx`).
- Frontend: módulo nuevo `frontend/src/features/revisionDireccion/` (ruta
  `/revision-direccion`, ítem propio en el menú lateral, no dentro de
  "Seguimiento Anexo A"). `RevisionDireccionPage.tsx` lista las actas +
  botón "Nueva revisión" (`NuevaRevisionDireccionModal.tsx`, formulario
  corto: periodo/fecha/preside/asistentes/lugar). Al crearla abre de una vez
  `DetalleRevisionDireccionDrawer.tsx` — un `Drawer` grande con una sección
  por cada entrada de 9.3.2 (cada una con una "caja resumen" de cifras
  reales encima del textarea correspondiente), la tabla de compromisos con
  formulario inline para agregar uno nuevo, y los botones "Guardar cambios"
  / "Finalizar acta" / "Reabrir (administrador)" — mismo patrón de
  finalización que los checklists del Anexo A.
- **Evidencia del acta: PDF (xhtml2pdf) descartado, ahora es Word (.docx
  rellenando la plantilla oficial real) — decisión y migración completa el
  2026-09-22.** Historia completa por si se retoma este tema:
  1. Primero se generó PDF con `xhtml2pdf` (encabezado propio, luego
     ajustado al membrete institucional real extrayendo logos de un PDF ya
     cargado en Documentos).
  2. El usuario pidió una franja lateral fija ("Vigilado Supersalud")
     repetida en cada página, como en el membrete real. Se probó con
     `@frame` + `-pdf-frame-content` de xhtml2pdf (el único mecanismo ahí
     para repetir contenido estático por página, ya que no soporta
     `position: fixed`). **Resultado: al declarar `@frame` para el
     contenido del documento, xhtml2pdf dejó de paginar automáticamente** —
     un acta con texto largo que debía generar 2 páginas generó 1 sola con
     todo el contenido superpuesto e ilegible (confirmado con `pypdf`:
     `len(reader.pages) == 1` en vez de 2, no solo "se veía mal").
  3. Se le presentó el problema al usuario con 3 opciones (cambiar a
     WeasyPrint, pasar a Word, o dejar el PDF sin la franja lateral). Eligió
     **Word**, y resultó que **sí tenía la plantilla oficial real** (el
     usuario la tenía guardada como `formato.docx` en la raíz del repo).
  4. **Se abandonó xhtml2pdf por completo** (desinstalado, quitado de
     `requirements.txt`, borrada la plantilla HTML
     `apps/revisiones/templates/revisiones/acta_revision_direccion_pdf.html`
     y los assets PNG que se habían extraído para ella en
     `apps/core/static/core/` — ya no se usan).
  - **Plantilla real**: copiada a
    `backend/apps/revisiones/docx_templates/membrete_institucional.docx`
    (el original del usuario queda también en la raíz del repo,
    `formato.docx`, como referencia/fuente). Es la plantilla oficial de
    ANAS WAYUU EPSI con el membrete completo ya armado (logos, franja
    lateral "Vigilado Supersalud" en su posición real, pie de página con
    dirección/teléfono/redes sociales) y el cuerpo vacío — el generador
    **no reconstruye nada del membrete**, solo agrega contenido al cuerpo
    del documento con `python-docx`, dejando encabezado/pie intactos. Word
    repite el encabezado/pie/franja lateral en cada página de forma nativa
    — el bug de paginación de xhtml2pdf no existe aquí.
  - **Ojo con los estilos**: la plantilla real **no tiene estilos
    "Heading 1"/"Heading 2" definidos** (se verificó recorriendo
    `doc.styles`: solo trae `Normal`, `Header`, `Footer`, `Table Grid`,
    etc.) — `Document.add_heading()` habría fallado con `KeyError`. Todo el
    texto de títulos/secciones se arma con párrafos + formato manual
    (negrita/color/tamaño), nunca con `add_heading()`. `Table Grid` sí
    existe y se usa para las tablas.
  - Generador: `backend/apps/revisiones/docx_builder.py`
    (`generar_acta_docx(revision)`, devuelve un `BytesIO`) — arma: título +
    subtítulo, tabla de info (fecha/estado/preside/asistentes/lugar), cada
    sección de 9.3.2 (a-g, con d.1-d.4) con su caja de cifras reales +
    texto del usuario, conclusiones generales, y la tabla de compromisos
    (9.3.3). El sombreado de celdas (encabezado de tabla en teal, filas de
    la tabla de info) se hace manipulando XML directo (`w:shd`) porque
    python-docx no tiene API de alto nivel para eso.
  - Endpoint: `GET /api/v1/revisiones-direccion/{id}/docx/`
    (`RevisionDireccionViewSet.docx`, un `@action` DRF — antes se llamaba
    `pdf`) — sigue devolviendo 400 si el acta no está finalizada, mismo
    criterio que antes. Content-Type
    `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
  - Frontend: `descargarActaDocx(id, periodo)` en `revisionDireccion/api.ts`
    (antes `descargarActaPdf`) — mismo helper
    `shared/api/descargarArchivo.ts` de siempre. Botones renombrados de
    "PDF"/"Descargar evidencia (PDF)" a "Word"/"Descargar evidencia (Word)"
    en `RevisionDireccionPage.tsx` y `DetalleRevisionDireccionDrawer.tsx`.
  - Probado end-to-end: 400 antes de finalizar, 200 con `.docx` válido
    después (`python-docx` lo vuelve a abrir sin error), y **con texto
    largo forzando 2+ páginas para confirmar que ya no se rompe** — Word sí
    pagina bien de forma nativa. Verificado que los acentos/caracteres
    especiales están correctamente en UTF-8 en el XML interno del `.docx`
    (revisando bytes crudos) — si algo se ve como "�" en la salida de un
    script de prueba en la terminal de Git Bash, es solo un problema de
    codepage de la consola al imprimir, **no** una corrupción real del
    archivo — no hay que "arreglar" el generador por eso.
  - **El archivo `formato.docx` extraído reveló assets institucionales de
    mejor calidad que los que se habían sacado antes del PDF** (logo
    circular EPSI e íconos de redes sociales en alta resolución,
    `word/media/image2.png`, `image4.png`, `image6.png` dentro del
    `.docx`) — no se usaron directamente porque ya no hace falta reconstruir
    el membrete a mano, pero quedan disponibles dentro de la plantilla por
    si se necesitan para otro documento.
- Probado end-to-end contra el backend real (crear revisión → verificar
  `resumen_datos` con las cifras reales de los 25 riesgos/17 hallazgos/
  5 objetivos/11 indicadores/17 incidentes existentes → crear compromiso →
  finalizar el acta → confirmar que el compromiso se puede seguir editando
  después de finalizada → limpieza). **Nota:** un primer intento de prueba
  falló por el bug de `TratamientoRiesgo.estado` arriba descrito, y como el
  `create()` de DRF ya había hecho el `INSERT` antes de fallar al serializar
  la respuesta, dejó una `RevisionDireccion` de prueba huérfana en la BD
  real — se detectó y se limpió manualmente. Si se repite un patrón similar
  (error después de guardar pero durante la respuesta), revisar si quedó
  basura antes de dar por buena la limpieza automática del script de prueba.

### Empleados — directorio de personas separado de Usuario
- Motivo (ver sección 0): muchos módulos exigían un `Usuario` (cuenta de
  acceso al sistema) solo para poder *nombrar* a alguien como responsable/
  revisor/preside/asistente — obligando a crear cuentas de login para
  personas (ej. alta gerencia) que no necesariamente deben tener acceso al
  SGSI.
- Backend: modelo nuevo `Empleado` en `backend/apps/accounts/models.py`
  (nombre_completo, cargo, correo, activo) — **antes** de la clase `Usuario`
  en el archivo. `Usuario.empleado` es un `OneToOneField(Empleado, null=True,
  blank=True)`: un Usuario es, opcionalmente, un Empleado al que además se
  le dio acceso. Migración de datos
  (`accounts/migrations/0008_seed_empleados_desde_usuarios.py`) creó
  automáticamente un `Empleado` para cada `Usuario` ya existente y los
  vinculó, así que todo el personal que ya tenía cuenta sigue apareciendo
  igual en los selectores. Endpoint `/api/v1/empleados/`
  (`EmpleadoViewSet`) — a propósito **no** restringido a administradores
  (`IsAuthenticated, DjangoModelPermissions`, igual que la mayoría de
  catálogos), porque cualquier módulo puede necesitar agregar una persona
  nueva al vuelo. El serializer expone `tiene_usuario` (bool) para
  distinguir en la UI quién sí tiene cuenta.
- Frontend: página nueva `frontend/src/features/accounts/pages/EmpleadosPage.tsx`
  (ruta `/empleados`, ítem de menú propio "Empleados", **no** dentro de
  `AdminRoute` — a diferencia de Usuarios) — CRUD simple de directorio.
- **Aplicado por ahora solo a Revisión por la Dirección** (primer caso de
  uso, acordado explícitamente con el usuario): `RevisionDireccion.preside`/
  `asistentes` y `CompromisoRevisionDireccion.responsable` cambiaron de FK/M2M
  a `settings.AUTH_USER_MODEL` → FK/M2M a `'accounts.Empleado'`
  (`revisiones/migrations/0018_...`). Fue seguro hacerlo con `AlterField`
  directo porque esas tablas no tenían datos reales todavía (se verificó
  `.count() == 0` antes de migrar). Probado con un `Empleado` creado sin
  `Usuario` asociado, asignado como `preside`/`asistente`/`responsable` — funciona.
- **Los demás módulos (Riesgos, Objetivos, Documentos, Hallazgos,
  Indicadores, Incidentes, los 4 checklists del Anexo A) siguen usando
  `Usuario` directamente para sus campos de responsable/revisor** — eso fue
  una decisión deliberada de alcance, no un olvido. Si se necesita extender
  el patrón a alguno de ellos, esas tablas sí tienen datos reales, así que la
  migración debe preservar los valores existentes (mapear cada `Usuario` ya
  asignado a su `Empleado` vinculado 1:1, no un `AlterField` directo como en
  Revisión por la Dirección).
- **Carga masiva por Excel** (a pedido del usuario, 2026-09-23): botones
  "Plantilla" (descarga un `.xlsx` en blanco) e "Importar" en
  `EmpleadosPage`. Backend: `apps/accounts/excel_empleados.py`
  (`generar_plantilla_empleados_xlsx` / `importar_empleados_desde_xlsx`,
  generado desde cero con openpyxl — `Empleado` no es un formato FO-860 real
  del SGSI, a diferencia de las plantillas de Auditoría, así que no hay nada
  que rellenar) + `PlantillaEmpleadosView`/`ImportarEmpleadosView` en
  `apps/accounts/views.py`, rutas `/api/v1/empleados-plantilla/` y
  `/empleados-importar/`. La importación empareja por correo (si la fila
  trae uno) o si no por nombre completo exacto, para **actualizar en vez de
  duplicar** si se reimporta el mismo archivo corregido.
  **Bug real encontrado y corregido antes de entregarlo**: la primera
  versión de la plantilla traía una fila de ejemplo ("Juana Pérez Gómez")
  como dato real en la fila 2 — se probó importar la plantilla tal cual, sin
  editarla, y efectivamente creó ese empleado ficticio de verdad. Corregido
  moviendo el ejemplo a un comentario de celda (`openpyxl.comments.Comment`)
  en el encabezado de cada columna, dejando la fila 2 vacía para que el
  usuario escriba ahí su primer dato real. Probado end-to-end (plantilla →
  importar → reimportar el mismo archivo → confirmar que actualiza y no
  duplica) contra las vistas reales, no solo el builder aislado.

### Hallazgos ↔ Lista de verificación — vínculo manual desde el módulo de Hallazgos
- Motivo (2026-09-23): los 40 hallazgos reales de `AUD-2025-001` (migración
  0015) se crearon directamente desde el Informe (FO-860-22), no desde la
  Lista de Verificación (FO-860-25) — así que ningún `ItemVerificacionAuditoria`
  de los 119 quedó apuntando a su hallazgo real vía `hallazgo_generado` (el
  emparejamiento automático se descartó a propósito por ser ambiguo, ver
  sección de Auditoría Interna más arriba). El usuario pidió poder armar ese
  vínculo a mano, hallazgo por hallazgo, para tener trazabilidad de qué
  elemento(s) del checklist originó cada uno y así ver más adelante qué ya
  quedó subsanado.
- `ItemVerificacionAuditoria.hallazgo_generado` **ya existía** como FK
  (item → hallazgo, puesta antes solo por el botón "Generar hallazgo" del
  checklist) — lo único que faltaba era poder **editarla directamente**: se
  quitó de `read_only_fields` en `ItemVerificacionAuditoriaSerializer` (antes
  solo se podía fijar a través de la acción `generar-hallazgo`, ahora
  también con un PATCH normal). `HallazgoSerializer` ganó
  `items_checklist_relacionados` (lectura, lista de los items ya vinculados
  a ese hallazgo vía la relación inversa `items_verificacion_origen`).
- Frontend: `HallazgoFormModal.tsx` (el modal de editar hallazgo, en el
  módulo de Hallazgos) — cuando el hallazgo tiene `auditoria` asignada,
  muestra un multi-select con los items del checklist de ESA auditoría
  (`fetchItemsVerificacion(auditoriaId)`, nuevo en `auditoriaInterna/api.ts`),
  preseleccionado con los ya vinculados. Al guardar, calcula el diff
  (agregados/quitados) y hace un PATCH por cada item cambiado
  (`vincularItemAHallazgo(itemId, hallazgoId | null)`). **El selector excluye
  items que ya están vinculados a OTRO hallazgo distinto** (a propósito, para
  no robarle el vínculo a otro hallazgo por accidente al seleccionar de más).
  No aparece nada de esto para hallazgos sin `auditoria` (la mayoría de los
  hallazgos del sistema, que no vienen de este módulo de Auditoría Interna).
  Probado end-to-end (vincular → confirmar que aparece en
  `items_checklist_relacionados` → desvincular → confirmar que desaparece)
  contra las vistas reales.
- **Duplicados reales encontrados y resueltos (2026-09-23)**: al probar el
  campo nuevo, el usuario abrió `H-001` (uno de los 17 hallazgos que ya
  existían antes de esta sesión) y notó que no tenía el campo — porque no
  estaba vinculado a ninguna auditoría. Al investigar por qué, se encontró
  que **5 de los 40 hallazgos cargados en la migración 0015 eran duplicados
  exactos de hallazgos que el equipo ya había registrado y venía
  gestionando** (misma descripción textual, 1-3 seguimientos reales cada
  uno, estado `CERRADA`) — es decir, alguien del equipo ya había cargado a
  mano algunos hallazgos de esta misma auditoría de diciembre 2025 antes de
  que se hiciera la carga masiva automática. Resuelto con el usuario (le
  pregunté cómo prefería resolverlo): migración
  `0019_resolver_duplicados_hallazgos_2025.py` — se conservaron los 5
  hallazgos VIEJOS (con su historial de seguimiento intacto: H-001, H-002,
  H-005, H-007, H-014), se les asignó `auditoria=AUD-2025-001`, y se
  eliminaron sus 5 duplicados nuevos sin seguimiento (H-030, H-043, H-040,
  H-052, H-056). Total de hallazgos pasó de 57 a 52. **Lección para el
  futuro**: antes de cargar hallazgos masivamente desde un documento externo,
  buscar coincidencias de texto contra los hallazgos ya existentes en la
  base — no asumir que la tabla está vacía de ese contenido solo porque la
  carga automática es nueva.
- **Reversión total de la carga masiva + rediseño a pestañas por año
  (2026-09-23, decisión final del usuario)**: después de resolver los 5
  duplicados, el usuario decidió que NO quiere que la carga masiva desde el
  Informe siga viviendo como registros de `Hallazgo` — prefiere que el
  módulo de Hallazgos se mantenga limpio (solo lo creado a mano o vía
  "Generar hallazgo" del checklist) y relacionar él mismo, desde una
  columna dedicada, los hallazgos preexistentes con los items de la Lista
  de Verificación de la auditoría real. **Lección para el futuro: no volver
  a cargar hallazgos en bloque desde un documento narrativo de auditoría —
  solo vía "Generar hallazgo" del checklist, o creación manual, con
  relación explícita a items existentes cuando aplique.**
  - Migración `0020_revertir_hallazgos_masivos_2025.py`: de los 35
    hallazgos restantes de la carga masiva (los 40 originales menos los 5
    ya fusionados en la 0019), se **eliminaron los 35**; a los 5 viejos
    fusionados (H-001, H-002, H-005, H-007, H-014) se les **quitó**
    `auditoria` (vuelve a `None`) para que el usuario los relacione él
    mismo con la columna nueva — no se tocó su historial de seguimiento.
    Total de hallazgos volvió a **17** (verificado por consulta directa).
    No se tocó la `Auditoria` AUD-2025-001 en sí, ni su Plan, Cronograma ni
    los 119 `ItemVerificacionAuditoria` (la Lista de Verificación real
    sigue intacta).
  - `HallazgosPage.tsx` ahora agrupa los hallazgos en pestañas (`Tabs` de
    antd) por año de `fecha_deteccion`, más reciente primero (hoy solo
    existe la pestaña 2025, con los 17). Los KPIs, la búsqueda y el filtro
    de estado siguen siendo globales (sobre todos los años); lo que cambia
    por pestaña es la tabla y sus columnas.
  - El botón para relacionar un hallazgo con el checklist de su auditoría
    **vivió primero como columna de tabla** ("Auditoría relacionada"), pero
    el usuario pidió moverlo (2026-09-23: "sera que mejor se incluye la
    columna... en la de seguimiento del hallazgo") dentro del modal
    **"Seguimiento del hallazgo"** (`GestionarSeguimientoModal.tsx`), junto
    al botón "Agregar seguimiento", para no ocupar una columna entera de la
    tabla solo con botones repetidos. `GestionarSeguimientoModal` ganó dos
    props opcionales: `auditoriaRelacionada` (la `Auditoria` del año del
    hallazgo abierto, resuelta en `HallazgosPage.tsx` con el mismo mapa
    `auditoriaPorAnio` usado para las pestañas) y `onRelacionar` (abre
    `RelacionarChecklistModal` — el estado y el propio modal se quedaron en
    `HallazgosPage.tsx`, `GestionarSeguimientoModal` solo dispara el
    callback). El botón solo aparece si el año del hallazgo tiene una
    auditoría real y el usuario tiene `auditorias.change_hallazgo`.
  - `RelacionarChecklistModal.tsx` (el modal que se abre desde ahí, extraído
    de la lógica que antes vivía dentro de `HallazgoFormModal.tsx`):
    multi-select de los
    items del checklist de esa auditoría (**excluyendo Fortalezas y
    Conformidades**, a pedido del usuario — 2026-09-23: ninguna de las dos
    es una no conformidad ni requiere subsanación, así que no tiene sentido
    relacionarlas con un hallazgo — solo quedan seleccionables No
    Conformidad y Oportunidad de Mejora; **y excluyendo los items ya
    vinculados a OTRO hallazgo distinto**, para no robarle el vínculo por
    accidente),
    guarda el diff con `vincularItemAHallazgo` por item, y además fija/quita
    `Hallazgo.auditoria` según si quedó algún item seleccionado
    (`vincularHallazgoAAuditoria`, nuevo en `features/auditorias/api.ts`,
    `PATCH /hallazgos/:id/` solo con el campo `auditoria`). Cada opción del
    selector muestra también, en gris debajo del título, el
    `descripcion_hallazgo` real del item del checklist (`optionRender` de
    antd — a pedido del usuario, 2026-09-23, para poder comparar el texto
    narrativo del checklist contra la descripción del hallazgo antes de
    relacionarlos); la búsqueda (`filterOption`) también matchea contra ese
    texto, no solo contra el título.
  - `HallazgoFormModal.tsx` (el modal de crear/editar hallazgo) **ya no
    tiene** el campo de relación con el checklist — se removió por completo
    junto con su lógica de diff/guardado, para no duplicar el mecanismo en
    dos lugares distintos. La relación se hace solo desde la columna.
  - **Nada de esto requirió cambios de backend más allá del PATCH de
    `auditoria`** (ya lo hacía escribible el serializer): la acción
    "Generar hallazgo" del checklist (`ItemVerificacionAuditoriaViewSet.
    generar_hallazgo`) ya fijaba `fecha_deteccion=item.auditoria.
    fecha_auditoria` y `auditoria=item.auditoria` desde antes — así que
    cualquier hallazgo nuevo generado desde un checklist futuro cae
    automáticamente en la pestaña del año correcto, sin ningún cambio
    adicional. Confirmado leyendo el código de esa acción, no solo
    asumido.
  - Probado end-to-end contra las vistas reales (`APIRequestFactory` +
    `force_authenticate`, con `SERVER_NAME='localhost'` para evitar el
    `DisallowedHost` que da `testserver` al serializar `archivos_adjuntos`
    con URL absoluta): `PATCH /hallazgos/:id/ {auditoria}` → 200,
    `PATCH /items-verificacion-auditoria/:id/ {hallazgo_generado}` → 200,
    `GET /hallazgos/:id/` refleja `items_checklist_relacionados`, y la
    reversión de ambos vínculos también funciona. `tsc --noEmit` y
    `oxlint` sobre los archivos tocados, sin errores (los warnings de
    `exhaustive-deps` en `hallazgos`/`todasLasFilas` son preexistentes, no
    introducidos por este cambio).
- **Corrección estructural de la Lista de Verificación de AUD-2025-001
  (2026-09-24)**: el usuario notó, viendo el módulo, que "Requisitos legales
  A.5.31", "5.2", "A5.3", etc. aparecían como "elementos a revisar" propios
  en vez de quedar agrupados bajo el tema real (ej. "Contexto",
  "Liderazgo") — pidió que la estructura respetara tal cual el Excel real
  (FO-860-25). Sugirió también usar el Informe (FO-860-22) como base
  alternativa; se le explicó y aceptó por qué no aplica: el Informe resume
  por **proceso** (12 procesos, ~1-3 viñetas narrativas cada uno, ~40
  entradas en total — verificado abriendo el archivo real), mientras la
  Lista de Verificación es el detalle fila por fila (119 items) — no hay
  correspondencia 1 a 1 reconstruible entre ambos sin inventar un
  emparejamiento impreciso, el mismo riesgo de fuzzy matching ya evitado
  antes en esta sesión.
  - **Causa raíz real, confirmada leyendo el código fuente de la migración
    0015** (`ITEMS_CHECKLIST`, la lista literal de 119 tuplas): en el Excel
    real, la columna "Descripción del elemento a revisar" usa celdas
    combinadas D:H cuando un mismo tema tiene varias filas de evaluación
    debajo (ej. `D13:H15` = "Contexto" cubre 3 filas). La extracción
    original, al toparse con esas celdas vacías en las filas 2ª/3ª del
    grupo, tomó por error el valor de la columna "Otros Requisito" (J) de
    esa fila como si fuera un elemento nuevo.
  - Migración `0021_corregir_elemento_checklist_2025.py`: se releyó el
    Excel real respetando sus 12 hojas (una por sesión/tema) y sus merges
    D:H, y se comparó fila por fila contra el orden exacto de
    `ITEMS_CHECKLIST` de la migración 0015 (usando `tipo_hallazgo` +
    `descripcion_hallazgo` como huella para verificar que la alineación
    posicional fuera exacta antes de confiar en la corrección — los 119
    items de ambas fuentes coincidieron 1 a 1 sin ambigüedad, y los conteos
    por hoja/sesión coincidieron exactamente). Corrigió 95 de los 119 items
    (`descripcion_elemento` únicamente — no se tocó `requisito_iso`,
    `tipo_hallazgo`, `descripcion_hallazgo`, `sesion` ni `hallazgo_generado`;
    los 9 items ya vinculados a H-001/H-002/H-003 conservaron su vínculo).
  - **Decisión de diseño explícita**: dentro de varios grupos, el propio
    Excel deja la celda de "elemento a revisar" en blanco para las filas
    siguientes a la primera (el auditor no repitió el encabezado para cada
    control individual del Anexo A) — en vez de dejar `descripcion_elemento`
    vacío (lo más literal), se heredó (forward-fill) el último encabezado no
    vacío dentro de la misma hoja, para cumplir lo pedido explícitamente por
    el usuario ("si evaluaron varios aspectos del contexto, quede dentro del
    mismo"). Los encabezados heredados resultantes coinciden exactamente con
    los 12 nombres de proceso del Informe real (FO-860-22) — corrobora que
    la agrupación quedó correcta, no inventada.
  - Verificado con una comparación automática post-migración (119 items,
    0 diferencias contra la reconstrucción esperada) y una consulta directa
    a los 9 items con `hallazgo_generado` para confirmar que sus vínculos no
    se alteraron.
  - **Tabla del checklist con celdas fusionadas (2026-09-24, mismo día, a
    pedido del usuario)**: una vez agrupados los 119 items correctamente,
    pidió que la tabla de `AuditoriaDetalleDrawer.tsx` (pestaña "Lista de
    verificación") se viera como el Excel real — filas consecutivas con la
    misma Etapa + Elemento a revisar fusionadas en una sola celda
    (`rowSpan`, calculado por adyacencia ya que `items_verificacion` viene
    ordenado por `id` = orden original de las filas del Excel), sin tocar
    los demás campos (cada fila conserva su propio Requisito ISO, Tipo de
    hallazgo, botón Generar hallazgo/Editar/Eliminar). Además pidió quitar
    la expansión con "+" y dejar la columna **"Descripción del hallazgo"**
    siempre visible en la tabla — se agregó como columna real (entre Tipo de
    hallazgo y Hallazgo) y se eliminó el `expandable`/`expandedRowRender`
    que antes la escondía junto con "Otros requisitos" (ese campo sigue
    editable desde el modal "Editar", solo dejó de mostrarse en la tabla —
    en los datos reales está vacío en todos los items).
  - **Sub-pestañas por sesión (mismo día, a pedido del usuario: "puede
    dividir por pestañas así como se encuentra el archivo excel")**: dentro
    de la pestaña "Lista de verificación", los 119 items ahora se dividen en
    sub-pestañas (una `Tabs` anidada), replicando las 12 hojas del Excel
    real. La agrupación **no mapea nombres de hoja a mano** — agrupa
    dinámicamente por `item.sesion` en el mismo orden en que aparecen los
    items (que ya vienen ordenados por `id`, o sea, en el orden original de
    las filas del Excel), así que el orden de las sub-pestañas coincide con
    el orden real de las hojas sin mantenimiento adicional. Los 22 items sin
    `sesion` (la hoja "Sedes", que cubre dos visitas a la vez) quedan en su
    propia sub-pestaña "Sedes (sin sesión asociada)", en la posición exacta
    donde aparecían en el Excel (entre Infraestructura y Desarrollo). El
    `rowSpan` de Etapa/Elemento a revisar ahora se calcula por sub-pestaña
    (cada `Table` recibe solo los items de su sesión), no sobre la lista
    completa.
  - **Asignar un hallazgo ya existente (mismo día, a pedido del usuario)**:
    la columna "Hallazgo" solo permitía "Generar hallazgo" (crear uno
    nuevo). Se agregó un botón **"Asignar existente"** (o "Cambiar" si el
    item ya tiene uno) que abre un modal con un `Select` buscable sobre
    TODOS los hallazgos del sistema (`fetchHallazgos`, de
    `features/auditorias/api.ts` — no se restringe a los de esta auditoría,
    ya que el caso de uso es justamente relacionar hallazgos históricos de
    cualquier año) y guarda con `vincularItemAHallazgo` (el mismo endpoint
    `PATCH /items-verificacion-auditoria/:id/ {hallazgo_generado}` ya usado
    por `RelacionarChecklistModal` — sin cambios de backend). El `Select`
    permite dejarlo vacío para quitar la relación. Probado end-to-end
    (asignar un hallazgo de otra auditoría/año → 200, `hallazgo_generado_
    codigo` refleja el cambio → revertir a `null` → 200) contra la API
    real.
  - **Mostrar el tratamiento (seguimiento) de cada hallazgo en el selector
    (mismo día, a pedido del usuario)**: al elegir un hallazgo ya existente
    para asignar, ahora cada opción muestra también un Tag con su estado
    (mismos colores que el módulo de Hallazgos) y, debajo, el texto de la(s)
    `accion_correctiva` de sus seguimientos ya registrados (`Hallazgo.
    seguimientos`, ya venía en el payload de `fetchHallazgos` — no
    requirió cambios de backend) — así se puede identificar el hallazgo
    correcto sin salir del modal a consultarlo en otro lado. La búsqueda
    (`filterOption`) también matchea contra ese texto de tratamiento, no
    solo contra código/descripción.
  - **Panel de tratamiento + relaciones existentes dentro del mismo modal
    (mismo día, a pedido del usuario)**: debajo del selector, cuando hay un
    hallazgo elegido (ya asignado o recién seleccionado en el propio
    `Select`, antes de guardar), aparece un panel con: su estado + código +
    descripción; la lista de sus **seguimientos/tratamientos** (acción
    correctiva + tag de verificación de eficacia) con botón **"Editar"** por
    cada uno y **"+ Agregar seguimiento"** — ambos abren
    `SeguimientoFormModal` (reutilizado tal cual del módulo de Hallazgos,
    como modal anidado sobre este) para gestionar el tratamiento sin salir
    de la Lista de Verificación.
    - **Primera versión (solo lectura) corregida el mismo día**: la lista de
      "otros items ya relacionados" nació de solo lectura y, en items sin
      hallazgo asignado todavía, ese espacio del modal se veía vacío — el
      usuario aclaró (con una pregunta directa, `AskUserQuestion`) que
      quería poder **agregar y quitar** esas relaciones desde ahí, no solo
      verlas. Se reemplazó por un `Select mode="multiple"` ("Items del
      checklist relacionados con este hallazgo"): al elegir un hallazgo
      (arriba) se precarga con TODOS los items de CUALQUIER sesión ya
      vinculados a ese hallazgo más el item actual (forzado a entrar), y el
      usuario marca/desmarca libremente. Al guardar, se calcula el diff
      contra el estado real en `itemsChecklist` y se aplica con
      `vincularItemAHallazgo` por item (igual mecanismo que
      `RelacionarChecklistModal`, pero ahora también accesible desde el
      lado del checklist, no solo desde Hallazgos). Las opciones excluyen
      Fortaleza/Conformidad y los items ya vinculados a OTRO hallazgo
      distinto (mismos criterios que `RelacionarChecklistModal`, por
      consistencia). Si se limpia el `Select` de hallazgo por completo, el
      guardado solo desvincula el item actual (comportamiento original,
      sin tocar otros items). No requirió cambios de backend: reutiliza
      `vincularItemAHallazgo`, `SeguimientoFormModal` y los datos que ya
      trae `fetchHallazgos`/`fetchAuditoria` (`items_verificacion` ya viene
      completo con todas las sesiones en el payload de la auditoría).
    - **Sugerencias antes de elegir nada (mismo día, a pedido del
      usuario)**: si el item que se está por asignar no tiene hallazgo
      propio pero OTRAS filas del mismo "elemento a revisar" (mismo `etapa`
      + `descripcion_elemento` — las que quedan fusionadas visualmente en
      la tabla, ej. las 3 filas de "Contexto") ya están relacionadas con
      algún hallazgo, se muestra una sección **"Hallazgos ya relacionados
      con '<elemento>'"** arriba del selector, con un botón **"Usar
      este"** por cada uno (reutiliza `cambiarHallazgoSeleccionado`, la
      misma función que dispara el selector, para no duplicar lógica) —
      así no hay que buscarlo de nuevo si ya aplica al mismo tema. No
      aparece nada si ninguna fila hermana tiene hallazgo todavía.
  - **Ocultar "Generar hallazgo"/"Asignar existente" en Fortaleza y
    Conformidad (mismo día, a pedido del usuario, con captura mostrando
    ambos botones en filas de ese tipo)**: la columna "Hallazgo" de la
    tabla del checklist (`AuditoriaDetalleDrawer.tsx`) ya excluía
    Conformidad solo del botón "Generar hallazgo"; ahora ambos botones
    ("Generar hallazgo" y "Asignar existente"/"Cambiar") solo aparecen si
    `tipo_hallazgo` es `NO_CONFORMIDAD` u `OPORTUNIDAD_MEJORA` — ni
    Fortaleza ni Conformidad los muestran, mismo criterio ya aplicado en
    `RelacionarChecklistModal` y en el multi-select de "Items relacionados"
    del modal "Asignar hallazgo".
  - **Botón/título "Editar hallazgo" cuando ya hay uno asignado (mismo día,
    a pedido del usuario)**: el botón que antes decía "Cambiar" para un
    item ya vinculado ahora dice **"Editar hallazgo"** (más claro sobre lo
    que realmente permite hacer: ver el hallazgo relacionado, su
    tratamiento, y agregar/quitar relaciones — no solo reemplazarlo). El
    título del modal también cambia dinámicamente a "Editar hallazgo —
    \<elemento>" en ese caso (vs. "Asignar hallazgo — \<elemento>" cuando el
    item todavía no tiene ninguno). No cambió la funcionalidad interna —ya
    existía desde la iteración anterior—, solo el nombrado para que sea
    más claro qué hace cada botón.
- **Bug real encontrado y corregido: el multi-select de "otros items" podía
  desvincular por accidente al propio item que se estaba editando
  (2026-09-24)**: el usuario reportó que el item 40 ("a8.2 acceso
  privilegiado", ya vinculado a H-001 desde antes) apareció mostrando
  "Asignar existente" en vez de "Editar hallazgo" — se verificó en la BD que
  efectivamente su `hallazgo_generado_id` había quedado en `NULL`. Causa
  raíz: el multi-select "Items del checklist relacionados con este
  hallazgo" incluía al propio item actual como una opción más,
  indistinguible del resto — bastaba con desmarcarlo ahí (sin querer, al
  buscar/filtrar entre muchos items) para que el guardado lo desvinculara,
  ya que su vínculo se manejaba únicamente a través de ese diff.
  - **Corrección de diseño**: el vínculo del item que se está
    asignando/editando ahora se guarda **siempre explícitamente** según el
    selector de arriba (`hallazgoSeleccionado`), sin pasar por el
    multi-select. El multi-select (renombrado a "**Otros** items del
    checklist relacionados con este hallazgo") **excluye por completo** al
    item actual de sus opciones — solo gestiona relaciones de items
    distintos. `itemsVinculadosA(hallazgoId, excluirId)` ahora exige
    explícitamente el id a excluir, para que no se pueda repetir este error
    si se reutiliza la función en otro lado.
  - **Dato real corregido**: se restauró a mano el vínculo de `id=40` →
    `H-001` (`ItemVerificacionAuditoria.objects.get(id=40).hallazgo_generado
    = Hallazgo.objects.get(codigo='H-001')`), verificado con
    `refresh_from_db()`.
- **Barra de sub-pestañas de sesión con flechas para desplazar
  (2026-09-24, a pedido del usuario)**: con 12 sub-pestañas (una por
  sesión/hoja del Excel), el `<Tabs>` de antd las colapsaba detrás de un
  "..." al no caber — **antd v6 (`@rc-component/tabs`) no tiene flechas de
  desplazamiento nativas, solo ese menú "más"** (confirmado leyendo su
  código fuente en `node_modules`, no asumido) y su scroll interno usa
  `transform: translate()` con estado propio, no `scrollLeft` nativo, así
  que no se puede controlar por fuera con un simple `ref.scrollBy(...)`.
  Se reemplazó la sub-barra de pestañas del checklist (dentro de
  `tabChecklist`, `AuditoriaDetalleDrawer.tsx`) por una implementación
  **100% propia**: botones `<button>` planos dentro de un `div` con
  `overflowX: auto` (scroll nativo real, con inercia/touch/rueda del
  mouse funcionando gratis), flanqueado por dos `Button` de antd con
  `LeftOutlined`/`RightOutlined` que llaman `scrollRef.current.scrollBy({
  left: ±240, behavior: 'smooth' })`. El estado de pestaña activa
  (`checklistTabActivo`) y el render de la tabla del grupo activo se
  maneja directamente (ya no usa el componente `Tabs` de antd para esta
  sub-barra en particular — el `Tabs` principal del Drawer, con Plan de
  auditoría/Cronograma/Lista de verificación, no se tocó). Estilo visual
  replicado a mano (subrayado + color `BRAND.tealDark` en la pestaña
  activa) para mantener la misma apariencia que el resto de la app.

### Backups automáticos (SQL Server + media)
- Motivo: item #2 🔴 Crítico de la sección 0. La base de datos vive en un
  **volumen nombrado de Docker** (`sqlserver_data`, no bind mount), así que no
  se puede copiar el archivo `.mdf` directamente desde Windows — hay que usar
  `BACKUP DATABASE` nativo de SQL Server dentro del contenedor. El motor es
  **SQL Server Express** (`MSSQL_PID: Express`), que **no trae SQL Server
  Agent**, así que la programación no puede hacerse con un job de SQL Agent —
  se usa el Programador de tareas de Windows (host), no algo dentro del
  contenedor.
- `docker-compose.yml`: se agregó un segundo volumen al servicio `sqlserver`,
  bind mount `./backend/backups/sqlserver:/var/opt/mssql/backup` (además del
  volumen nombrado `sqlserver_data:/var/opt/mssql` que ya existía) — así
  `BACKUP DATABASE ... TO DISK = N'/var/opt/mssql/backup/archivo.bak'` deja el
  archivo directamente visible en Windows, sin `docker cp`.
- **Bug real encontrado y corregido al aplicar este cambio** (no relacionado
  con backups en sí, preexistente): el servicio `sqlserver` tenía
  `environment: MSSQL_SA_PASSWORD: ${MSSQL_SA_PASSWORD}` **además** de
  `env_file: backend/.env`. Esa sustitución `${...}` se resuelve contra un
  `.env` en la raíz del repo (que no existe) o el entorno del shell — como
  ninguno la define, Compose la reemplazaba por **cadena vacía**, pisando el
  valor correcto que ya traía `env_file`. Nunca se notó porque el contenedor
  no se había recreado en toda la sesión (con `restart: unless-stopped`, un
  `docker compose up -d` sin cambios de configuración no recrea el
  contenedor, así que seguía corriendo con el password correcto de su
  creación original). Al agregar el bind mount de backups, Compose sí detectó
  el cambio y recreó el contenedor — con el password real ya inicializado en
  el volumen de datos, pero el *healthcheck* autenticando con el password
  vacío → `unhealthy` / `Login failed for user 'sa'`. **Corregido eliminando
  esa línea `environment: MSSQL_SA_PASSWORD: ...` por completo** — el valor
  real solo debe venir de `env_file: backend/.env` (que es la única fuente de
  verdad para ese secreto en este proyecto). Si se vuelve a tocar
  `docker-compose.yml`, evitar reintroducir esa sustitución sin un `.env` en
  la raíz que la respalde.
- Otro detalle real encontrado al escribir el script: **`WITH COMPRESSION` en
  `BACKUP DATABASE` no está disponible en SQL Server Express** (solo
  Standard/Enterprise) — falla con "Msg 1844". Y **`sqlcmd` devuelve código de
  salida 0 aunque el T-SQL falle**, a menos que se use el flag `-b` (batch
  abort on error) — sin `-b`, un script que solo revisa `$LASTEXITCODE` cree
  que el backup funcionó cuando en realidad falló. Ambos corregidos en
  `backup_sgsi.ps1`.
- **Scripts** (`backend/scripts/`, todos `.ps1` con **BOM UTF-8** —
  PowerShell 5.1 sin BOM interpreta el archivo con el codepage del sistema y
  corrompe tildes/rayas, rompiendo el parser; si se edita alguno de estos
  archivos con una herramienta que no preserve el BOM, hay que volver a
  guardarlo como UTF-8 con BOM):
  - `backup_sgsi.ps1` — backup diario: `BACKUP DATABASE` (vía
    `docker exec sgsi-sqlserver /opt/mssql-tools18/bin/sqlcmd ...`) +
    `Compress-Archive` de `backend/media/` a un .zip con timestamp, rotación
    (conserva los últimos 14 de cada tipo, borra el resto) y log en
    `backend/backups/backup_log.txt`. Antes de hacer nada, revisa si Docker
    Desktop/el contenedor están corriendo y, si no, los levanta (mismo
    patrón que el ritual manual de "inicia proyecto") — importante porque a
    las 2 a.m. es poco probable que ya estén arriba en un equipo de trabajo.
    **Probado end-to-end**: genera `.bak` real (~26 MB) y `.zip` de media
    real (~61 MB).
  - `restore_sqlserver.ps1` — runbook/script de restauración. Por defecto
    restaura el `.bak` más reciente en una base **de prueba**
    (`<MSSQL_NAME>_restore_test`), sin tocar la base real — usa
    `RESTORE FILELISTONLY` primero para obtener los nombres lógicos de los
    archivos y poder hacer `MOVE` (obligatorio al restaurar con nombre de
    base distinto). Con `-SobreBaseReal -Confirmar` restaura sobre la base
    real (para una recuperación real ante incidente). **Probado
    end-to-end**: restauró el `.bak` de la prueba anterior y se verificó con
    `SELECT COUNT(*) FROM usuario` → 11 filas, igual que la base real — el
    ciclo backup→restore es real, no solo "archivos que quedan ahí sin
    probar".
  - `registrar_tarea_backup.ps1` — registra la Tarea Programada de Windows
    ("SGSI - Backup diario", diario 2:00 a.m., `-WakeToRun` para que
    despierte el equipo si está dormido — si está **apagado** por completo,
    ninguna tarea programada se dispara, eso no lo resuelve nada). **Requiere
    PowerShell como Administrador** (`Register-ScheduledTask` con
    `-RunLevel Highest` da "Acceso denegado" sin elevación) — **pendiente que
    el usuario lo corra una vez, manualmente, en una PowerShell elevada**:
    ```
    powershell -ExecutionPolicy Bypass -File backend\scripts\registrar_tarea_backup.ps1
    ```
- Parámetros confirmados por el usuario (`AskUserQuestion`): **diario, a las
  2:00 a.m.**, **retener los últimos 14 backups**.
- `.gitignore`: se agregó `backend/backups/` (los `.bak`/`.zip` no deben
  subirse al repo) y `backend/*.log`.
- **Backup del código de la aplicación** (agregado después, a pedido del
  usuario — "que no solo se le haga a la base de datos sino a la
  aplicacion"): `Respaldar-Aplicacion` en `backup_sgsi.ps1` arma un `.zip` de
  todo el repo (backend + frontend) usando `robocopy /E /XD <excluidas>` a una
  carpeta temporal (`$env:TEMP`) y después `Compress-Archive` — evita copiar
  `venv/`, `node_modules/`, `__pycache__/`, `dist/`, `staticfiles/`, `.git/`,
  `backups/` (así mismo) y `media/` (ya respaldado aparte). **Sí incluye
  `backend/.env`** (sin el cual el código restaurado no arranca — tiene
  `DJANGO_SECRET_KEY`, password de BD, password de correo, etc.), así que la
  carpeta `backend/backups/aplicacion/` debe tratarse como sensible igual que
  el propio `.env` (permisos de archivo, no compartir el `.zip` sin cuidado).
  Zip probado: ~4 MB (todo el código fuente, sin lo generado).
- **Copia adicional en la carpeta "Documentos" de Windows** (agregado a pedido
  del usuario — "necesito que ese backup se guarde en la carpeta de
  documentos de mi equipo"): cada uno de los 3 archivos generados
  (`.bak`, `media_*.zip`, `aplicacion_*.zip`) se copia también, con
  `Copiar-A-Documentos` en `backup_sgsi.ps1`, a
  `Documentos\SGSI_Backups\{sqlserver,media,aplicacion}\` — misma rotación de
  14 aplicada ahí también. Se usa
  `[Environment]::GetFolderPath('MyDocuments')` (no
  `"$env:USERPROFILE\Documents"` a mano) para resolver la ruta real de
  Documentos aunque esté redirigida a OneDrive. Sigue siendo el mismo usuario
  de Windows tanto si se corre a mano como si lo dispara la Tarea Programada
  (`registrar_tarea_backup.ps1` ya usa `$env:USERDOMAIN\$env:USERNAME`), así
  que la carpeta de Documentos que se usa es la correcta en ambos casos.
  **Probado**: los 3 archivos aparecieron en
  `C:\Users\oberrio\Documents\SGSI_Backups\`.
- **Botón de backup manual en el frontend** (agregado a pedido del usuario —
  quería poder correrlo en horas de la mañana o al entrar al sistema, no solo
  esperar a las 2 a.m.): página nueva `/backups` (`frontend/src/features/
  sistema/pages/BackupsPage.tsx`), ítem de menú "Backups" — **admin-only**
  (`AdminRoute`, igual que Usuarios). Backend: `apps/core/views_backup.py`
  (`EstadoBackupView` GET, `EjecutarBackupView` POST — ambas con el permission
  class `apps.accounts.permissions.EsAdministrador`, ya existente, reutilizado
  en vez de crear uno nuevo), registradas en `apps/core/urls.py` (nuevo,
  incluido en `config/urls.py`). `EjecutarBackupView.post()` corre
  `backup_sgsi.ps1` con `subprocess.run(..., timeout=600)` (bloqueante — el
  botón queda en loading ~40 seg mientras corre de verdad, no hay cola de
  tareas en este proyecto todavía) y después llama al mismo comando de correo
  que usa la tarea programada. **Probado end-to-end** invocando la vista
  directamente con un usuario administrador real (sin pasar por login/JWT):
  `exito: True`, generó los 3 backups y envió el correo.
- **Aviso por correo al administrador** (agregado a pedido del usuario —
  "que mandara ese backup al correo", luego aclaró "o a un correo que se
  indique" en vez de depender de buscar superusuarios): comando
  `apps/core/management/commands/enviar_resumen_backup.py`, llamado tanto por
  `backup_sgsi.ps1` (al final de cada corrida, vía
  `venv\Scripts\python.exe manage.py enviar_resumen_backup`) como por
  `EjecutarBackupView` (in-process, con `call_command`, sin relanzar un
  subproceso). Destinatario: `settings.BACKUP_NOTIFICATION_EMAIL` (nueva
  variable en `backend/.env`, hoy apuntando al correo del usuario) — si se
  deja vacía, cae de vuelta a todos los `Usuario` con `is_superuser=True`.
  **Se intentó primero adjuntar los archivos de backup y NO funcionó**:
  Gmail bloqueó el correo con el `.zip` adjunto ("This message was blocked
  because its content presents a potential security issue"),
  independientemente del tamaño — y el `.bak` de la base de datos (~26 MB) ya
  de por sí supera lo que la mayoría de proveedores acepta una vez codificado
  en base64 (~33% más pesado). Se decidió **no adjuntar nada**: el correo es
  solo un aviso de texto con nombre/tamaño/fecha de cada backup y la
  indicación de que los archivos reales quedan en el servidor, en
  `backend/backups/`. Probado end-to-end (dos veces): el correo llega sin
  bloqueos.

### Auditoría Interna (ISO/IEC 27001:2022, cláusula 9.2)
- Construido a partir de documentos institucionales reales que el usuario
  aportó en la carpeta `Auditoria/9.2 auditoria interna/` del repo (no
  versionada en git): `PD-860-12` (procedimiento, 23 páginas — las 6 fases y
  roles vienen de ahí), `MT-860-05` (matriz de priorización, con la fórmula
  ponderada real y 13 procesos ya calificados), `FO-860-23` (programa anual),
  `FO-860-24` (plan de auditoría) y `FO-860-25` (lista de verificación). La
  primera búsqueda de estos dos últimos falló por un acento ("auditoría" vs
  el patrón de búsqueda sin tilde) — el usuario corrigió señalando que sí
  existían; quedó como lección: revisar búsquedas por nombre de archivo con
  tildes antes de concluir que un documento no existe.
- **`FO-860-25` reveló que son 4 tipos de hallazgo, no 3**: Conformidad, No
  Conformidad, Oportunidad de Mejora, Fortaleza — el informe `FO-860-22` solo
  narra las últimas 3 (una conformidad no requiere acción, solo deja
  constancia de que se revisó ese punto).
- **El catálogo `activos.Proceso` (14 registros) ya existía y coincide casi
  exactamente con los 13 procesos de la matriz** — se reutilizó directamente
  en vez de crear un catálogo de procesos nuevo. Dos discrepancias de nombre
  detectadas (no corregidas, son datos existentes fuera de alcance): la
  matriz dice "Auditoría" (con tilde) y el catálogo tiene "Auditoria" (sin
  tilde); la matriz dice "Gestión **Étnica** y Cultural" (coincide con el
  texto del procedimiento PD-860-12, y tiene sentido siendo una EPSI de salud
  indígena) pero el catálogo tiene "Gestión **Ética** y Cultural" — parece un
  error de tipeo en la carga original de `Proceso`. Si se corrige algún día,
  hay que re-sembrar `MatrizPriorizacionAuditoria` con el nombre correcto.
- **Modelos nuevos, todos en `apps/auditorias/models.py`** (se amplió la app
  existente de Hallazgos en vez de crear una app nueva, ya que es el mismo
  dominio):
  - `MatrizPriorizacionAuditoria` — proceso + año, 7 calificaciones (1-5),
    `puntaje_final`/`prioridad` son `@property` calculadas con la fórmula
    ponderada exacta (20/15/15/20/10/10/10 %, bandas ≥4.0 Alta / ≥3.0 Media /
    <3.0 Baja). Sembrada por migración de datos
    (`0012_seed_tipos_hallazgo_y_matriz_priorizacion.py`) con los 13 valores
    reales de `MT-860-05`, año 2025 (esa migración también agrega los
    `TipoHallazgo` `CONF` y `FORT` al catálogo — `AM`/`NC` ya existían con 17
    hallazgos reales usándolos, no se tocaron).
  - `ProgramaAuditoria` — una fila del programa anual (FO-860-23): año, tipo
    (Interna/Externa), proceso o `auditado` (texto libre, para externas),
    auditor líder, `mes_planeado` (un mes por fila — si hace falta repetir en
    varios meses, se agregan varias filas, igual que en el Excel real).
  - `Auditoria` — el Plan de Auditoría (FO-860-24): código autogenerado
    `AUD-<año>-NNN` (se reinicia cada año, mismo patrón que `Hallazgo.codigo`
    pero por año), FK opcional a `ProgramaAuditoria` (null si es
    extraordinaria), objetivo/alcance/criterios/metodología, auditor líder +
    equipo (M2M a `Empleado`), `estado` (Planificada → En ejecución →
    Cerrada, mismo patrón de bloqueo que `RevisionDireccion.finalizada`: una
    vez `CERRADA`, solo administrador puede editar).
  - `RiesgoPlanAuditoria` / `OportunidadPlanAuditoria` — filas de esas dos
    secciones del FO-860-24, específicas de CADA auditoría (no confundir con
    los riesgos/oportunidades genéricos del programa, que son texto fijo
    institucional documentado en el procedimiento, no datos).
  - `SesionAuditoria` — una fila del cronograma del FO-860-24 (ciudad, fecha,
    hora inicio/fin, proceso, auditado, auditor) — una auditoría puede visitar
    varios procesos en distintas sesiones.
  - `ItemVerificacionAuditoria` — una fila del checklist FO-860-25 (etapa
    P/H/V/A, elemento a revisar, requisito ISO, tipo de hallazgo,
    descripción). Acción `generar-hallazgo` (POST) crea un `Hallazgo` real del
    módulo ya existente cuando el tipo no es Conformidad — mapea
    NO_CONFORMIDAD→`NC`, OPORTUNIDAD_MEJORA→`AM`, FORTALEZA→`FORT`, hereda
    proceso de la sesión — así el hallazgo generado sigue el mismo flujo de
    seguimiento/cierre que ya existía, sin duplicar esa lógica.
  - `Hallazgo` ganó un campo `auditoria` (FK opcional, `SET_NULL`) para
    trazabilidad — los 17 hallazgos ya existentes quedan sin auditoría de
    origen (no se puede inventar retroactivamente), el vínculo aplica hacia
    adelante.
- **Endpoints** en `apps/auditorias/urls.py`: `matriz-priorizacion-auditoria/`,
  `programa-auditoria/` (+ acción `crear-auditoria` que materializa una fila
  en una `Auditoria` real), `auditorias/` (+ acción `docx` — solo si
  `estado=CERRADA`), `riesgos-plan-auditoria/`, `oportunidades-plan-auditoria/`,
  `sesiones-auditoria/`, `items-verificacion-auditoria/` (+ acción
  `generar-hallazgo`).
- **Informe de auditoría en Word (FO-860-22)**: `apps/auditorias/
  docx_builder_auditoria.py`, reutiliza la MISMA plantilla institucional que
  el acta de Revisión por la Dirección
  (`apps/revisiones/docx_templates/membrete_institucional.docx` — el usuario
  confirmó reutilizarla en vez de esperar una plantilla específica). Un
  bloque por cada proceso auditado (con Fortalezas / Aspectos por mejorar /
  No conformidades), tabla de consolidado general, conclusiones, firmas.
  **Bug real encontrado al generarlo por primera vez**: la plantilla tampoco
  define el estilo con nombre `'List Bullet'` (mismo problema que ya se
  documentó con `'Heading N'` en la sección del acta de Revisión por la
  Dirección) — corregido simulando la viñeta con un run de texto ("•  ...")
  en vez de `doc.add_paragraph(style='List Bullet')`. Si se agrega otro
  generador de `.docx` con esta plantilla, no asumir que un estilo con
  nombre existe sin revisar `doc.styles` primero.
- **Probado end-to-end de verdad** (no solo revisión de código): se creó una
  fila de programa → se materializó en auditoría → se completó objetivo/
  alcance/criterios/fecha → se agregó una sesión con proceso real → se
  agregó un item de checklist tipo No Conformidad → se generó su Hallazgo
  real (`H-018`) → se cerró la auditoría → se descargó el informe en Word y
  se verificó su contenido real con `python-docx` (título, tabla de info de
  7 filas, la no conformidad narrada, tabla de consolidado 3×4, tabla de
  firmas). Los datos de prueba se limpiaron después.
- **Frontend**: feature nuevo `frontend/src/features/auditoriaInterna/`
  (`types.ts`, `api.ts`, y páginas `MatrizPriorizacionPage`,
  `ProgramaAuditoriaPage`, `AuditoriasPage` + `AuditoriaDetalleDrawer` con
  pestañas Plan/Cronograma/Lista de verificación). Ítem de menú "Auditoría
  Interna" con submenú (Matriz de Priorización, Programa Anual, Auditorías).
  El `Hallazgo` existente (`features/auditorias/`) ganó los campos
  `auditoria`/`auditoria_codigo` de solo lectura. **No se pudo probar
  haciendo clic en el navegador en esta sesión** (sin herramienta de
  automatización de navegador disponible) — sí se verificó que TypeScript
  compila sin errores (`tsc --noEmit`), que el lint no marca nada nuevo, y
  que Vite sirve los módulos nuevos sin error de compilación. Revisar
  visualmente antes de darlo por completamente probado.
- **Ajustes de diseño encontrados al revisar un Plan de Auditoría real ya
  diligenciado** (carpeta `Auditoria/9.2 auditoria interna/Auditoria Interna
  realizada 2025/20251205 Plan de auditoría V 1.1.xlsx` — auditoría externa
  real ejecutada 9-11 dic 2025 por Mauricio Mantilla Álvarez, no versionada en
  git), corregidos en la misma sesión en que se construyó el módulo:
  - `RiesgoPlanAuditoria.responsable` y `OportunidadPlanAuditoria.responsable`
    **pasaron de FK a `Empleado` a texto libre** (`CharField`): el documento
    real combina varios roles en una sola celda (ej. "Auditor líder\nLíder
    del SGSI"), no una persona puntual del sistema — forzar un FK habría
    perdido esa fidelidad. Migración `0013_sesionauditoria_tema_and_more.py`
    (tablas nuevas sin datos de producción todavía, cambio sin riesgo).
  - `SesionAuditoria` ganó un campo `tema` (texto libre, "Tema / dominio
    auditado"): el cronograma real de una auditoría general del SGSI se
    organiza por tema/dominio (ej. "Gestión de Riesgos de Seguridad de la
    Información", "Seguridad terceros", "Continuidad de TI"), no
    exclusivamente por proceso organizacional — varios temas reales no tenían
    un `Proceso` del catálogo equivalente exacto. `proceso` (FK) se mantiene
    para cuando sí hay una coincidencia exacta (ej. "Gestión Humana").
    `SesionAuditoria.auditado` también pasó de `CharField(200)` a `TextField`
    por el mismo motivo de fidelidad (roles combinados, texto más largo).
  - **Esta auditoría real quedó cargada como dato** (migración
    `0014_seed_auditoria_2025_realizada.py`, idempotente — no duplica si se
    vuelve a migrar): `Auditoria` código `AUD-2025-001`, `estado=CERRADA`,
    con sus 2 riesgos y 1 oportunidad del plan, y 16 sesiones del cronograma
    real (se omitieron a propósito filas puramente logísticas del Excel como
    "Receso"/"Balance diario"/"Desplazamiento", que no aportan trazabilidad
    real). El auditor externo se cargó como `Empleado` nuevo ("Mauricio
    Mantilla Álvarez", cargo "Auditor Líder (externo)") — mismo patrón usado
    para nombrar personas sin cuenta de acceso al sistema.
  - **Actualización**: el usuario sí tenía también el Informe (FO-860-22) y la
    Lista de Verificación (FO-860-25) diligenciados de esta misma auditoría,
    en la misma carpeta — la primera búsqueda de esta sesión no los encontró
    (buscaba por patrones de nombre tipo "2025"/"realizada" que no calzaban
    con esos dos archivos), el usuario corrigió señalando que sí estaban.
    Cargados en migraciones posteriores (ver más abajo): ahora la auditoría
    **sí tiene 40 hallazgos reales** y un informe en Word con contenido real.
  - **Bug real de corrupción de datos encontrado y corregido durante esta
    carga** (no solo un problema de visualización): al extraer texto de los
    `.xlsx` con un script que hacía `print(...)` con la salida redirigida a
    un archivo vía `>` en Git Bash, el archivo resultante quedaba en
    **cp1252, no UTF-8** — los acentos no solo se veían mal en la terminal
    (como en otros casos ya documentados en este archivo), sino que el
    archivo en disco tenía bytes realmente distintos a UTF-8. Se detectó
    verificando los bytes crudos del archivo (`b'\xc3\xb1' in data`, etc.)
    antes de confiar en su contenido para escribir una migración. **Corregido
    de raíz**: los scripts de extracción ahora escriben directo a un archivo
    `.py` con `open(ruta, 'w', encoding='utf-8')` desde Python, sin pasar el
    texto con tildes por la consola de Git Bash en ningún momento (ni de
    entrada ni de salida) — así el archivo generado es UTF-8 real,
    verificable con `Read` (que si decodifica bien), no con la salida de
    `Bash` (que puede seguir mostrando mal el texto aunque el archivo esté
    bien — son dos problemas distintos, y solo el primero es corrupción real
    de datos). **Regla para el futuro**: si un script necesita producir texto
    con tildes que después se va a copiar a un archivo de código (como una
    migración), nunca usar `print(...) > archivo` en Git Bash — escribir el
    archivo directamente desde Python con `encoding='utf-8'` explícito.
  - **Migración `0015_seed_informe_y_checklist_2025.py`**: agrega al registro
    `AUD-2025-001` la nota de alcance real (exclusión de auditorías internas
    por principio de independencia), `fecha_elaboracion_informe`
    (2025-12-22) y las conclusiones generales reales del informe. Crea **40
    `Hallazgo` reales** (14 Fortalezas, 11 Oportunidades de Mejora, 15 No
    Conformidades) — uno por cada viñeta individual del informe (no un solo
    hallazgo por bloque de "no conformidades" con varias viñetas juntas),
    vinculados a `auditoria=AUD-2025-001`; la acción correctiva que el
    auditor ya había anotado (con nombres de pila de los involucrados) se
    guardó en `evidencia_asociada` — no se intentó convertir en un
    `Empleado`/`SeguimientoHallazgo` real porque son nombres de pila
    ambiguos, sin apellido, no identificables con certeza en el directorio.
    También crea **119 `ItemVerificacionAuditoria`** (el checklist real de
    las 12 hojas del FO-860-25), emparejados con la `SesionAuditoria`
    correspondiente por tema o por proceso cuando aplica (97 de 119 quedaron
    con sesión vinculada). Se detectaron y excluyeron 4 notas de campo
    ("antivirus Manaure sin gestión", "puerta de cubículos abierta",
    "cerraduras de archivadores dañadas", "suministro eléctrico
    intermitente") que aparecían **idénticamente duplicadas en 6 de las 12
    hojas** del Excel real — un artefacto de que el auditor duplicó la hoja
    plantilla para cada tema y no limpió un área de notas compartida; se
    cargaron **una sola vez**, bajo el tema "Sedes", para no inflar
    artificialmente el conteo de hallazgos.
  - **Ajuste de modelo adicional, encontrado al intentar generar el informe
    en Word con los 40 hallazgos ya cargados**: el generador solo mostraba 1
    de los 12 bloques de resultados (el único con un `Proceso` FK exacto,
    "Gestión Humana") — los otros 11 hallazgos-por-bloque no tenían forma de
    agruparse porque `Hallazgo` no tenía un campo de texto libre equivalente
    al `tema` que ya se le había agregado a `SesionAuditoria`. **Corregido**
    agregando `Hallazgo.tema` (`CharField`, igual patrón y misma
    justificación que `SesionAuditoria.tema`) — migración
    `0016_hallazgo_tema_alter_hallazgo_procesos.py` (también hizo
    `procesos` M2M explícitamente `blank=True`, ya que ahora es real que un
    hallazgo puede no tener ningún proceso del catálogo) + migración de
    backfill `0017_backfill_tema_hallazgos_2025.py` que le puso el tema
    correcto a los 40 hallazgos ya creados, reconstruyendo el orden exacto en
    que la migración 0015 los creó (no repite el texto completo de los
    bloques, solo los conteos por bloque). `apps/auditorias/
    docx_builder_auditoria.py` se reescribió para agrupar por proceso O por
    tema (lo que exista) en vez de solo por `auditoria.procesos_auditados` —
    **probado de nuevo end-to-end**: el Word ahora sí trae los 12 bloques de
    resultados reales.
  - **Informe también descargable en Excel, con el formato real FO-860-22**
    (a pedido del usuario, que quería el Excel real tal cual, no solo Word):
    `apps/auditorias/excel_builder_informe.py` + acción `xlsx` en
    `AuditoriaViewSet` (mismo criterio que `docx`: solo si
    `estado=CERRADA`). Reutiliza la plantilla real del usuario, copiada a
    `apps/auditorias/excel_templates/FO-860-22_informe_auditoria_interna.xlsx`.
    Se agregó `openpyxl==3.1.5` a `requirements.txt` (antes solo estaba
    instalado en el venv para analizar los `.xlsx` reales, ahora es una
    dependencia real de la app).
    **El reto real**: la plantilla en blanco solo trae 3 bloques de
    "PROCESO" pre-armados (filas 17, 28 y 42, con espaciados y alturas de
    fila distintas entre sí — probablemente ajustados a mano) y 11 filas de
    la tabla de consolidado — pero una auditoría real como `AUD-2025-001`
    tiene 12. La solución: usar **siempre el primer bloque (filas 17-27)
    como plantilla de estilo única**, eliminar los bloques 2 y 3 originales
    más el encabezado de "página 2" intermedio, e insertar tantas copias del
    bloque 1 como procesos reales haya (mismo criterio para las filas de
    consolidado si se necesitan más de 11).
    **Detalle técnico importante para quien toque este archivo después**:
    openpyxl **no ajusta las celdas combinadas (merged cells) al insertar o
    eliminar filas** — es una limitación documentada de la librería, no un
    descuido. La estrategia usada: desarmar TODAS las fusiones del sheet al
    principio, hacer toda la cirugía de filas solo sobre valores/estilos, y
    al final reconstruir cada fusión aplicando una función que traduce "fila
    original → fila nueva" (o `None` si la fila cayó dentro de la zona
    eliminada) — más las fusiones nuevas para los bloques/filas clonados,
    replicando el patrón relativo del bloque/fila 1.
    **Probado end-to-end de verdad, no solo que no lance excepción**: se
    generó el Excel de `AUD-2025-001` y se verificó con `openpyxl` que (a)
    los 12 bloques quedaron en las filas esperadas con espaciado uniforme de
    11 filas (17, 28, 39, ... 138), (b) el contenido de cada bloque
    (fortalezas/aspectos/no conformidades) coincide con los hallazgos reales,
    (c) la tabla de consolidado (fila 152 en adelante) tiene los 12 conteos
    exactos ya verificados antes, (d) conclusiones y firmas cayeron en las
    filas correctas, y (e) **no hay ninguna celda combinada superpuesta**
    (causa típica de que Excel reporte el archivo como corrupto al abrirlo) —
    se revisaron las 189 fusiones resultantes una por una contra las demás.
    **Limitación conocida, no corregida**: el campo "Responsable del
    proceso" del Excel (y del Word) sale en blanco ("—") para varios de los
    12 bloques porque el nombre del proceso en el Informe (ej. "Gestión de
    riesgos de SI") no coincide textualmente con el `tema` de la
    `SesionAuditoria` correspondiente (ej. "Gestión de Riesgos de Seguridad
    de la Información", del Plan) — son la misma auditoría real pero el
    propio Excel del usuario nombra el mismo tema distinto en el Plan que en
    el Informe. No se intentó una coincidencia difusa (fuzzy matching) entre
    esos nombres por el riesgo de emparejar mal dos temas que sí son
    distintos.
  - **Ajustes pedidos por el usuario tras ver el módulo en pantalla (2026-09-23)**:
    1. **Trazabilidad Auditoría↔Programa visible**: no había forma de saber, en
       pantalla, si una `Auditoria` venía de una fila del Programa Anual o
       era suelta. `AuditoriaSerializer` ganó `programa_descripcion`
       (`SerializerMethodField`, ej. "Programa 2025 — Diciembre (SGSI)" o
       `null` si no tiene programa). Se muestra en una columna "Origen
       (programa)" nueva en `AuditoriasPage` y como subtítulo del
       `AuditoriaDetalleDrawer`.
    2. **Se quitó la descarga en Word del informe de auditoría**: el usuario
       solo quiere Excel para este documento. Se eliminó el botón "Word" de
       `AuditoriasPage` y `AuditoriaDetalleDrawer`, la acción `docx` de
       `AuditoriaViewSet`, y el archivo `apps/auditorias/
       docx_builder_auditoria.py` completo (código muerto, no lo usaba nada
       más). **No se tocó** `apps/revisiones/docx_builder.py` (el acta de
       Revisión por la Dirección sigue en Word — es un documento distinto,
       el usuario no pidió quitar ese).
    3. **Botones para descargar las plantillas en blanco** (FO-860-24 Plan y
       FO-860-22 Informe, sin datos de ninguna auditoría) en la parte
       superior de `AuditoriasPage`. Nuevas vistas de solo lectura
       `PlantillaPlanAuditoriaView`/`PlantillaInformeAuditoriaView`
       (`IsAuthenticated`, `FileResponse` directo) sirviendo los mismos
       archivos ya copiados a `apps/auditorias/excel_templates/` — se
       agregó ahí también `FO-860-24_plan_auditoria.xlsx` (antes solo
       estaba el del informe). Rutas nuevas:
       `/api/v1/auditorias-plantillas/plan/` y `/informe/`.
       Probado end-to-end (las 3 cosas) contra la API real.
- **Navegación: "Hallazgos de auditoría" se movió dentro del submenú
  "Auditoría Interna"** (2026-09-23, a pedido del usuario) — antes era un
  ítem de primer nivel independiente en `Shell.tsx`. Ahora es el 4º hijo del
  submenú (después de Matriz de Priorización, Programa Anual y Auditorías),
  con el mismo `perm: 'auditorias.view_hallazgo'` y sin ícono propio (los
  hijos de submenú no llevan ícono en este layout). La ruta (`/hallazgos`) y
  la página (`HallazgosPage.tsx`) no cambiaron, solo su ubicación en el
  menú lateral — sigue viviendo en `features/auditorias/`, no se movió de
  carpeta.
- **Edición de items de la Lista de Verificación** (2026-09-24, a pedido del
  usuario: "necesito tener la opción de editar estos campos... a la hora de
  hacer la migración algunos datos quedaron incompletos" — se refería a
  `otros_requisitos`/`descripcion_hallazgo` de la carga real de la migración
  0015, algunos vacíos o truncados en el Excel original). Antes solo se
  podía "Generar hallazgo" o "Eliminar" cada fila del checklist en
  `AuditoriaDetalleDrawer.tsx` — no había forma de corregir un dato ya
  cargado sin borrar la fila entera. Se agregó botón **"Editar"** (columna
  de acciones, junto a "Eliminar") que abre un `Modal` con los mismos
  campos del formulario de "Agregar item" (sesión, etapa, requisito ISO,
  tipo de hallazgo, descripción del elemento, descripción del hallazgo) más
  **"Otros requisitos"** (que el formulario de alta nunca tuvo como campo
  editable, solo se podía fijar por carga masiva) — todos precargados con
  los valores actuales del item. Guarda con `actualizarItemVerificacion`
  (`PATCH /items-verificacion-auditoria/:id/`, ya existía en `api.ts`, no
  se tocó backend). Respeta el mismo `puedeEditar` que el resto de la
  pestaña (bloqueado si la auditoría está `CERRADA` y el usuario no es
  administrador). Probado end-to-end contra la API real
  (`APIRequestFactory` + `force_authenticate`): PATCH de
  `otros_requisitos`/`descripcion_hallazgo`/`requisito_iso` sobre un item
  real de AUD-2025-001 → 200, valores reflejados, y reversión a los
  originales confirmada.

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

- Backups automáticos: scripts hechos y probados end-to-end (ver sección 5),
  **falta solo que el usuario registre la Tarea Programada de Windows en una
  PowerShell como Administrador** (`registrar_tarea_backup.ps1` — Claude no
  tiene privilegios de admin en esta sesión para hacerlo).
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
