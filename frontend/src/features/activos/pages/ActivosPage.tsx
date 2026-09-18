import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Col, Empty, Input, Popconfirm, Row, Space, Table, Tag, Typography, message } from 'antd';
import { useMemo, useState, type CSSProperties } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { BRAND } from '../../../shared/theme/brand';
import { normalizarTexto } from '../../../shared/utils/normalizarTexto';
import { ActivoFormModal } from '../components/ActivoFormModal';
import { eliminarActivo, fetchActivos } from '../api';
import type { Activo, ClaseActivo, EstadoActivo, EtiquetadoActivo, NivelValoracion, TipoActivo } from '../types';

// Misma paleta categórica que GraficaHallazgosPorProceso — orden fijo, reasignada de
// forma determinista según el conteo descendente de cada carga (el proceso no es un
// enum fijo, es un catálogo dinámico que crece con cada organización).
const PALETA_PROCESO = [
  '#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7',
];
const SIN_PROCESO_COLOR = '#65645f';

function fondoClaro(colorHex: string, alpha = 0.14) {
  const r = parseInt(colorHex.slice(1, 3), 16);
  const g = parseInt(colorHex.slice(3, 5), 16);
  const b = parseInt(colorHex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const NIVELES_CRITICIDAD: NivelValoracion[] = ['ALTA', 'MEDIA', 'BAJA'];
const HEX_CRITICIDAD: Record<NivelValoracion, string> = {
  ALTA: '#e34948',
  MEDIA: '#eda100',
  BAJA: '#008300',
};

function TarjetaKpi({
  color,
  valor,
  etiqueta,
  seleccionada,
  onClick,
  desglose,
}: {
  color: string;
  valor: number;
  etiqueta: string;
  seleccionada: boolean;
  onClick: () => void;
  desglose?: Record<NivelValoracion, number>;
}) {
  return (
    <Card
      size="small"
      hoverable
      onClick={onClick}
      styles={{ body: { padding: '14px 16px', height: '100%' } }}
      style={{
        cursor: 'pointer',
        height: '100%',
        background: fondoClaro(color, seleccionada ? 0.22 : 0.14),
        borderColor: seleccionada ? color : undefined,
        boxShadow: seleccionada ? `0 0 0 1px ${color}` : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, height: '100%' }}>
        <div style={{ width: 4, borderRadius: 2, background: color }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, color: '#1a1a1a' }}>{valor}</div>
          <div style={{ fontSize: 12.5, color: '#4a4944' }}>{etiqueta}</div>
          {desglose && (
            <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap', minHeight: 16 }}>
              {NIVELES_CRITICIDAD.filter((nivel) => desglose[nivel] > 0).map((nivel) => (
                <span
                  key={nivel}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: HEX_CRITICIDAD[nivel],
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ color: '#65645f' }}>{NOMBRE_CRITICIDAD[nivel]} {desglose[nivel]}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

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
  // undefined = sin filtro (tarjeta "Total"); null = tarjeta "Sin proceso asignado";
  // string = nombre de un proceso puntual.
  const [filtroProceso, setFiltroProceso] = useState<string | null | undefined>(undefined);

  // Filtro instantáneo en el cliente — mismo criterio que en Documentos: el listado
  // completo ya viaja en un solo request, así que filtrar localmente responde al
  // instante en cada tecla, sin ida y vuelta al servidor.
  const activos = data?.results ?? [];
  const activosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    return activos.filter((activo) => {
      if (filtroProceso !== undefined && activo.proceso_nombre !== filtroProceso) return false;
      if (!termino) return true;
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
  }, [activos, busqueda, filtroProceso]);

  function desgloseCriticidadDe(lista: Activo[]): Record<NivelValoracion, number> {
    const conteo: Record<NivelValoracion, number> = { ALTA: 0, MEDIA: 0, BAJA: 0 };
    lista.forEach((activo) => {
      conteo[activo.criticidad] += 1;
    });
    return conteo;
  }

  const desgloseTotal = useMemo(() => desgloseCriticidadDe(activos), [activos]);

  const resumenProcesos = useMemo(() => {
    const grupos = new Map<string | null, Activo[]>();
    activos.forEach((activo) => {
      const grupo = grupos.get(activo.proceso_nombre) ?? [];
      grupo.push(activo);
      grupos.set(activo.proceso_nombre, grupo);
    });
    return [...grupos.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([nombre, lista], indice) => ({
        nombre,
        total: lista.length,
        color: nombre === null ? SIN_PROCESO_COLOR : PALETA_PROCESO[indice % PALETA_PROCESO.length],
        desglose: desgloseCriticidadDe(lista),
      }));
  }, [activos]);

  function alternarFiltroProceso(nombre: string | null) {
    setFiltroProceso((actual) => (actual === nombre ? undefined : nombre));
  }

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
      <Row gutter={[12, 12]} align="stretch" style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={4}>
          <TarjetaKpi
            color={BRAND.teal}
            valor={activos.length}
            etiqueta="Total de activos"
            seleccionada={filtroProceso === undefined}
            onClick={() => setFiltroProceso(undefined)}
            desglose={desgloseTotal}
          />
        </Col>
        {resumenProcesos.map((proceso) => (
          <Col key={proceso.nombre ?? '__sin_proceso__'} xs={12} sm={8} md={4}>
            <TarjetaKpi
              color={proceso.color}
              valor={proceso.total}
              etiqueta={proceso.nombre ?? 'Sin proceso asignado'}
              seleccionada={filtroProceso === proceso.nombre}
              onClick={() => alternarFiltroProceso(proceso.nombre)}
              desglose={proceso.desglose}
            />
          </Col>
        ))}
      </Row>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#898781' }} />}
          placeholder="Buscar por código, nombre, proceso, tipo, clase, propietario, criticidad o estado..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: 480 }}
        />
        {filtroProceso !== undefined && (
          <Tag
            closable
            onClose={() => setFiltroProceso(undefined)}
            color={resumenProcesos.find((p) => p.nombre === filtroProceso)?.color ?? SIN_PROCESO_COLOR}
            style={{ borderColor: 'transparent' }}
          >
            Filtrando por: {filtroProceso ?? 'Sin proceso asignado'}
          </Tag>
        )}
        {(busqueda || filtroProceso !== undefined) && (
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
          emptyText:
            busqueda || filtroProceso !== undefined ? (
              <Empty description="Ningún activo coincide con el filtro aplicado." />
            ) : undefined,
        }}
      />
      <ActivoFormModal open={modalAbierto} activo={activoEditando} onClose={() => setModalAbierto(false)} />
    </Card>
  );
}
