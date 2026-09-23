import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Input, InputNumber, Modal, Select, message } from 'antd';
import { useEffect } from 'react';
import { fetchEmpleados } from '../../accounts/api';
import { fetchProcesos } from '../../activos/api';
import { actualizarProgramaAuditoria, crearProgramaAuditoria } from '../api';
import type { ProgramaAuditoria, ProgramaAuditoriaInput } from '../types';

interface Props {
  open: boolean;
  fila: ProgramaAuditoria | null;
  anio: number;
  onClose: () => void;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
].map((nombre, indice) => ({ value: indice + 1, label: nombre }));

export function ProgramaAuditoriaFormModal({ open, fila, anio, onClose }: Props) {
  const [form] = Form.useForm<ProgramaAuditoriaInput>();
  const queryClient = useQueryClient();
  const { data: procesosData } = useQuery({ queryKey: ['procesos'], queryFn: fetchProcesos, enabled: open });
  const { data: empleadosData } = useQuery({ queryKey: ['empleados'], queryFn: fetchEmpleados, enabled: open });
  const tipo = Form.useWatch('tipo', form);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (fila) {
      form.setFieldsValue({
        anio: fila.anio,
        tipo: fila.tipo,
        proceso: fila.proceso,
        auditado: fila.auditado,
        procedimiento: fila.procedimiento,
        servicio_o_proyecto: fila.servicio_o_proyecto,
        auditor_lider: fila.auditor_lider,
        mes_planeado: fila.mes_planeado,
      });
    } else {
      form.setFieldsValue({ anio, tipo: 'INTERNA' });
    }
  }, [open, fila, anio, form]);

  const mutation = useMutation({
    mutationFn: (valores: ProgramaAuditoriaInput) =>
      fila ? actualizarProgramaAuditoria(fila.id, valores) : crearProgramaAuditoria(valores),
    onSuccess: () => {
      message.success(fila ? 'Fila actualizada.' : 'Fila creada.');
      queryClient.invalidateQueries({ queryKey: ['programa-auditoria'] });
      onClose();
    },
    onError: () => message.error('No se pudo guardar la fila del programa.'),
  });

  return (
    <Modal
      title={fila ? 'Editar fila del programa' : 'Nueva fila del programa anual'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
        <Form.Item name="anio" label="Año" rules={[{ required: true }]}>
          <InputNumber min={2020} max={2100} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
          <Select options={[{ value: 'INTERNA', label: 'Interna' }, { value: 'EXTERNA', label: 'Externa' }]} />
        </Form.Item>
        {tipo === 'EXTERNA' ? (
          <Form.Item name="auditado" label="Auditado (proveedor, ente certificador, etc.)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        ) : (
          <Form.Item name="proceso" label="Proceso" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={(procesosData?.results ?? []).map((p) => ({ value: p.id, label: p.nombre }))}
            />
          </Form.Item>
        )}
        <Form.Item name="procedimiento" label="Procedimiento">
          <Input />
        </Form.Item>
        <Form.Item name="servicio_o_proyecto" label="Servicio o proyecto">
          <Input />
        </Form.Item>
        <Form.Item name="auditor_lider" label="Auditor líder">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            options={(empleadosData?.results ?? []).map((e) => ({ value: e.id, label: e.nombre_completo }))}
          />
        </Form.Item>
        <Form.Item name="mes_planeado" label="Mes planeado" rules={[{ required: true }]}>
          <Select options={MESES} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
