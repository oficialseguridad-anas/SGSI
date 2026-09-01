import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Empty, Input, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useMemo, useState, type CSSProperties } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { normalizarTexto } from '../../../shared/utils/normalizarTexto';
import { ActivoFormModal } from '../components/ActivoFormModal';
import { eliminarActivo, fetchActivos } from '../api';
import type { Activo, ClaseActivo, EstadoActivo, EtiquetadoActivo, NivelValoracion, TipoActivo } from '../types';

const NOMBRE_CLASE: Record<ClaseActivo, string> = {
  SISTEMAS_INFORMACION: 'Sistemas de Información',
  PERSONAL: 'Personal',
  SOFTWARE: 'Software',
  HARDWARE: 'Hardware',
  INFORMACION: 'Información',
  ESTRUCTURA_ORGANIZACION: 'Estructura de la organización',
  RED: 'Red',
};

const COLOR_ETIQUETADO: Record<EtiquetadoActivo, string> = {
  PUBLICO: 'default',
  PRIVADO: 'blue',
  CONFIDENCIAL: 'red',
};

const COLOR_ESTADO: Record<EstadoActivo, string> = {
  ACTIVO: 'green',
  EN_MANTENIMIENTO: 'orange',
  RETIRADO: 'default',
};

const COLOR_CRITICIDAD: Record<NivelValoracion, string> = {
  BAJA: 'green',
  MEDIA: 'gold',
  ALTA: 'red',
};

const NOMBRE_CRITICIDAD: Record<NivelValoracion, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
};

const CELDA_AJUSTABLE: CSSProperties = { whiteSpace: 'normal', wordBreak: 'break-word' };

const NOMBRE_TIPO_ACTIVO: Record<TipoActivo, string> = {
  PRIMARIO: 'Primario',
  SECUNDARIO: 'Secundario',
};

export function ActivosPage() {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['activos'], queryFn: fetchActivos });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [activoEditando, setActivoEditando] = useState<Activo | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Filtro instantáneo en el cliente — mismo criterio que en Documentos: el listado
  // completo ya viaja en un solo request, así que filtrar localmente responde al
  // instante en cada tecla, sin ida y vuelta al servidor.
  const activos = data?.results ?? [];
  const activosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    if (!termino) return activos;
    return activos.filter((activo) => {
      const campos = [
        activo.codigo,
        activo.nombre,
        activo.proceso_nombre,
        NOMBRE_TIPO_ACTIVO[activo.tipo_activo],
        NOMBRE_CLASE[activo.clase_activo],
        activo.etiquetado,
        activo.propietario,
        NOMBRE_CRITICIDAD[activo.criticidad],
        activo.estado,
      ];
      return campos.some((campo) => campo && normalizarTexto(campo).includes(termino));
    });
  }, [activos, busqueda]);

  const eliminarMutation = useMutation({
    mutationFn: eliminarActivo,
    onSuccess: () => {
      message.success('Activo eliminado.');
      queryClient.invalidateQueries({ queryKey: ['activos'] });
    },
    onError: () => message.error('No se pudo eliminar el activo.'),
  });

  function abrirCrear() {
    setActivoEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(activo: Activo) {
    setActivoEditando(activo);
    setModalAbierto(true);
  }

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 90,
      render: (codigo: string) => <strong>{codigo}</strong>,
    },
    {
      title: 'Nombre', dataIndex: 'nombre', key: 'nombre', width: 220,
      onCell: () => ({ style: CELDA_AJUSTABLE }),
    },
    {
      title: 'Proceso',
      dataIndex: 'proceso_nombre',
      key: 'proceso_nombre',
      width: 160,
      onCell: () => ({ style: CELDA_AJUSTABLE }),
      render: (p: string | null) => p ?? '—',
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo_activo',
      key: 'tipo_activo',
      width: 100,
      render: (tipo: TipoActivo) => (tipo === 'PRIMARIO' ? 'Primario' : 'Secundario'),
    },
    {
      title: 'Clase',
      dataIndex: 'clase_activo',
      key: 'clase_activo',
      width: 170,
      onCell: () => ({ style: CELDA_AJUSTABLE }),
      render: (clase: ClaseActivo) => NOMBRE_CLASE[clase],
    },
    {
      title: 'Etiquetado',
      dataIndex: 'etiquetado',
      key: 'etiquetado',
      width: 110,
      render: (etiquetado: EtiquetadoActivo) => <Tag color={COLOR_ETIQUETADO[etiquetado]}>{etiquetado}</Tag>,
    },
    {
      title: 'Propietario', dataIndex: 'propietario', key: 'propietario', width: 200,
      onCell: () => ({ style: CELDA_AJUSTABLE }),
    },
    {
      title: 'Criticidad',
      dataIndex: 'criticidad',
      key: 'criticidad',
      width: 130,
      sorter: (a: Activo, b: Activo) => a.puntaje_valoracion - b.puntaje_valoracion,
      render: (criticidad: NivelValoracion, activo: Activo) => (
        <Tag color={COLOR_CRITICIDAD[criticidad]}>
          {NOMBRE_CRITICIDAD[criticidad]} ({activo.puntaje_valoracion})
        </Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 130,
      render: (estado: EstadoActivo) => <Tag color={COLOR_ESTADO[estado]}>{estado}</Tag>,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 140,
      render: (_: unknown, activo: Activo) => (
        <Space>
          {hasPerm('activos.change_activo') && (
            <Button size="small" onClick={() => abrirEditar(activo)}>Editar</Button>
          )}
          {hasPerm('activos.delete_activo') && (
            <Popconfirm
              title="¿Eliminar este activo?"
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              onConfirm={() => eliminarMutation.mutate(activo.id)}
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
      title="Activos de información"
      extra={
        hasPerm('activos.add_activo') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Nuevo activo</Button>
        )
      }
    >
      <ErrorCarga visible={isError} entidad="los activos" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#898781' }} />}
          placeholder="Buscar por código, nombre, proceso, tipo, clase, propietario, criticidad o estado..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: 480 }}
        />
        {busqueda && (
          <Typography.Text type="secondary">
            {activosFiltrados.length} de {activos.length} activos
          </Typography.Text>
        )}
      </div>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={activosFiltrados}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} activos` }}
        scroll={{ x: 1450 }}
        locale={{
          emptyText: busqueda ? <Empty description={`Ningún activo coincide con "${busqueda}".`} /> : undefined,
        }}
      />
      <ActivoFormModal open={modalAbierto} activo={activoEditando} onClose={() => setModalAbierto(false)} />
    </Card>
  );
}
