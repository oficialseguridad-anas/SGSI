import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Input, Modal, Radio, message } from 'antd';
import { useEffect } from 'react';
import { actualizarEmpleado, crearEmpleado } from '../api';
import type { Empleado, EmpleadoInput } from '../types';

interface Props {
  open: boolean;
  empleado: Empleado | null;
  onClose: () => void;
}

const OPCIONES_ACTIVO = [
  { value: true, label: 'Sí' },
  { value: false, label: 'No' },
];

export function EmpleadoFormModal({ open, empleado, onClose }: Props) {
  const [form] = Form.useForm<EmpleadoInput>();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (empleado) {
      form.setFieldsValue({
        nombre_completo: empleado.nombre_completo,
        cargo: empleado.cargo,
        correo: empleado.correo,
        activo: empleado.activo,
      });
    } else {
      form.setFieldsValue({ activo: true });
    }
  }, [open, empleado, form]);

  const mutation = useMutation({
    mutationFn: (values: EmpleadoInput) =>
      empleado ? actualizarEmpleado(empleado.id, values) : crearEmpleado(values),
    onSuccess: () => {
      message.success(empleado ? 'Empleado actualizado.' : 'Empleado creado.');
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
      onClose();
    },
    onError: () => message.error('No se pudo guardar el empleado. Revisa los datos e intenta de nuevo.'),
  });

  return (
    <Modal
      title={empleado ? 'Editar empleado' : 'Nuevo empleado'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={480}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item
          name="nombre_completo"
          label="Nombre completo"
          rules={[{ required: true, message: 'Ingresa el nombre completo' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="cargo" label="Cargo">
          <Input />
        </Form.Item>
        <Form.Item name="correo" label="Correo" rules={[{ type: 'email', message: 'Correo inválido' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="activo" label="¿Activo en la organización?" rules={[{ required: true }]}>
          <Radio.Group options={OPCIONES_ACTIVO} optionType="button" buttonStyle="solid" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
