import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Col, Empty, Input, Popconfirm, Row, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { BRAND } from '../../../shared/theme/brand';
import { normalizarTexto } from '../../../shared/utils/normalizarTexto';
import { fetchAuditorias } from '../../auditoriaInterna/api';
import type { Auditoria } from '../../auditoriaInterna/types';
import { GestionarSeguimientoModal } from '../components/GestionarSeguimientoModal';
import { HallazgoFormModal } from '../components/HallazgoFormModal';
import { RelacionarChecklistModal } from '../components/RelacionarChecklistModal';
import { eliminarHallazgo, fetchHallazgos } from '../api';
import { COLOR_ESTADO_HALLAZGO, NOMBRE_ESTADO_HALLAZGO, TEXTO_ESTADO_HALLAZGO } from '../estadoHallazgo';
import { NOMBRE_TIPO_HALLAZGO } from '../tipoHallazgo';
import type { EstadoHallazgo, Hallazgo } from '../types';

const ESTADOS_HALLAZGO: EstadoHallazgo[] = ['ABIERTA', 'EN_PROCESO', 'CERRADA'];

// Mismo patrón que Objetivos/Indicadores: recorta el texto a N líneas y muestra el
// contenido completo en un tooltip al pasar el mouse, en vez de romper el layout de la
// tabla con celdas de alto variable o forzar scroll horizontal excesivo.
function textoCompacto(texto: string, filas = 3, ancho = 220) {
  if (!texto) return '—';
  return (
    <Typography.Paragraph
      ellipsis={{ rows: filas, tooltip: { title: texto, placement: 'topLeft' } }}
      style={{ marginBottom: 0, maxWidth: ancho }}
    >
      {texto}
    </Typography.Paragraph>
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

export function HallazgosPage() {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['hallazgos'], queryFn: fetchHallazgos });
  const { data: auditorias } = useQuery({ queryKey: ['auditorias'], queryFn: () => fetchAuditorias() });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [hallazgoEditando, setHallazgoEditando] = useState<Hallazgo | null>(null);
  const [seguimientoModalAbierto, setSeguimientoModalAbierto] = useState(false);
  const [hallazgoParaSeguimiento, setHallazgoParaSeguimiento] = useState<Hallazgo | null>(null);
  const [relacionarModalAbierto, setRelacionarModalAbierto] = useState(false);
  const [hallazgoParaRelacionar, setHallazgoParaRelacionar] = useState<Hallazgo | null>(null);
  const [auditoriaParaRelacionar, setAuditoriaParaRelacionar] = useState<Auditoria | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoHallazgo | null>(null);

  const hallazgos = data?.results ?? [];
  const hallazgosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    return hallazgos.filter((h) => {
      if (filtroEstado && h.estado !== filtroEstado) return false;
      if (!termino) return true;
      const campos = [
        h.codigo,
        h.descripcion,
        h.evidencia_asociada,
        h.analisis_causa,
        NOMBRE_ESTADO_HALLAZGO[h.estado],
        ...h.procesos_nombres,
        ...h.tipos_nombres,
        ...h.controles_codigos,
        ...h.controles_nombres,
        ...h.numerales_codigos,
        ...h.numerales_nombres,
      ];
      return campos.some((campo) => campo && normalizarTexto(campo).includes(termino));
    });
  }, [hallazgos, busqueda, filtroEstado]);

  const resumenEstados = useMemo(() => {
    const conteo: Record<EstadoHallazgo, number> = { ABIERTA: 0, EN_PROCESO: 0, CERRADA: 0 };
    hallazgos.forEach((h) => {
      conteo[h.estado] += 1;
    });
    return conteo;
  }, [hallazgos]);

  function alternarFiltroEstado(estado: EstadoHallazgo) {
    setFiltroEstado((actual) => (actual === estado ? null : estado));
  }

  // La auditoría "real" de un año es la primera (más reciente) Auditoria con fecha de
  // ejecución dentro de ese año — con eso se decide en qué pestañas aparece la columna
  // para relacionar hallazgos con la Lista de Verificación de esa auditoría.
  const auditoriaPorAnio = useMemo(() => {
    const mapa = new Map<number, Auditoria>();
    (auditorias?.results ?? []).forEach((auditoria) => {
      if (!auditoria.fecha_auditoria) return;
      const anio = Number(auditoria.fecha_auditoria.slice(0, 4));
      const actual = mapa.get(anio);
      if (!actual || auditoria.fecha_auditoria > actual.fecha_auditoria!) {
        mapa.set(anio, auditoria);
      }
    });
    return mapa;
  }, [auditorias]);

  const hallazgosPorAnio = useMemo(() => {
    const mapa = new Map<number, Hallazgo[]>();
    hallazgosFiltrados.forEach((hallazgo) => {
      const anio = Number(hallazgo.fecha_deteccion.slice(0, 4));
      if (!mapa.has(anio)) mapa.set(anio, []);
      mapa.get(anio)!.push(hallazgo);
    });
    return mapa;
  }, [hallazgosFiltrados]);

  const anios = useMemo(() => Array.from(hallazgosPorAnio.keys()).sort((a, b) => b - a), [hallazgosPorAnio]);

  function abrirRelacionar(hallazgo: Hallazgo, auditoria: Auditoria) {
    setHallazgoParaRelacionar(hallazgo);
    setAuditoriaParaRelacionar(auditoria);
    setRelacionarModalAbierto(true);
  }

  const eliminarMutation = useMutation({
    mutationFn: eliminarHallazgo,
    onSuccess: () => {
      message.success('Hallazgo eliminado.');
      queryClient.invalidateQueries({ queryKey: ['hallazgos'] });
    },
    onError: () => message.error('No se pudo eliminar el hallazgo.'),
  });

  function abrirCrear() {
    setHallazgoEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(hallazgo: Hallazgo) {
    setHallazgoEditando(hallazgo);
    setModalAbierto(true);
  }

  function abrirSeguimiento(hallazgo: Hallazgo) {
    setHallazgoParaSeguimiento(hallazgo);
    setSeguimientoModalAbierto(true);
  }

  const auditoriaParaSeguimiento = hallazgoParaSeguimiento
    ? auditoriaPorAnio.get(Number(hallazgoParaSeguimiento.fecha_deteccion.slice(0, 4)))
    : undefined;

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 90,
      sorter: (a: Hallazgo, b: Hallazgo) => a.codigo.localeCompare(b.codigo),
      render: (codigo: string) => <strong>{codigo}</strong>,
    },
    {
      title: 'Fecha detección',
      dataIndex: 'fecha_deteccion',
      key: 'fecha_deteccion',
      width: 110,
      sorter: (a: Hallazgo, b: Hallazgo) => a.fecha_deteccion.localeCompare(b.fecha_deteccion),
    },
    {
      title: 'Proceso',
      dataIndex: 'procesos_nombres',
      key: 'procesos_nombres',
      width: 180,
      render: (nombres: string[]) => (
        <Space size={[4, 4]} wrap>
          {nombres.map((n) => (
            <Tag key={n}>{n}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Tipo',
      key: 'tipos',
      width: 130,
      render: (_: unknown, hallazgo: Hallazgo) => (
        <Space size={[4, 4]} wrap>
          {hallazgo.tipos_codigos.map((codigo, i) => (
            <Tag key={codigo}>{NOMBRE_TIPO_HALLAZGO[codigo] ?? hallazgo.tipos_nombres[i]}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      width: 260,
      render: (texto: string) => textoCompacto(texto, 3, 260),
    },
    {
      title: 'Evidencia asociada',
      dataIndex: 'evidencia_asociada',
      key: 'evidencia_asociada',
      width: 180,
      render: (texto: string) => textoCompacto(texto, 3, 180),
    },
    {
      title: 'Requisito incumplido',
      key: 'requisito_incumplido',
      width: 320,
      render: (_: unknown, hallazgo: Hallazgo) =>
        hallazgo.controles_codigos.length || hallazgo.numerales_codigos.length ? (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            {hallazgo.controles_codigos.map((c, i) => (
              <div key={`c-${c}`}>
                <Tag>{c}</Tag>
                <Typography.Text style={{ fontSize: 12 }}>{hallazgo.controles_nombres[i]}</Typography.Text>
              </div>
            ))}
            {hallazgo.numerales_codigos.map((n, i) => (
              <div key={`n-${n}`}>
                <Tag color="blue">N.{n}</Tag>
                <Typography.Text style={{ fontSize: 12 }}>{hallazgo.numerales_nombres[i]}</Typography.Text>
              </div>
            ))}
          </Space>
        ) : (
          '—'
        ),
    },
    {
      title: 'Análisis de causa',
      dataIndex: 'analisis_causa',
      key: 'analisis_causa',
      width: 260,
      render: (texto: string) => textoCompacto(texto, 3, 260),
    },
    {
      title: 'Seguimiento',
      key: 'seguimiento',
      width: 170,
      render: (_: unknown, hallazgo: Hallazgo) => (
        <Button size="small" onClick={() => abrirSeguimiento(hallazgo)}>
          {hallazgo.seguimientos.length > 0
            ? `Gestionar (${hallazgo.seguimientos.length})`
            : 'Agregar seguimiento'}
        </Button>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 110,
      render: (estado: Hallazgo['estado']) => (
        <div
          style={{
            background: COLOR_ESTADO_HALLAZGO[estado],
            color: TEXTO_ESTADO_HALLAZGO[estado],
            borderRadius: 4,
            padding: '4px 10px',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          {NOMBRE_ESTADO_HALLAZGO[estado]}
        </div>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 140,
      render: (_: unknown, hallazgo: Hallazgo) => (
        <Space>
          {hasPerm('auditorias.change_hallazgo') && (
            <Button size="small" onClick={() => abrirEditar(hallazgo)}>Editar</Button>
          )}
          {hasPerm('auditorias.delete_hallazgo') && (
            <Popconfirm
              title="¿Eliminar este hallazgo?"
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              onConfirm={() => eliminarMutation.mutate(hallazgo.id)}
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
      title="Hallazgos de auditoría"
      extra={
        hasPerm('auditorias.add_hallazgo') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Nuevo hallazgo</Button>
        )
      }
    >
      <ErrorCarga visible={isError} entidad="los hallazgos" />
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={6}>
          <TarjetaKpi
            color={BRAND.teal}
            valor={hallazgos.length}
            etiqueta="Total de hallazgos"
            seleccionada={filtroEstado === null}
            onClick={() => setFiltroEstado(null)}
          />
        </Col>
        {ESTADOS_HALLAZGO.map((estado) => (
          <Col key={estado} xs={12} sm={8} md={6}>
            <TarjetaKpi
              color={COLOR_ESTADO_HALLAZGO[estado]}
              valor={resumenEstados[estado]}
              etiqueta={NOMBRE_ESTADO_HALLAZGO[estado]}
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
          placeholder="Buscar por código, proceso, tipo, descripción, requisito o estado..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: 480 }}
        />
        {filtroEstado && (
          <Tag
            closable
            onClose={() => setFiltroEstado(null)}
            color={COLOR_ESTADO_HALLAZGO[filtroEstado]}
            style={{ color: TEXTO_ESTADO_HALLAZGO[filtroEstado], borderColor: 'transparent' }}
          >
            Filtrando por: {NOMBRE_ESTADO_HALLAZGO[filtroEstado]}
          </Tag>
        )}
        {(busqueda || filtroEstado) && (
          <Typography.Text type="secondary">
            {hallazgosFiltrados.length} de {hallazgos.length} hallazgos
          </Typography.Text>
        )}
      </div>
      {anios.length === 0 ? (
        <Empty description="No hay hallazgos registrados todavía." />
      ) : (
        <Tabs
          items={anios.map((anio) => ({
            key: String(anio),
            label: `${anio} (${hallazgosPorAnio.get(anio)?.length ?? 0})`,
            children: (
              <Table
                rowKey="id"
                loading={isLoading}
                columns={columns}
                dataSource={hallazgosPorAnio.get(anio) ?? []}
                pagination={false}
                scroll={{ x: 1950 }}
                locale={{
                  emptyText:
                    busqueda || filtroEstado ? (
                      <Empty description="Ningún hallazgo coincide con el filtro aplicado." />
                    ) : undefined,
                }}
              />
            ),
          }))}
        />
      )}
      <HallazgoFormModal open={modalAbierto} hallazgo={hallazgoEditando} onClose={() => setModalAbierto(false)} />
      <GestionarSeguimientoModal
        open={seguimientoModalAbierto}
        hallazgo={hallazgoParaSeguimiento}
        auditoriaRelacionada={auditoriaParaSeguimiento}
        onRelacionar={() => abrirRelacionar(hallazgoParaSeguimiento!, auditoriaParaSeguimiento!)}
        onClose={() => setSeguimientoModalAbierto(false)}
      />
      <RelacionarChecklistModal
        open={relacionarModalAbierto}
        hallazgo={hallazgoParaRelacionar}
        auditoriaId={auditoriaParaRelacionar?.id ?? null}
        auditoriaCodigo={auditoriaParaRelacionar?.codigo ?? null}
        onClose={() => setRelacionarModalAbierto(false)}
      />
    </Card>
  );
}
