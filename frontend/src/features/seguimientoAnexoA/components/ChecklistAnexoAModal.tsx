import { CheckCircleFilled, LoadingOutlined, LockOutlined, WarningFilled } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Input, Modal, Select, Skeleton, Tag, Tooltip, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { BRAND } from '../../../shared/theme/brand';
import type { ApiRevisionAnexoA } from '../api';
import {
  NOMBRE_RESULTADO_CHECKLIST,
  ORDEN_RESULTADO_CHECKLIST,
  PUNTAJE_RESULTADO_CHECKLIST,
} from '../resultadoChecklist';
import type { RevisionAnexoA } from '../types';

const OPCIONES_RESULTADO = ORDEN_RESULTADO_CHECKLIST.map((clave) => ({
  value: clave,
  label: NOMBRE_RESULTADO_CHECKLIST[clave],
}));

interface Props {
  open: boolean;
  revision: RevisionAnexoA | null;
  onClose: () => void;
  api: ApiRevisionAnexoA;
  queryKeyRevisiones: string;
  queryKeyRespuestas: string;
}

interface FilaEditable {
  id: number;
  resultado: string;
  evidencia: string;
}

type EstadoGuardadoFila = 'guardando' | 'guardado' | 'error' | undefined;

export function ChecklistAnexoAModal({
  open,
  revision,
  onClose,
  api,
  queryKeyRevisiones,
  queryKeyRespuestas,
}: Props) {
  const { user } = useAuth();
  const esAdministrador = Boolean(user?.is_superuser);
  const queryClient = useQueryClient();
  const [filas, setFilas] = useState<FilaEditable[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [estadoFilas, setEstadoFilas] = useState<Record<number, EstadoGuardadoFila>>({});
  // Evita que la llegada tardía de un guardado anterior pise el resultado de uno más nuevo
  // para la misma fila (ej. dos cambios seguidos antes de que responda el primer PATCH).
  const versionFila = useRef<Record<number, number>>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: [queryKeyRespuestas, revision?.id],
    queryFn: () => api.fetchRespuestasChecklist(revision!.id),
    enabled: open && !!revision,
  });

  useEffect(() => {
    if (data) {
      setFilas(data.results.map((r) => ({ id: r.id, resultado: r.resultado, evidencia: r.evidencia })));
      setEstadoFilas({});
    }
  }, [data]);

  function actualizarFila(id: number, cambios: Partial<FilaEditable>) {
    setFilas((previas) => previas.map((f) => (f.id === id ? { ...f, ...cambios } : f)));
  }

  async function guardarFilaAhora(id: number, valores: Pick<FilaEditable, 'resultado' | 'evidencia'>) {
    const version = (versionFila.current[id] ?? 0) + 1;
    versionFila.current[id] = version;
    setEstadoFilas((previo) => ({ ...previo, [id]: 'guardando' }));
    try {
      await api.actualizarRespuestaChecklist(id, valores);
      if (versionFila.current[id] === version) {
        setEstadoFilas((previo) => ({ ...previo, [id]: 'guardado' }));
      }
      if (revision) {
        queryClient.invalidateQueries({ queryKey: [queryKeyRespuestas, revision.id], refetchType: 'none' });
        // El "% Cumplimiento" de la tabla de revisiones se calcula en el backend — se
        // refresca con cada respuesta guardada (no solo al finalizar) para que se vea
        // avanzar en línea, incluso si el usuario cierra el modal sin "Guardar y cerrar".
        queryClient.invalidateQueries({ queryKey: [queryKeyRevisiones] });
      }
    } catch {
      if (versionFila.current[id] === version) {
        setEstadoFilas((previo) => ({ ...previo, [id]: 'error' }));
      }
    }
  }

  function alCambiarResultado(id: number, resultado: string) {
    actualizarFila(id, { resultado });
    const fila = filas.find((f) => f.id === id);
    void guardarFilaAhora(id, { resultado, evidencia: fila?.evidencia ?? '' });
  }

  function alSalirDeEvidencia(id: number) {
    const fila = filas.find((f) => f.id === id);
    if (!fila) return;
    void guardarFilaAhora(id, { resultado: fila.resultado, evidencia: fila.evidencia });
  }

  async function guardar() {
    if (!revision) return;
    setGuardando(true);
    try {
      // Red de seguridad: por si queda algún campo sin confirmar (ej. el usuario cerró con
      // el cursor todavía en el textarea de evidencia, sin que se disparara el "blur").
      await Promise.all(
        filas.map((f) => api.actualizarRespuestaChecklist(f.id, { resultado: f.resultado, evidencia: f.evidencia })),
      );
      // El checklist ya está completo (es la única forma de habilitar este botón) — al
      // guardar queda finalizado: de solo lectura para cualquiera que no sea administrador.
      await api.finalizarRevision(revision.id, true);
      queryClient.invalidateQueries({ queryKey: [queryKeyRespuestas, revision.id] });
      queryClient.invalidateQueries({ queryKey: [queryKeyRevisiones] });
      message.success('Checklist finalizado y guardado.');
      onClose();
    } catch {
      message.error('No se pudo guardar el checklist. Revisa los datos e intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  const respuestas = data?.results ?? [];
  // Agrupa por control (A.X.1, A.X.2, ...) preservando el orden en que ya vienen del
  // backend (pregunta__control_orden, numero) — cada grupo se muestra en su propia
  // tabla, con el encabezado "A.X.Y Nombre del control".
  const grupos: { controlCodigo: string; controlNombre: string; respuestas: typeof respuestas }[] = [];
  for (const r of respuestas) {
    const grupoActual = grupos[grupos.length - 1];
    if (grupoActual && grupoActual.controlCodigo === r.pregunta_control_codigo) {
      grupoActual.respuestas.push(r);
    } else {
      grupos.push({
        controlCodigo: r.pregunta_control_codigo,
        controlNombre: r.pregunta_control_nombre,
        respuestas: [r],
      });
    }
  }
  const completo = filas.length > 0 && filas.every((f) => f.resultado !== '');
  const finalizada = Boolean(revision?.finalizada);
  const soloLectura = finalizada && !esAdministrador;

  // Calculado en vivo a partir de las respuestas locales (no del valor guardado en el
  // servidor), para que el % se actualice al instante mientras se va diligenciando.
  function calcularPorcentaje(ids: number[]): number {
    if (ids.length === 0) return 0;
    const suma = ids.reduce((acumulado, id) => {
      const fila = filas.find((f) => f.id === id);
      return acumulado + (PUNTAJE_RESULTADO_CHECKLIST[fila?.resultado ?? ''] ?? 0);
    }, 0);
    return Math.round((suma / ids.length) * 10) / 10;
  }

  const porcentajeGeneral = calcularPorcentaje(filas.map((f) => f.id));
  const colorPorcentaje = (valor: number) => (valor >= 80 ? 'green' : valor >= 50 ? 'gold' : 'red');

  return (
    <Modal
      title={
        <span>
          {revision ? `Checklist — Revisión ${revision.fecha_revision}` : 'Checklist'}
          {respuestas.length > 0 && (
            <Tag color={colorPorcentaje(porcentajeGeneral)} style={{ marginLeft: 10 }}>
              {porcentajeGeneral}% cumplimiento
            </Tag>
          )}
          {finalizada && (
            <Tag icon={<LockOutlined />} color={esAdministrador ? 'gold' : 'default'} style={{ marginLeft: 4 }}>
              Finalizado
            </Tag>
          )}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={
        soloLectura
          ? [
              <Button key="cerrar" onClick={onClose}>
                Cerrar
              </Button>,
            ]
          : undefined
      }
      onOk={guardar}
      okText="Guardar y cerrar"
      okButtonProps={{ disabled: !completo }}
      cancelText="Cerrar"
      confirmLoading={guardando}
      destroyOnHidden
      width={940}
    >
      {isLoading && <Skeleton active paragraph={{ rows: 6 }} />}
      {isError && <Alert type="error" message="No se pudo cargar el checklist." showIcon />}

      {!isLoading && !isError && respuestas.length > 0 && (
        <>
          {soloLectura && (
            <Alert
              type="warning"
              showIcon
              icon={<LockOutlined />}
              style={{ marginBottom: 12 }}
              message="Este checklist ya fue finalizado y quedó de solo lectura. Solo un administrador puede modificarlo."
            />
          )}
          {!soloLectura && finalizada && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              message="Este checklist está finalizado. Como administrador puedes seguir editándolo si necesitas hacer un ajuste."
            />
          )}
          {!finalizada && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message={
                completo
                  ? 'Checklist completo — al hacer clic en "Guardar y cerrar" quedará finalizado y de solo lectura.'
                  : 'Cada respuesta se guarda automáticamente al diligenciarla — puedes cerrar en cualquier momento y continuar más tarde sin perder lo avanzado. El botón "Guardar y cerrar" se habilita cuando todas las preguntas tengan un resultado.'
              }
            />
          )}
          {grupos.map((grupo) => {
            const porcentajeGrupo = calcularPorcentaje(grupo.respuestas.map((r) => r.id));
            return (
            <div key={grupo.controlCodigo} style={{ marginBottom: 24 }}>
              <h3 style={{ color: BRAND.tealDark, marginTop: 0, marginBottom: 8 }}>
                {grupo.controlCodigo} {grupo.controlNombre}{' '}
                <Tag color={colorPorcentaje(porcentajeGrupo)} style={{ fontWeight: 400 }}>
                  {porcentajeGrupo}%
                </Tag>
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={celdaEncabezado({ width: 40 })}>N.</th>
                      <th style={celdaEncabezado({})}>Pregunta / criterio</th>
                      <th style={celdaEncabezado({ width: 160 })}>Resultado (C / CP / NC / NE)</th>
                      <th style={celdaEncabezado({ width: 220 })}>Evidencia / observación</th>
                      <th style={celdaEncabezado({ width: 36 })} aria-label="Estado de guardado" />
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.respuestas.map((r) => {
                      const fila = filas.find((f) => f.id === r.id);
                      return (
                        <tr key={r.id}>
                          <td style={celdaCuerpo()}>{r.pregunta_numero}</td>
                          <td style={celdaCuerpo()}>{r.pregunta_texto}</td>
                          <td style={celdaCuerpo()}>
                            <Select
                              allowClear
                              size="small"
                              disabled={soloLectura}
                              style={{ width: '100%' }}
                              options={OPCIONES_RESULTADO}
                              value={fila?.resultado || undefined}
                              onChange={(valor) => alCambiarResultado(r.id, valor ?? '')}
                            />
                          </td>
                          <td style={celdaCuerpo()}>
                            <Input.TextArea
                              autoSize={{ minRows: 1, maxRows: 4 }}
                              disabled={soloLectura}
                              value={fila?.evidencia ?? ''}
                              onChange={(e) => actualizarFila(r.id, { evidencia: e.target.value })}
                              onBlur={() => alSalirDeEvidencia(r.id)}
                            />
                          </td>
                          <td style={{ ...celdaCuerpo(), textAlign: 'center' }}>
                            <IndicadorGuardado estado={estadoFilas[r.id]} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            );
          })}
        </>
      )}

      {!isLoading && !isError && respuestas.length === 0 && (
        <Alert
          type="info"
          showIcon
          message="Todavía no hay preguntas de checklist definidas para esta revisión."
        />
      )}
    </Modal>
  );
}

function celdaEncabezado(estiloExtra: React.CSSProperties): React.CSSProperties {
  return {
    background: BRAND.tealDark,
    color: '#fff',
    textAlign: 'left',
    padding: '8px 10px',
    border: '1px solid #d9d9d9',
    ...estiloExtra,
  };
}

function celdaCuerpo(): React.CSSProperties {
  return { padding: '8px 10px', border: '1px solid #d9d9d9', verticalAlign: 'top' };
}

function IndicadorGuardado({ estado }: { estado: EstadoGuardadoFila }) {
  if (estado === 'guardando') {
    return (
      <Tooltip title="Guardando...">
        <LoadingOutlined style={{ color: BRAND.tealDark }} />
      </Tooltip>
    );
  }
  if (estado === 'guardado') {
    return (
      <Tooltip title="Guardado">
        <CheckCircleFilled style={{ color: '#52c41a' }} />
      </Tooltip>
    );
  }
  if (estado === 'error') {
    return (
      <Tooltip title="No se pudo guardar esta respuesta. Vuelve a intentarlo.">
        <WarningFilled style={{ color: '#faad14' }} />
      </Tooltip>
    );
  }
  return null;
}
