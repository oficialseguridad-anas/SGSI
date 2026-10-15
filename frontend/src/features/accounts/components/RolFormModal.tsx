import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Input, Modal, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { actualizarRol, crearRol } from '../api';
import type { Rol, RolInput } from '../types';
import { PermisosSelector } from './PermisosSelector';

// Convierte la respuesta de error de DRF en un mensaje legible — mismo patrón ya
// usado en otros formularios del proyecto (ej. DocumentoFormModal, SeguimientoFormModal).
function extraerMensajeError(err: unknown): string | null {
  const data = (err as { response?: { data?: unknown } }).response?.data;
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    for (const valor of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(valor) && typeof valor[0] === 'string') return valor[0];
      if (typeof valor === 'string') return valor;
    }
  }
  return null;
}

type FormValues = Omit<RolInput, 'permisos'>;

interface Props {
  open: boolean;
  rol: Rol | null;
  onClose: () => void;
}

export function RolFormModal({ open, rol, onClose }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [permisos, setPermisos] = useState<number[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (rol) {
      form.setFieldsValue({ nombre: rol.nombre, descripcion: rol.descripcion });
      setPermisos(rol.permisos_detalle.map((p) => p.id));
    } else {
      form.setFieldsValue({ nombre: '', descripcion: '' });
      setPermisos([]);
    }
  }, [open, rol, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: RolInput = { ...values, permisos };
      return rol ? actualizarRol(rol.id, payload) : crearRol(payload);
    },
    onSuccess: () => {
      message.success(rol ? 'Rol actualizado.' : 'Rol creado.');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onClose();
    },
    onError: (err) => message.error(extraerMensajeError(err) ?? 'No se pudo guardar el rol.'),
  });

  return (
    <Modal
      title={rol ? `Editar rol ${rol.nombre}` : 'Nuevo rol'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={720}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: 'Ingresa un nombre' }]}>
          <Input disabled={rol?.es_rol_sistema} />
        </Form.Item>
        <Form.Item name="descripcion" label="Descripción">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        Permisos de este rol
      </Typography.Text>
      <PermisosSelector value={permisos} onChange={setPermisos} />
    </Modal>
  );
}
