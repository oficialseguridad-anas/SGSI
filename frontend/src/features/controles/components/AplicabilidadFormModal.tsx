import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Input, Modal, Select, Switch, Typography, message } from 'antd';
import { useEffect } from 'react';
import { actualizarAplicabilidad } from '../api';
import type { AplicabilidadControl, AplicabilidadInput, CategoriaControl, EstadoImplementacion } from '../types';

const NOMBRE_CATEGORIA: Record<CategoriaControl, string> = {
  ORGANIZACIONAL: 'Organizacional',
  PERSONAS: 'Personas',
  FISICO: 'Físico',
  TECNOLOGICO: 'Tecnológico',
};

const OPCIONES_ESTADO = [
  { value: 'NO_IMPLEMENTADO', label: 'Sin Iniciar' },
  { value: 'PARCIAL', label: 'En Proceso' },
  { value: 'IMPLEMENTADO', label: 'Implementado' },
];

interface Props {
  open: boolean;
  aplicabilidad: AplicabilidadControl | null;
  onClose: () => void;
}

export function AplicabilidadFormModal({ open, aplicabilidad, onClose }: Props) {
  const [form] = Form.useForm<Omit<AplicabilidadInput, 'control'>>();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open || !aplicabilidad) return;
    form.resetFields();
    form.setFieldsValue({
      aplica: aplicabilidad.aplica,
      justificacion: aplicabilidad.justificacion,
      estado_implementacion: aplicabilidad.estado_implementacion,
      referencia_documento: aplicabilidad.referencia_documento,
      observaciones: aplicabilidad.observaciones,
    });
  }, [open, aplicabilidad, form]);

  const mutation = useMutation({
    mutationFn: (values: Omit<AplicabilidadInput, 'control'>) => {
      if (!aplicabilidad) throw new Error('sin aplicabilidad');
      const payload: AplicabilidadInput = { ...values, control: aplicabilidad.control };
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
      <Typography.Paragraph
        type="secondary"
        style={{ background: '#f5f5f5', padding: '8px 12px', borderRadius: 4, marginBottom: 16 }}
      >
        <Typography.Text strong>Categoría: </Typography.Text>
        {NOMBRE_CATEGORIA[aplicabilidad.control_categoria]}
        <br />
        <Typography.Text strong>Descripción del control: </Typography.Text>
        {aplicabilidad.control_descripcion || 'Sin descripción registrada en el catálogo.'}
      </Typography.Paragraph>
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item name="aplica" label="Aplica el control (SI/NO)" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item
          name="estado_implementacion"
          label="Estado"
          rules={[{ required: true }]}
        >
          <Select options={OPCIONES_ESTADO as { value: EstadoImplementacion; label: string }[]} />
        </Form.Item>
        <Form.Item name="justificacion" label="Justificación del control">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="referencia_documento" label="Referencia / Nombre Documento">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="observaciones" label="Observaciones">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
