import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Collapse, Form, Input, Modal, Radio, Select, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { fetchDirecciones } from '../../activos/api';
import { actualizarUsuario, crearUsuario, fetchRoles } from '../api';
import { PermisosSelector } from './PermisosSelector';
import type { Usuario, UsuarioCreateInput } from '../types';

const OPCIONES_SI_NO = [
  { value: true, label: 'Sí' },
  { value: false, label: 'No' },
];

// Convierte la respuesta de error de DRF en un mensaje legible — mismo patrón ya
// usado en otros formularios del proyecto.
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

type FormValues = Omit<UsuarioCreateInput, 'roles_ids' | 'permisos_ids'>;

interface Props {
  open: boolean;
  usuario: Usuario | null;
  onClose: () => void;
}

export function UsuarioFormModal({ open, usuario, onClose }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [rolesIds, setRolesIds] = useState<number[]>([]);
  const [permisosIds, setPermisosIds] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const { data: direcciones } = useQuery({
    queryKey: ['direcciones'],
    queryFn: () => fetchDirecciones(),
    enabled: open,
  });
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: fetchRoles, enabled: open });

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
      setRolesIds(usuario.roles.map((r) => r.id));
      setPermisosIds(usuario.permisos_directos.map((p) => p.id));
    } else {
      form.setFieldsValue({
        is_active: true,
        debe_cambiar_password: true,
      });
      setRolesIds([]);
      setPermisosIds([]);
    }
  }, [open, usuario, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: UsuarioCreateInput = { ...values, roles_ids: rolesIds, permisos_ids: permisosIds };
      return usuario ? actualizarUsuario(usuario.id, payload) : crearUsuario(payload);
    },
    onSuccess: () => {
      message.success(usuario ? 'Usuario actualizado.' : 'Usuario creado.');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      onClose();
    },
    onError: (err) => message.error(extraerMensajeError(err) ?? 'No se pudo guardar el usuario. Revisa los datos e intenta de nuevo.'),
  });

  return (
    <Modal
      title={usuario ? `Editar usuario ${usuario.email}` : 'Nuevo usuario'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={640}
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

      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        Roles
      </Typography.Text>
      <Select
        mode="multiple"
        showSearch
        optionFilterProp="label"
        style={{ width: '100%', marginBottom: 16 }}
        placeholder="Sin roles asignados"
        value={rolesIds}
        onChange={setRolesIds}
        options={roles?.results.map((r) => ({ value: r.id, label: r.nombre }))}
      />

      <Collapse
        size="small"
        items={[
          {
            key: 'permisos-individuales',
            label: `Permisos individuales adicionales (opcional)${permisosIds.length ? ` — ${permisosIds.length} seleccionados` : ''}`,
            children: (
              <>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
                  Además de lo que ya le dan sus roles — para un caso puntual que ese usuario necesite sin crear un
                  rol nuevo.
                </Typography.Paragraph>
                <PermisosSelector value={permisosIds} onChange={setPermisosIds} />
              </>
            ),
          },
        ]}
      />
    </Modal>
  );
}
