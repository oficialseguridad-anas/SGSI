import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Input, Modal, Radio, Select, message } from 'antd';
import { useEffect } from 'react';
import { fetchDirecciones } from '../../activos/api';
import { actualizarUsuario, crearUsuario } from '../api';
import type { Usuario, UsuarioCreateInput } from '../types';

const OPCIONES_SI_NO = [
  { value: true, label: 'Sí' },
  { value: false, label: 'No' },
];

interface Props {
  open: boolean;
  usuario: Usuario | null;
  onClose: () => void;
}

export function UsuarioFormModal({ open, usuario, onClose }: Props) {
  const [form] = Form.useForm<UsuarioCreateInput>();
  const queryClient = useQueryClient();

  const { data: direcciones } = useQuery({
    queryKey: ['direcciones'],
    queryFn: () => fetchDirecciones(),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (usuario) {
      form.setFieldsValue({
        email: usuario.email,
        nombre_completo: usuario.nombre_completo,
        cargo: usuario.cargo,
        direccion: usuario.direccion,
        telefono: usuario.telefono,
        is_active: usuario.is_active,
        debe_cambiar_password: usuario.debe_cambiar_password,
      });
    } else {
      form.setFieldsValue({
        is_active: true,
        debe_cambiar_password: true,
      });
    }
  }, [open, usuario, form]);

  const mutation = useMutation({
    mutationFn: (values: UsuarioCreateInput) =>
      usuario ? actualizarUsuario(usuario.id, values) : crearUsuario(values),
    onSuccess: () => {
      message.success(usuario ? 'Usuario actualizado.' : 'Usuario creado.');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      onClose();
    },
    onError: () => message.error('No se pudo guardar el usuario. Revisa los datos e intenta de nuevo.'),
  });

  return (
    <Modal
      title={usuario ? `Editar usuario ${usuario.email}` : 'Nuevo usuario'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={560}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, type: 'email', message: 'Ingresa un email válido' }]}
        >
          <Input disabled={Boolean(usuario)} />
        </Form.Item>
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
        <Form.Item name="direccion" label="Dirección" rules={[{ required: true, message: 'Selecciona una dirección' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            allowClear
            options={direcciones?.results.map((d) => ({ value: d.id, label: d.nombre }))}
          />
        </Form.Item>
        <Form.Item name="telefono" label="Teléfono">
          <Input />
        </Form.Item>
        {!usuario && (
          <Form.Item
            name="password"
            label="Contraseña"
            rules={[{ required: true, min: 8, message: 'Mínimo 8 caracteres' }]}
          >
            <Input.Password />
          </Form.Item>
        )}
        <Form.Item name="is_active" label="Activo" rules={[{ required: true }]}>
          <Radio.Group options={OPCIONES_SI_NO} optionType="button" buttonStyle="solid" />
        </Form.Item>
        <Form.Item
          name="debe_cambiar_password"
          label="¿Debe cambiar la contraseña al iniciar sesión?"
          rules={[{ required: true }]}
        >
          <Radio.Group options={OPCIONES_SI_NO} optionType="button" buttonStyle="solid" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
