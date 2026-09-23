import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, InputNumber, Modal, Select, message } from 'antd';
import { useEffect } from 'react';
import { fetchProcesos } from '../../activos/api';
import { actualizarMatrizPriorizacion, crearMatrizPriorizacion } from '../api';
import type { MatrizPriorizacionAuditoria, MatrizPriorizacionAuditoriaInput } from '../types';

interface Props {
  open: boolean;
  fila: MatrizPriorizacionAuditoria | null;
  anio: number;
  onClose: () => void;
}

const CRITERIOS: { campo: keyof MatrizPriorizacionAuditoriaInput; etiqueta: string }[] = [
  { campo: 'criticidad', etiqueta: 'Criticidad del proceso o activo' },
  { campo: 'auditorias_previas', etiqueta: 'Resultados de auditorías previas' },
  { campo: 'cambios', etiqueta: 'Cambios significativos' },
  { campo: 'incidentes', etiqueta: 'Incidentes de seguridad' },
  { campo: 'legales', etiqueta: 'Requisitos legales/regulatorios' },
  { campo: 'relevancia', etiqueta: 'Relevancia estratégica' },
  { campo: 'riesgo_residual', etiqueta: 'Riesgo residual' },
];

export function MatrizPriorizacionFormModal({ open, fila, anio, onClose }: Props) {
  const [form] = Form.useForm<MatrizPriorizacionAuditoriaInput>();
  const queryClient = useQueryClient();
  const { data: procesosData } = useQuery({ queryKey: ['procesos'], queryFn: fetchProcesos, enabled: open });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (fila) {
      form.setFieldsValue({
        proceso: fila.proceso,
        anio: fila.anio,
        criticidad: fila.criticidad,
        auditorias_previas: fila.auditorias_previas,
        cambios: fila.cambios,
        incidentes: fila.incidentes,
        legales: fila.legales,
        relevancia: fila.relevancia,
        riesgo_residual: fila.riesgo_residual,
      });
    } else {
      form.setFieldsValue({ anio });
    }
  }, [open, fila, anio, form]);

  const mutation = useMutation({
    mutationFn: (valores: MatrizPriorizacionAuditoriaInput) =>
      fila ? actualizarMatrizPriorizacion(fila.id, valores) : crearMatrizPriorizacion(valores),
    onSuccess: () => {
      message.success(fila ? 'Fila actualizada.' : 'Fila creada.');
      queryClient.invalidateQueries({ queryKey: ['matriz-priorizacion'] });
      onClose();
    },
    onError: () => message.error('No se pudo guardar — verifica que no exista ya una fila para ese proceso y año.'),
  });

  return (
    <Modal
      title={fila ? 'Editar calificación' : 'Nueva calificación de proceso'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
        <Form.Item name="proceso" label="Proceso / Área" rules={[{ required: true }]}>
          <Select
            showSearch
            optionFilterProp="label"
            disabled={Boolean(fila)}
            options={(procesosData?.results ?? []).map((p) => ({ value: p.id, label: p.nombre }))}
          />
        </Form.Item>
        <Form.Item name="anio" label="Año" rules={[{ required: true }]}>
          <InputNumber min={2020} max={2100} style={{ width: '100%' }} disabled={Boolean(fila)} />
        </Form.Item>
        {CRITERIOS.map(({ campo, etiqueta }) => (
          <Form.Item key={campo} name={campo} label={`${etiqueta} (1-5)`} rules={[{ required: true }]}>
            <InputNumber min={1} max={5} style={{ width: '100%' }} />
          </Form.Item>
        ))}
      </Form>
    </Modal>
  );
}
