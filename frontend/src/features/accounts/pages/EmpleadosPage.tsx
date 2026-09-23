import { DownloadOutlined, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Empty, Input, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { normalizarTexto } from '../../../shared/utils/normalizarTexto';
import { EmpleadoFormModal } from '../components/EmpleadoFormModal';
import { ImportarEmpleadosModal } from '../components/ImportarEmpleadosModal';
import { descargarPlantillaEmpleados, eliminarEmpleado, fetchEmpleados } from '../api';
import type { Empleado } from '../types';

export function EmpleadosPage() {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['empleados'], queryFn: fetchEmpleados });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState<Empleado | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const empleados = data?.results ?? [];
  const empleadosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    if (!termino) return empleados;
    return empleados.filter((e) => {
      const campos = [e.nombre_completo, e.cargo, e.correo];
      return campos.some((campo) => campo && normalizarTexto(campo).includes(termino));
    });
  }, [empleados, busqueda]);

  const eliminarMutation = useMutation({
    mutationFn: eliminarEmpleado,
    onSuccess: () => {
      message.success('Empleado eliminado.');
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
    },
    onError: () => message.error('No se pudo eliminar: puede estar referenciado en otro módulo (ej. una revisión).'),
  });

  function abrirCrear() {
    setEmpleadoEditando(null);
    setModalAbierto(true);
  }

  async function descargarPlantilla() {
    try {
      await descargarPlantillaEmpleados();
    } catch {
      message.error('No se pudo descargar la plantilla.');
    }
  }

  function abrirEditar(empleado: Empleado) {
    setEmpleadoEditando(empleado);
    setModalAbierto(true);
  }

  const columns = [
    { title: 'Nombre completo', dataIndex: 'nombre_completo', key: 'nombre_completo' },
    { title: 'Cargo', dataIndex: 'cargo', key: 'cargo', render: (c: string) => c || '—' },
    { title: 'Correo', dataIndex: 'correo', key: 'correo', render: (c: string) => c || '—' },
    {
      title: 'Tiene cuenta de acceso',
      dataIndex: 'tiene_usuario',
      key: 'tiene_usuario',
      render: (tiene: boolean) => (tiene ? <Tag color="blue">Sí</Tag> : <Tag color="default">No</Tag>),
    },
    {
      title: 'Activo',
      dataIndex: 'activo',
      key: 'activo',
      render: (activo: boolean) => (activo ? <Tag color="green">Sí</Tag> : <Tag color="red">No</Tag>),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_: unknown, empleado: Empleado) => (
        <Space>
          {hasPerm('accounts.change_empleado') && (
            <Button size="small" onClick={() => abrirEditar(empleado)}>Editar</Button>
          )}
          {hasPerm('accounts.delete_empleado') && !empleado.tiene_usuario && (
            <Popconfirm
              title="¿Eliminar este empleado?"
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              onConfirm={() => eliminarMutation.mutate(empleado.id)}
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
      title="Empleados"
      extra={
        <Space wrap>
          <Button icon={<DownloadOutlined />} onClick={descargarPlantilla}>Plantilla</Button>
          {hasPerm('accounts.add_empleado') && (
            <Button icon={<UploadOutlined />} onClick={() => setModalImportarAbierto(true)}>
              Importar
            </Button>
          )}
          {hasPerm('accounts.add_empleado') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Nuevo empleado</Button>
          )}
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">
        Directorio de personas de la organización, para poder nombrarlas como
        responsable/revisor/asistente en cualquier módulo sin necesidad de crearles una
        cuenta de acceso al sistema. Cada usuario del sistema ya tiene su propio registro
        aquí automáticamente.
      </Typography.Paragraph>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#898781' }} />}
          placeholder="Buscar por nombre, cargo o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: 420 }}
        />
        {busqueda && (
          <Typography.Text type="secondary">
            {empleadosFiltrados.length} de {empleados.length} empleados
          </Typography.Text>
        )}
      </div>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={empleadosFiltrados}
        pagination={false}
        locale={{
          emptyText: busqueda ? <Empty description={`Ningún empleado coincide con "${busqueda}".`} /> : undefined,
        }}
      />
      <EmpleadoFormModal open={modalAbierto} empleado={empleadoEditando} onClose={() => setModalAbierto(false)} />
      <ImportarEmpleadosModal open={modalImportarAbierto} onClose={() => setModalImportarAbierto(false)} />
    </Card>
  );
}
