import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Col, Empty, Input, Popconfirm, Row, Space, Table, Tag, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { BRAND } from '../../../shared/theme/brand';
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
  type EstadoTratamientoConSinTratar,
} from '../estadoTratamiento';
import { COLOR_NIVEL_RIESGO, NOMBRE_NIVEL_RIESGO, TEXTO_NIVEL_RIESGO } from '../nivelRiesgo';
import type { Riesgo } from '../types';

const ESTADOS_TRATAMIENTO: EstadoTratamientoConSinTratar[] = ['SIN_TRATAMIENTO', 'PENDIENTE', 'VENCIDO', 'COMPLETADO'];

function ultimoTratamientoDe(riesgo: Riesgo) {
  return riesgo.tratamientos.reduce<Riesgo['tratamientos'][number] | null>(
    (mas_reciente, actual) => (!mas_reciente || actual.id > mas_reciente.id ? actual : mas_reciente),
    null,
  );
}

function fondoClaro(colorHex: string, alpha = 0.14) {
  const r = parseInt(colorHex.slice(1, 3), 16);
  const g = parseInt(colorHex.slice(3, 5), 16);
  const b = parseInt(colorHex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function TarjetaKpi({
  color,
  valor,
  etiqueta,
  seleccionada,
  onClick,
}: {
  color: string;
  valor: number;
  etiqueta: string;
  seleccionada: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      size="small"
      hoverable
      onClick={onClick}
      styles={{ body: { padding: '14px 16px' } }}
      style={{
        cursor: 'pointer',
        background: fondoClaro(color, seleccionada ? 0.22 : 0.14),
        borderColor: seleccionada ? color : undefined,
        boxShadow: seleccionada ? `0 0 0 1px ${color}` : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 12 }}>
        <div style={{ width: 4, borderRadius: 2, background: color }} />
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, color: '#1a1a1a' }}>{valor}</div>
          <div style={{ fontSize: 12.5, color: '#4a4944' }}>{etiqueta}</div>
        </div>
      </div>
    </Card>
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
  const [filtroEstado, setFiltroEstado] = useState<EstadoTratamientoConSinTratar | null>(null);

  const riesgos = data?.results ?? [];
  const riesgosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    return riesgos.filter((riesgo) => {
      if (filtroEstado && (ultimoTratamientoDe(riesgo)?.estado ?? 'SIN_TRATAMIENTO') !== filtroEstado) {
        return false;
      }
      if (!termino) return true;
      const campos = [
        riesgo.codigo,
        riesgo.amenaza_nombre,
        NOMBRE_NIVEL_RIESGO[riesgo.nivel_de_riesgo],
        ...riesgo.activos_nombres,
        ...riesgo.propietarios_nombres,
      ];
      return campos.some((campo) => campo && normalizarTexto(campo).includes(termino));
    });
  }, [riesgos, busqueda, filtroEstado]);

  function alternarFiltroEstado(estado: EstadoTratamientoConSinTratar) {
    setFiltroEstado((actual) => (actual === estado ? null : estado));
  }

  const resumenEstados = useMemo(() => {
    const conteo: Record<EstadoTratamientoConSinTratar, number> = {
      SIN_TRATAMIENTO: 0,
      PENDIENTE: 0,
      VENCIDO: 0,
      COMPLETADO: 0,
    };
    riesgos.forEach((riesgo) => {
      const estado = ultimoTratamientoDe(riesgo)?.estado ?? 'SIN_TRATAMIENTO';
      conteo[estado] += 1;
    });
    return conteo;
  }, [riesgos]);

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
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={4}>
          <TarjetaKpi
            color={BRAND.teal}
            valor={riesgos.length}
            etiqueta="Total de riesgos"
            seleccionada={filtroEstado === null}
            onClick={() => setFiltroEstado(null)}
          />
        </Col>
        {ESTADOS_TRATAMIENTO.map((estado) => (
          <Col key={estado} xs={12} sm={8} md={5}>
            <TarjetaKpi
              color={COLOR_ESTADO_TRATAMIENTO[estado]}
              valor={resumenEstados[estado]}
              etiqueta={NOMBRE_ESTADO_TRATAMIENTO[estado]}
              seleccionada={filtroEstado === estado}
              onClick={() => alternarFiltroEstado(estado)}
            />
          </Col>
        ))}
      </Row>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#898781' }} />}
          placeholder="Buscar por código, activo, amenaza, nivel de riesgo o propietario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: 480 }}
        />
        {filtroEstado && (
          <Tag
            closable
            onClose={() => setFiltroEstado(null)}
            color={COLOR_ESTADO_TRATAMIENTO[filtroEstado]}
            style={{ color: TEXTO_ESTADO_TRATAMIENTO[filtroEstado], borderColor: 'transparent' }}
          >
            Filtrando por: {NOMBRE_ESTADO_TRATAMIENTO[filtroEstado]}
          </Tag>
        )}
        {(busqueda || filtroEstado) && (
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
          emptyText:
            busqueda || filtroEstado ? <Empty description="Ningún riesgo coincide con el filtro aplicado." /> : undefined,
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
