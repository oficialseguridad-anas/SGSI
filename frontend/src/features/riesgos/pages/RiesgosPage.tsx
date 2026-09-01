import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Empty, Input, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { normalizarTexto } from '../../../shared/utils/normalizarTexto';
import { GestionarTratamientoModal } from '../components/GestionarTratamientoModal';
import { MapaCalorRiesgosModal } from '../components/MapaCalorRiesgosModal';
import { PrevisualizarEvidenciasModal } from '../components/PrevisualizarEvidenciasModal';
import { RiesgoFormModal } from '../components/RiesgoFormModal';
import { eliminarRiesgo, fetchRiesgos } from '../api';
import {
  COLOR_ESTADO_TRATAMIENTO,
  NOMBRE_ESTADO_TRATAMIENTO,
  TEXTO_ESTADO_TRATAMIENTO,
} from '../estadoTratamiento';
import { COLOR_NIVEL_RIESGO, NOMBRE_NIVEL_RIESGO, TEXTO_NIVEL_RIESGO } from '../nivelRiesgo';
import type { Riesgo } from '../types';

function ultimoTratamientoDe(riesgo: Riesgo) {
  return riesgo.tratamientos.reduce<Riesgo['tratamientos'][number] | null>(
    (mas_reciente, actual) => (!mas_reciente || actual.id > mas_reciente.id ? actual : mas_reciente),
    null,
  );
}

export function RiesgosPage() {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['riesgos'], queryFn: fetchRiesgos });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [riesgoEditando, setRiesgoEditando] = useState<Riesgo | null>(null);
  const [mapaCalorAbierto, setMapaCalorAbierto] = useState(false);
  const [tratamientoModalAbierto, setTratamientoModalAbierto] = useState(false);
  const [riesgoParaTratamiento, setRiesgoParaTratamiento] = useState<Riesgo | null>(null);
  const [previsualizarAbierto, setPrevisualizarAbierto] = useState(false);
  const [tratamientoParaPrevisualizar, setTratamientoParaPrevisualizar] = useState<Riesgo['tratamientos'][number] | null>(
    null,
  );
  const [busqueda, setBusqueda] = useState('');

  const riesgos = data?.results ?? [];
  const riesgosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    if (!termino) return riesgos;
    return riesgos.filter((riesgo) => {
      const campos = [
        riesgo.codigo,
        riesgo.amenaza_nombre,
        NOMBRE_NIVEL_RIESGO[riesgo.nivel_de_riesgo],
        ...riesgo.activos_nombres,
        ...riesgo.propietarios_nombres,
      ];
      return campos.some((campo) => campo && normalizarTexto(campo).includes(termino));
    });
  }, [riesgos, busqueda]);

  function abrirPrevisualizacion(tratamiento: Riesgo['tratamientos'][number]) {
    setTratamientoParaPrevisualizar(tratamiento);
    setPrevisualizarAbierto(true);
  }

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
      title: 'Propietarios',
      dataIndex: 'propietarios_nombres',
      key: 'propietarios_nombres',
      width: 180,
      render: (nombres: string[]) =>
        nombres.length ? (
          <Space size={[4, 4]} wrap>
            {nombres.map((n) => (
              <Tag key={n}>{n}</Tag>
            ))}
          </Space>
        ) : (
          'Sin asignar'
        ),
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
        const nivel = ultimoTratamientoDe(riesgo)?.nivel_de_riesgo_residual;
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
      title: 'Estado del tratamiento',
      key: 'estado_tratamiento',
      width: 150,
      render: (_: unknown, riesgo: Riesgo) => {
        const tratamiento = ultimoTratamientoDe(riesgo);
        const estado = tratamiento?.estado ?? 'SIN_TRATAMIENTO';
        const esClicable = estado === 'COMPLETADO' && !!tratamiento;
        return (
          <div
            role={esClicable ? 'button' : undefined}
            onClick={esClicable ? () => abrirPrevisualizacion(tratamiento) : undefined}
            title={esClicable ? 'Ver soporte(s) del tratamiento' : undefined}
            style={{
              background: COLOR_ESTADO_TRATAMIENTO[estado],
              color: TEXTO_ESTADO_TRATAMIENTO[estado],
              borderRadius: 4,
              padding: '4px 10px',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: 12,
              cursor: esClicable ? 'pointer' : 'default',
            }}
          >
            {NOMBRE_ESTADO_TRATAMIENTO[estado]}
          </div>
        );
      },
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 140,
      render: (_: unknown, riesgo: Riesgo) => (
        <Space>
          {hasPerm('riesgos.change_riesgo') && (
            <Button size="small" onClick={() => abrirEditar(riesgo)}>Editar</Button>
          )}
          {hasPerm('riesgos.delete_riesgo') && (
            <Popconfirm
              title="¿Eliminar este riesgo?"
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              onConfirm={() => eliminarMutation.mutate(riesgo.id)}
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
      title="Riesgos"
      extra={
        <Space>
          <Button onClick={() => setMapaCalorAbierto(true)}>Ver mapa de calor</Button>
          {hasPerm('riesgos.add_riesgo') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Nuevo riesgo</Button>
          )}
        </Space>
      }
    >
      <ErrorCarga visible={isError} entidad="los riesgos" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#898781' }} />}
          placeholder="Buscar por código, activo, amenaza, nivel de riesgo o propietario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: 480 }}
        />
        {busqueda && (
          <Typography.Text type="secondary">
            {riesgosFiltrados.length} de {riesgos.length} riesgos
          </Typography.Text>
        )}
      </div>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={riesgosFiltrados}
        pagination={false}
        scroll={{ x: 1550 }}
        locale={{
          emptyText: busqueda ? <Empty description={`Ningún riesgo coincide con "${busqueda}".`} /> : undefined,
        }}
      />
      <RiesgoFormModal open={modalAbierto} riesgo={riesgoEditando} onClose={() => setModalAbierto(false)} />
      <MapaCalorRiesgosModal open={mapaCalorAbierto} onClose={() => setMapaCalorAbierto(false)} />
      <GestionarTratamientoModal
        open={tratamientoModalAbierto}
        riesgo={riesgoParaTratamiento}
        onClose={() => setTratamientoModalAbierto(false)}
      />
      <PrevisualizarEvidenciasModal
        open={previsualizarAbierto}
        titulo="Soportes del tratamiento completado"
        archivos={tratamientoParaPrevisualizar?.archivos_adjuntos ?? []}
        onClose={() => setPrevisualizarAbierto(false)}
      />
    </Card>
  );
}
