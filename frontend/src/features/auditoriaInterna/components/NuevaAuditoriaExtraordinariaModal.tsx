import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatePicker, Form, Input, Modal, Select, message } from 'antd';
import dayjs from 'dayjs';
import { fetchEmpleados } from '../../accounts/api';
import { crearAuditoriaExtraordinaria } from '../api';
import type { AuditoriaInput } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreada: (id: number) => void;
}

type FormValues = {
  objetivo: string;
  alcance: string;
  criterios: string;
  auditor_lider: number | undefined;
  fecha_auditoria: dayjs.Dayjs | null;
};

export function NuevaAuditoriaExtraordinariaModal({ open, onClose, onCreada }: Props) {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();
  const { data: empleadosData } = useQuery({ queryKey: ['empleados'], queryFn: fetchEmpleados, enabled: open });

  const mutation = useMutation({
    mutationFn: (valores: AuditoriaInput) => crearAuditoriaExtraordinaria(valores),
    onSuccess: (auditoria) => {
      message.success(`Auditoría ${auditoria.codigo} creada.`);
      queryClient.invalidateQueries({ queryKey: ['auditorias'] });
      form.resetFields();
      onClose();
      onCreada(auditoria.id);
    },
    onError: () => message.error('No se pudo crear la auditoría.'),
  });

  function manejarFinalizacion(valores: FormValues) {
    mutation.mutate({
      objetivo: valores.objetivo,
      alcance: valores.alcance,
      criterios: valores.criterios,
      auditor_lider: valores.auditor_lider ?? null,
      fecha_auditoria: valores.fecha_auditoria ? valores.fecha_auditoria.format('YYYY-MM-DD') : null,
    });
  }

  return (
    <Modal
      title="Nueva auditoría extraordinaria"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={manejarFinalizacion}>
        <Form.Item name="objetivo" label="Objetivo de la auditoría" rules={[{ required: true }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="alcance" label="Alcance">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="criterios" label="Criterios">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="auditor_lider" label="Auditor líder">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            options={(empleadosData?.results ?? []).map((e) => ({ value: e.id, label: e.nombre_completo }))}
          />
        </Form.Item>
        <Form.Item name="fecha_auditoria" label="Fecha de auditoría">
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
