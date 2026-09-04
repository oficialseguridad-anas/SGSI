import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Input, Modal, Select, Skeleton, message } from 'antd';
import { useEffect, useState } from 'react';
import { BRAND } from '../../../shared/theme/brand';
import { actualizarRespuestaChecklistPersonas, fetchRespuestasChecklistPersonas } from '../api';
import { NOMBRE_RESULTADO_CHECKLIST, ORDEN_RESULTADO_CHECKLIST } from '../resultadoChecklist';
import type { RevisionPersonas } from '../types';

const OPCIONES_RESULTADO = ORDEN_RESULTADO_CHECKLIST.map((clave) => ({
  value: clave,
  label: NOMBRE_RESULTADO_CHECKLIST[clave],
}));

interface Props {
  open: boolean;
  revision: RevisionPersonas | null;
  onClose: () => void;
}

interface FilaEditable {
  id: number;
  resultado: string;
  evidencia: string;
}

export function ChecklistPersonasModal({ open, revision, onClose }: Props) {
  const queryClient = useQueryClient();
  const [filas, setFilas] = useState<FilaEditable[]>([]);
  const [guardando, setGuardando] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['respuestas-checklist-personas', revision?.id],
    queryFn: () => fetchRespuestasChecklistPersonas(revision!.id),
    enabled: open && !!revision,
  });

  useEffect(() => {
    if (data) {
      setFilas(data.results.map((r) => ({ id: r.id, resultado: r.resultado, evidencia: r.evidencia })));
    }
  }, [data]);

  function actualizarFila(id: number, cambios: Partial<FilaEditable>) {
    setFilas((previas) => previas.map((f) => (f.id === id ? { ...f, ...cambios } : f)));
  }

  async function guardar() {
    if (!revision) return;
    setGuardando(true);
    try {
      await Promise.all(
        filas.map((f) => actualizarRespuestaChecklistPersonas(f.id, { resultado: f.resultado, evidencia: f.evidencia })),
      );
      message.success('Checklist guardado.');
      queryClient.invalidateQueries({ queryKey: ['respuestas-checklist-personas', revision.id] });
      onClose();
    } catch {
      message.error('No se pudo guardar el checklist. Revisa los datos e intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  const respuestas = data?.results ?? [];
  const controlCodigo = respuestas[0]?.pregunta_control_codigo;
  const controlNombre = respuestas[0]?.pregunta_control_nombre;

  return (
    <Modal
      title={revision ? `Checklist — Revisión ${revision.fecha_revision}` : 'Checklist'}
      open={open}
      onCancel={onClose}
      onOk={guardar}
      okText="Guardar"
      confirmLoading={guardando}
      destroyOnHidden
      width={900}
    >
      {isLoading && <Skeleton active paragraph={{ rows: 6 }} />}
      {isError && <Alert type="error" message="No se pudo cargar el checklist." showIcon />}

      {!isLoading && !isError && respuestas.length > 0 && (
        <>
          <h3 style={{ color: BRAND.tealDark, marginTop: 0 }}>
            {controlCodigo} {controlNombre}
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={celdaEncabezado({ width: 40 })}>N.</th>
                  <th style={celdaEncabezado({})}>Pregunta / criterio</th>
                  <th style={celdaEncabezado({ width: 160 })}>Resultado (C / CP / NC / NE)</th>
                  <th style={celdaEncabezado({ width: 220 })}>Evidencia / observación</th>
                </tr>
              </thead>
              <tbody>
                {respuestas.map((r) => {
                  const fila = filas.find((f) => f.id === r.id);
                  return (
                    <tr key={r.id}>
                      <td style={celdaCuerpo()}>{r.pregunta_numero}</td>
                      <td style={celdaCuerpo()}>{r.pregunta_texto}</td>
                      <td style={celdaCuerpo()}>
                        <Select
                          allowClear
                          size="small"
                          style={{ width: '100%' }}
                          options={OPCIONES_RESULTADO}
                          value={fila?.resultado || undefined}
                          onChange={(valor) => actualizarFila(r.id, { resultado: valor ?? '' })}
                        />
                      </td>
                      <td style={celdaCuerpo()}>
                        <Input.TextArea
                          autoSize={{ minRows: 1, maxRows: 4 }}
                          value={fila?.evidencia ?? ''}
                          onChange={(e) => actualizarFila(r.id, { evidencia: e.target.value })}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
