import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Empty, Input, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { normalizarTexto } from '../../../shared/utils/normalizarTexto';
import { UsuarioFormModal } from '../components/UsuarioFormModal';
import { eliminarUsuario, fetchUsuarios } from '../api';
import type { Usuario } from '../types';

export function UsuariosPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['usuarios'], queryFn: fetchUsuarios });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const usuarios = data?.results ?? [];
  const usuariosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    if (!termino) return usuarios;
    return usuarios.filter((u) => {
      const campos = [
        u.email,
        u.nombre_completo,
        u.cargo,
        u.direccion_nombre,
        ...u.roles.map((r) => r.nombre),
      ];
      return campos.some((campo) => campo && normalizarTexto(campo).includes(termino));
    });
  }, [usuarios, busqueda]);

  const eliminarMutation = useMutation({
    mutationFn: eliminarUsuario,
    onSuccess: () => {
      message.success('Usuario eliminado.');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: () => message.error('No se pudo eliminar el usuario.'),
  });

  function abrirCrear() {
    setUsuarioEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(usuario: Usuario) {
    setUsuarioEditando(usuario);
    setModalAbierto(true);
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      render: (id: number) => <strong>{id}</strong>,
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Nombre', dataIndex: 'nombre_completo', key: 'nombre_completo' },
    {
      title: 'Dirección',
      dataIndex: 'direccion_nombre',
      key: 'direccion_nombre',
      render: (d: string | null) => d ?? '—',
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: Usuario['roles']) => roles.map((r) => <Tag key={r.id}>{r.nombre}</Tag>),
    },
    {
      title: 'Activo',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (activo: boolean) => (activo ? <Tag color="green">Sí</Tag> : <Tag color="red">No</Tag>),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_: unknown, usuario: Usuario) => (
        <Space>
          <Button size="small" onClick={() => abrirEditar(usuario)}>Editar</Button>
          <Popconfirm
            title="¿Eliminar este usuario?"
            okText="Eliminar"
            okButtonProps={{ danger: true }}
            disabled={usuario.id === user?.id}
            onConfirm={() => eliminarMutation.mutate(usuario.id)}
          >
            <Button size="small" danger disabled={usuario.id === user?.id}>
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Usuarios"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Nuevo usuario</Button>}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#898781' }} />}
          placeholder="Buscar por email, nombre, cargo, dirección o rol..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: 420 }}
        />
        {busqueda && (
          <Typography.Text type="secondary">
            {usuariosFiltrados.length} de {usuarios.length} usuarios
          </Typography.Text>
        )}
      </div>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={usuariosFiltrados}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: busqueda ? <Empty description={`Ningún usuario coincide con "${busqueda}".`} /> : undefined,
        }}
      />
      <UsuarioFormModal open={modalAbierto} usuario={usuarioEditando} onClose={() => setModalAbierto(false)} />
    </Card>
  );
}
