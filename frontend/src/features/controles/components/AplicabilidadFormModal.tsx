import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatePicker, Form, Input, Modal, Select, Switch, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { fetchUsuarios } from '../../accounts/api';
import { actualizarAplicabilidad } from '../api';
import type { AplicabilidadControl, AplicabilidadInput, EstadoImplementacion } from '../types';

const OPCIONES_ESTADO = [
  { value: 'NO_IMPLEMENTADO', label: 'No implementado' },
  { value: 'PARCIAL', label: 'Parcialmente implementado' },
  { value: 'IMPLEMENTADO', label: 'Implementado' },
  { value: 'NO_APLICA', label: 'No aplica' },
];

type FormValues = Omit<AplicabilidadInput, 'control' | 'fecha_ultima_revision'> & {
  fecha_ultima_revision: dayjs.Dayjs | null;
};

interface Props {
  open: boolean;
  aplicabilidad: AplicabilidadControl | null;
  onClose: () => void;
}

export function AplicabilidadFormModal({ open, aplicabilidad, onClose }: Props) {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();
  const { data: usuarios } = useQuery({ queryKey: ['usuarios'], queryFn: fetchUsuarios, enabled: open });

  useEffect(() => {
    if (!open || !aplicabilidad) return;
    form.resetFields();
    form.setFieldsValue({
      aplica: aplicabilidad.aplica,
      justificacion: aplicabilidad.justificacion,
      estado_implementacion: aplicabilidad.estado_implementacion,
      evidencia: aplicabilidad.evidencia,
      responsable: aplicabilidad.responsable,
      fecha_ultima_revision: aplicabilidad.fecha_ultima_revision ? dayjs(aplicabilidad.fecha_ultima_revision) : null,
    });
  }, [open, aplicabilidad, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!aplicabilidad) throw new Error('sin aplicabilidad');
      const payload: AplicabilidadInput = {
        ...values,
        control: aplicabilidad.control,
        fecha_ultima_revision: values.fecha_ultima_revision ? values.fecha_ultima_revision.format('YYYY-MM-DD') : null,
      };
      return actualizarAplicabilidad(aplicabilidad.id, payload);
    },
    onSuccess: () => {
      message.success('Declaración de aplicabilidad actualizada.');
      queryClient.invalidateQueries({ queryKey: ['soa'] });
      onClose();
    },
    onError: () => message.error('No se pudo guardar. Revisa los datos e intenta de nuevo.'),
  });

  if (!aplicabilidad) return null;

  return (
    <Modal
      title={`${aplicabilidad.control_codigo} — ${aplicabilidad.control_nombre}`}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={640}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item name="aplica" label="¿Aplica este control?" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="justificacion" label="Justificación de inclusión/exclusión">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item
          name="estado_implementacion"
          label="Estado de implementación"
          rules={[{ required: true }]}
        >
          <Select options={OPCIONES_ESTADO as { value: EstadoImplementacion; label: string }[]} />
        </Form.Item>
        <Form.Item name="evidencia" label="Evidencia">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="responsable" label="Responsable">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            options={usuarios?.results.map((u) => ({ value: u.id, label: `${u.nombre_completo} (${u.email})` }))}
          />
        </Form.Item>
        <Form.Item name="fecha_ultima_revision" label="Fecha de última revisión">
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
        <Typography.Text type="secondary">
          Categoría: {aplicabilidad.control_categoria}
        </Typography.Text>
      </Form>
    </Modal>
  );
}
