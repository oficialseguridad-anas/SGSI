import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { useMemo, useState, type CSSProperties } from 'react';
import { ActivoFormModal } from '../components/ActivoFormModal';
import { eliminarActivo, fetchActivos, fetchProcesos } from '../api';
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

const OPCIONES_CRITICIDAD = [
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
];

export function ActivosPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['activos'], queryFn: fetchActivos });
  const { data: procesos } = useQuery({ queryKey: ['procesos'], queryFn: fetchProcesos });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [activoEditando, setActivoEditando] = useState<Activo | null>(null);
  const [filtroProceso, setFiltroProceso] = useState<string | undefined>(undefined);
  const [filtroCriticidad, setFiltroCriticidad] = useState<NivelValoracion | undefined>(undefined);

  const activosFiltrados = useMemo(() => {
    return (data?.results ?? []).filter((activo) => {
      if (filtroProceso && activo.proceso_nombre !== filtroProceso) return false;
      if (filtroCriticidad && activo.criticidad !== filtroCriticidad) return false;
      return true;
    });
  }, [data, filtroProceso, filtroCriticidad]);

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
    { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 90 },
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
          <Button size="small" onClick={() => abrirEditar(activo)}>Editar</Button>
          <Popconfirm
            title="¿Eliminar este activo?"
            okText="Eliminar"
            okButtonProps={{ danger: true }}
            onConfirm={() => eliminarMutation.mutate(activo.id)}
          >
            <Button size="small" danger>Eliminar</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Activos de información"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Nuevo activo</Button>}
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="Buscar por proceso"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 260 }}
          value={filtroProceso}
          onChange={setFiltroProceso}
          options={procesos?.results.map((p) => ({ value: p.nombre, label: p.nombre }))}
        />
        <Select
          placeholder="Buscar por criticidad"
          allowClear
          style={{ width: 200 }}
          value={filtroCriticidad}
          onChange={setFiltroCriticidad}
          options={OPCIONES_CRITICIDAD}
        />
      </Space>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={activosFiltrados}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} activos` }}
        scroll={{ x: 1450 }}
      />
      <ActivoFormModal open={modalAbierto} activo={activoEditando} onClose={() => setModalAbierto(false)} />
    </Card>
  );
}
