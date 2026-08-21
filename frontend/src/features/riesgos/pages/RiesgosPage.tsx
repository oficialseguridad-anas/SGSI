import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Popconfirm, Space, Table, Tag, message } from 'antd';
import { useState } from 'react';
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

  const columns = [
    { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 90 },
    {
      title: 'Activos',
      dataIndex: 'activos_nombres',
      key: 'activos_nombres',
      width: 220,
      render: (nombres: string[]) => nombres.join(', '),
    },
    { title: 'Amenaza', dataIndex: 'amenaza_nombre', key: 'amenaza_nombre', width: 160 },
    {
      title: 'Riesgo inherente',
      dataIndex: 'riesgo_inherente',
      key: 'riesgo_inherente',
      width: 130,
      sorter: (a: Riesgo, b: Riesgo) => a.riesgo_inherente - b.riesgo_inherente,
      defaultSortOrder: 'descend' as const,
    },
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
    { title: 'Propietario', dataIndex: 'propietario_nombre', key: 'propietario_nombre', width: 160 },
    {
      title: 'Activo',
      dataIndex: 'esta_activo',
      key: 'esta_activo',
      width: 90,
      render: (estaActivo: boolean) => (estaActivo ? <Tag color="green">Sí</Tag> : <Tag color="default">No</Tag>),
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
        scroll={{ x: 1190 }}
      />
      <RiesgoFormModal open={modalAbierto} riesgo={riesgoEditando} onClose={() => setModalAbierto(false)} />
      <MapaCalorRiesgosModal open={mapaCalorAbierto} onClose={() => setMapaCalorAbierto(false)} />
    </Card>
  );
}
