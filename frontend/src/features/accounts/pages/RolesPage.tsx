import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Popconfirm, Space, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { RolFormModal } from '../components/RolFormModal';
import { eliminarRol, fetchRoles } from '../api';
import type { Rol } from '../types';

export function RolesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['roles'], queryFn: fetchRoles });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [rolEditando, setRolEditando] = useState<Rol | null>(null);

  const roles = data?.results ?? [];

  const eliminarMutation = useMutation({
    mutationFn: eliminarRol,
    onSuccess: () => {
      message.success('Rol eliminado.');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: () => message.error('No se pudo eliminar el rol.'),
  });

  function abrirCrear() {
    setRolEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(rol: Rol) {
    setRolEditando(rol);
    setModalAbierto(true);
  }

  const columns = [
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre', render: (n: string) => <strong>{n}</strong> },
    { title: 'Descripción', dataIndex: 'descripcion', key: 'descripcion', render: (d: string) => d || '—' },
    {
      title: 'Permisos',
      key: 'permisos',
      render: (_: unknown, rol: Rol) => `${rol.permisos_detalle.length} permiso(s)`,
    },
    {
      title: 'Rol de sistema',
      dataIndex: 'es_rol_sistema',
      key: 'es_rol_sistema',
      render: (es: boolean) => (es ? <Tag color="blue">Sí</Tag> : '—'),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_: unknown, rol: Rol) => (
        <Space>
          <Button size="small" onClick={() => abrirEditar(rol)}>Editar</Button>
          {!rol.es_rol_sistema && (
            <Popconfirm
              title="¿Eliminar este rol? Se le quitará a todos los usuarios que lo tengan asignado."
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              onConfirm={() => eliminarMutation.mutate(rol.id)}
            >
              <Button size="small" danger>Eliminar</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Roles"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Nuevo rol</Button>}
    >
      <Table rowKey="id" loading={isLoading} columns={columns} dataSource={roles} pagination={false} />
      <RolFormModal open={modalAbierto} rol={rolEditando} onClose={() => setModalAbierto(false)} />
    </Card>
  );
}
