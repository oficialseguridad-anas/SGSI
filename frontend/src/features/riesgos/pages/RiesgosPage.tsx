import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Popconfirm, Space, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { GestionarTratamientoModal } from '../components/GestionarTratamientoModal';
import { MapaCalorRiesgosModal } from '../components/MapaCalorRiesgosModal';
import { RiesgoFormModal } from '../components/RiesgoFormModal';
import { eliminarRiesgo, fetchRiesgos } from '../api';
import { COLOR_NIVEL_RIESGO, NOMBRE_NIVEL_RIESGO, TEXTO_NIVEL_RIESGO } from '../nivelRiesgo';
import type { Riesgo } from '../types';

export function RiesgosPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['riesgos'], queryFn: fetchRiesgos });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [riesgoEditando, setRiesgoEditando] = useState<Riesgo | null>(null);
  const [mapaCalorAbierto, setMapaCalorAbierto] = useState(false);
  const [tratamientoModalAbierto, setTratamientoModalAbierto] = useState(false);
  const [riesgoParaTratamiento, setRiesgoParaTratamiento] = useState<Riesgo | null>(null);

  const eliminarMutation = useMutation({
    mutationFn: eliminarRiesgo,
    onSuccess: () => {
      message.success('Riesgo eliminado.');
      queryClient.invalidateQueries({ queryKey: ['riesgos'] });
    },
    onError: () => message.error('No se pudo eliminar el riesgo.'),
  });

  function abrirCrear() {
    setRiesgoEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(riesgo: Riesgo) {
    setRiesgoEditando(riesgo);
    setModalAbierto(true);
  }

  function abrirTratamiento(riesgo: Riesgo) {
    setRiesgoParaTratamiento(riesgo);
    setTratamientoModalAbierto(true);
  }

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 90,
      sorter: (a: Riesgo, b: Riesgo) => a.codigo.localeCompare(b.codigo),
      defaultSortOrder: 'ascend' as const,
      render: (codigo: string) => <strong>{codigo}</strong>,
    },
    {
      title: 'Activos',
      dataIndex: 'activos_nombres',
      key: 'activos_nombres',
      width: 220,
      render: (nombres: string[]) => nombres.join(', '),
    },
    { title: 'Amenaza', dataIndex: 'amenaza_nombre', key: 'amenaza_nombre', width: 160 },
    {
      title: 'Nivel de riesgo',
      dataIndex: 'nivel_de_riesgo',
      key: 'nivel_de_riesgo',
      width: 130,
      render: (nivel: Riesgo['nivel_de_riesgo']) => (
        <Tag
          color={COLOR_NIVEL_RIESGO[nivel]}
          style={{ color: TEXTO_NIVEL_RIESGO[nivel], borderColor: 'transparent' }}
        >
          {NOMBRE_NIVEL_RIESGO[nivel]}
        </Tag>
      ),
    },
    {
      title: 'Propietario',
      dataIndex: 'propietario_nombre',
      key: 'propietario_nombre',
      width: 160,
      render: (nombre: string | null) => nombre ?? '—  Sin asignar',
    },
    {
      title: 'Activo',
      dataIndex: 'esta_activo',
      key: 'esta_activo',
      width: 90,
      render: (estaActivo: boolean) => (estaActivo ? <Tag color="green">Sí</Tag> : <Tag color="default">No</Tag>),
    },
    {
      title: 'Tratamiento de riesgo',
      key: 'tratamiento',
      width: 170,
      render: (_: unknown, riesgo: Riesgo) => (
        <Button size="small" onClick={() => abrirTratamiento(riesgo)}>
          {riesgo.tratamientos.length > 0
            ? `Gestionar (${riesgo.tratamientos.length})`
            : 'Agregar tratamiento'}
        </Button>
      ),
    },
    {
      title: 'Nivel de riesgo residual',
      key: 'nivel_de_riesgo_residual',
      width: 170,
      render: (_: unknown, riesgo: Riesgo) => {
        const ultimoTratamiento = riesgo.tratamientos.reduce<Riesgo['tratamientos'][number] | null>(
          (mas_reciente, actual) => (!mas_reciente || actual.id > mas_reciente.id ? actual : mas_reciente),
          null,
        );
        const nivel = ultimoTratamiento?.nivel_de_riesgo_residual;
        return nivel ? (
          <Tag color={COLOR_NIVEL_RIESGO[nivel]} style={{ color: TEXTO_NIVEL_RIESGO[nivel], borderColor: 'transparent' }}>
            {NOMBRE_NIVEL_RIESGO[nivel]}
          </Tag>
        ) : (
          '—'
        );
      },
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 140,
      render: (_: unknown, riesgo: Riesgo) => (
        <Space>
          <Button size="small" onClick={() => abrirEditar(riesgo)}>Editar</Button>
          <Popconfirm
            title="¿Eliminar este riesgo?"
            okText="Eliminar"
            okButtonProps={{ danger: true }}
            onConfirm={() => eliminarMutation.mutate(riesgo.id)}
          >
            <Button size="small" danger>Eliminar</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Riesgos"
      extra={
        <Space>
          <Button onClick={() => setMapaCalorAbierto(true)}>Ver mapa de calor</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Nuevo riesgo</Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.results ?? []}
        pagination={false}
        scroll={{ x: 1400 }}
      />
      <RiesgoFormModal open={modalAbierto} riesgo={riesgoEditando} onClose={() => setModalAbierto(false)} />
      <MapaCalorRiesgosModal open={mapaCalorAbierto} onClose={() => setMapaCalorAbierto(false)} />
      <GestionarTratamientoModal
        open={tratamientoModalAbierto}
        riesgo={riesgoParaTratamiento}
        onClose={() => setTratamientoModalAbierto(false)}
      />
    </Card>
  );
}
