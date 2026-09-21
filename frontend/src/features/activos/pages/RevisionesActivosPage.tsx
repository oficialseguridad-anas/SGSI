import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { BRAND } from '../../../shared/theme/brand';
import { normalizarTexto } from '../../../shared/utils/normalizarTexto';
import {
  crearRevisionActivos,
  eliminarRevisionActivos,
  fetchRevisionesActivos,
  fetchSnapshotsActivo,
} from '../api';
import type {
  ClaseActivo,
  EstadoActivo,
  EtiquetadoActivo,
  NivelValoracion,
  RevisionSemestralActivos,
  RevisionSemestralActivosInput,
  SnapshotActivo,
  TipoActivo,
} from '../types';

const NOMBRE_CLASE: Record<ClaseActivo, string> = {
  SISTEMAS_INFORMACION: 'Sistemas de Información',
  PERSONAL: 'Personal',
  SOFTWARE: 'Software',
  HARDWARE: 'Hardware',
  INFORMACION: 'Información',
  ESTRUCTURA_ORGANIZACION: 'Estructura de la organización',
  RED: 'Red',
};

const NOMBRE_TIPO_ACTIVO: Record<TipoActivo, string> = {
  PRIMARIO: 'Primario',
  SECUNDARIO: 'Secundario',
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

const NIVELES_CRITICIDAD: NivelValoracion[] = ['ALTA', 'MEDIA', 'BAJA'];
const HEX_CRITICIDAD: Record<NivelValoracion, string> = {
  ALTA: '#e34948',
  MEDIA: '#eda100',
  BAJA: '#008300',
};

// Misma paleta categórica que GraficaHallazgosPorProceso / ActivosPage — orden fijo,
// reasignada de forma determinista según el conteo descendente (el proceso es un
// catálogo dinámico, no un enum fijo).
const PALETA_PROCESO = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7'];
const SIN_PROCESO_COLOR = '#65645f';

/** "2026-S1" (ene-jun) o "2026-S2" (jul-dic), según la fecha actual. */
function periodoActual(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-S${ahora.getMonth() < 6 ? 1 : 2}`;
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

function desgloseCriticidadDe(lista: SnapshotActivo[]): Record<NivelValoracion, number> {
  const conteo: Record<NivelValoracion, number> = { ALTA: 0, MEDIA: 0, BAJA: 0 };
  lista.forEach((s) => {
    conteo[s.criticidad] += 1;
  });
  return conteo;
}

interface DetalleRevisionProps {
  revision: RevisionSemestralActivos | null;
  onClose: () => void;
}

function DetalleRevisionDrawer({ revision, onClose }: DetalleRevisionProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroProceso, setFiltroProceso] = useState<string | null | undefined>(undefined);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['snapshots-activo', revision?.id],
    queryFn: () => fetchSnapshotsActivo(revision!.id),
    enabled: !!revision,
  });

  const snapshots = data?.results ?? [];

  const snapshotsFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    return snapshots.filter((s) => {
      if (filtroProceso !== undefined && s.proceso_nombre !== filtroProceso) return false;
      if (!termino) return true;
      const campos = [
        s.codigo, s.nombre, s.proceso_nombre, NOMBRE_TIPO_ACTIVO[s.tipo_activo],
        NOMBRE_CLASE[s.clase_activo], s.etiquetado, s.propietario, NOMBRE_CRITICIDAD[s.criticidad], s.estado,
      ];
      return campos.some((campo) => campo && normalizarTexto(campo).includes(termino));
    });
  }, [snapshots, busqueda, filtroProceso]);

  const desgloseTotal = useMemo(() => desgloseCriticidadDe(snapshots), [snapshots]);

  const resumenProcesos = useMemo(() => {
    const grupos = new Map<string | null, SnapshotActivo[]>();
    snapshots.forEach((s) => {
      const grupo = grupos.get(s.proceso_nombre) ?? [];
      grupo.push(s);
      grupos.set(s.proceso_nombre, grupo);
    });
    return [...grupos.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([nombre, lista], indice) => ({
        nombre,
        total: lista.length,
        color: nombre === null ? SIN_PROCESO_COLOR : PALETA_PROCESO[indice % PALETA_PROCESO.length],
        desglose: desgloseCriticidadDe(lista),
      }));
  }, [snapshots]);

  function alternarFiltroProceso(nombre: string | null) {
    setFiltroProceso((actual) => (actual === nombre ? undefined : nombre));
  }

  const columns = [
    { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 90, render: (c: string) => <strong>{c}</strong> },
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre', width: 220 },
    { title: 'Proceso', dataIndex: 'proceso_nombre', key: 'proceso_nombre', width: 160, render: (p: string | null) => p ?? '—' },
    {
      title: 'Tipo', dataIndex: 'tipo_activo', key: 'tipo_activo', width: 100,
      render: (t: TipoActivo) => NOMBRE_TIPO_ACTIVO[t],
    },
    {
      title: 'Clase', dataIndex: 'clase_activo', key: 'clase_activo', width: 170,
      render: (c: ClaseActivo) => NOMBRE_CLASE[c],
    },
    {
      title: 'Etiquetado', dataIndex: 'etiquetado', key: 'etiquetado', width: 110,
      render: (e: EtiquetadoActivo) => <Tag color={COLOR_ETIQUETADO[e]}>{e}</Tag>,
    },
    { title: 'Propietario', dataIndex: 'propietario', key: 'propietario', width: 200 },
    {
      title: 'Criticidad', dataIndex: 'criticidad', key: 'criticidad', width: 130,
      render: (c: NivelValoracion, s: SnapshotActivo) => (
        <Tag color={COLOR_CRITICIDAD[c]}>{NOMBRE_CRITICIDAD[c]} ({s.puntaje_valoracion})</Tag>
      ),
    },
    {
      title: 'Estado', dataIndex: 'estado', key: 'estado', width: 130,
      render: (e: EstadoActivo) => <Tag color={COLOR_ESTADO[e]}>{e}</Tag>,
    },
  ];

  return (
    <Drawer
      title={revision ? `Foto de activos — periodo ${revision.periodo}` : ''}
      open={!!revision}
      onClose={onClose}
      width="min(96vw, 1300px)"
      destroyOnHidden
    >
      {revision && (
        <>
          <Typography.Paragraph type="secondary">
            Revisado el {revision.fecha_revision}
            {revision.realizada_por_nombre ? ` por ${revision.realizada_por_nombre}` : ''}.
            {revision.observaciones ? ` ${revision.observaciones}` : ''}
          </Typography.Paragraph>
          <ErrorCarga visible={isError} entidad="la foto de activos" />
          <Row gutter={[12, 12]} align="stretch" style={{ marginBottom: 16 }}>
            <Col xs={12} sm={8} md={4}>
              <TarjetaKpi
                color={BRAND.teal}
                valor={snapshots.length}
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
              style={{ maxWidth: 420 }}
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
                {snapshotsFiltrados.length} de {snapshots.length} activos
              </Typography.Text>
            )}
          </div>
          <Table
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={snapshotsFiltrados}
            pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t} activos` }}
            scroll={{ x: 1350 }}
            locale={{
              emptyText:
                busqueda || filtroProceso !== undefined ? (
                  <Empty description="Ningún activo coincide con el filtro aplicado." />
                ) : undefined,
            }}
          />
        </>
      )}
    </Drawer>
  );
}

export function RevisionesActivosPage() {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['revisiones-activos'], queryFn: fetchRevisionesActivos });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [revisionAbierta, setRevisionAbierta] = useState<RevisionSemestralActivos | null>(null);
  const [form] = Form.useForm<{ periodo: string; fecha_revision: dayjs.Dayjs; observaciones: string }>();

  const revisiones = data?.results ?? [];

  const crearMutation = useMutation({
    mutationFn: crearRevisionActivos,
    onSuccess: () => {
      message.success('Revisión semestral cerrada: se generó la foto de todos los activos.');
      queryClient.invalidateQueries({ queryKey: ['revisiones-activos'] });
      setModalAbierto(false);
    },
    onError: () => message.error('No se pudo cerrar la revisión. Revisa que el periodo no esté repetido.'),
  });

  const eliminarMutation = useMutation({
    mutationFn: eliminarRevisionActivos,
    onSuccess: () => {
      message.success('Revisión eliminada.');
      queryClient.invalidateQueries({ queryKey: ['revisiones-activos'] });
    },
    onError: () => message.error('No se pudo eliminar la revisión.'),
  });

  function abrirCrear() {
    form.setFieldsValue({ periodo: periodoActual(), fecha_revision: dayjs(), observaciones: '' });
    setModalAbierto(true);
  }

  function confirmarCrear(values: { periodo: string; fecha_revision: dayjs.Dayjs; observaciones: string }) {
    const payload: RevisionSemestralActivosInput = {
      periodo: values.periodo,
      fecha_revision: values.fecha_revision.format('YYYY-MM-DD'),
      observaciones: values.observaciones,
    };
    crearMutation.mutate(payload);
  }

  const columns = [
    { title: 'Periodo', dataIndex: 'periodo', key: 'periodo', width: 140, render: (p: string) => <strong>{p}</strong> },
    { title: 'Fecha de revisión', dataIndex: 'fecha_revision', key: 'fecha_revision', width: 140 },
    { title: 'Cantidad de activos', dataIndex: 'cantidad_activos', key: 'cantidad_activos', width: 150 },
    {
      title: 'Realizada por', dataIndex: 'realizada_por_nombre', key: 'realizada_por_nombre', width: 200,
      render: (n: string | null) => n ?? '—',
    },
    { title: 'Observaciones', dataIndex: 'observaciones', key: 'observaciones', render: (o: string) => o || '—' },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 200,
      render: (_: unknown, revision: RevisionSemestralActivos) => (
        <Space>
          <Button size="small" onClick={() => setRevisionAbierta(revision)}>Ver foto</Button>
          {hasPerm('activos.delete_revisionsemestralactivos') && (
            <Popconfirm
              title="¿Eliminar esta revisión y su foto de activos?"
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              onConfirm={() => eliminarMutation.mutate(revision.id)}
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
      title="Revisiones semestrales de activos"
      extra={
        hasPerm('activos.add_revisionsemestralactivos') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Cerrar revisión semestral</Button>
        )
      }
    >
      <Typography.Paragraph type="secondary">
        Cada vez que cierras una revisión semestral se guarda una "foto" del estado completo
        de la matriz de activos en ese momento (proceso, estado, criticidad, etc.), para que
        puedas volver a consultarla más adelante aunque los activos cambien después.
      </Typography.Paragraph>
      <ErrorCarga visible={isError} entidad="las revisiones de activos" />
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={revisiones}
        pagination={false}
        locale={{ emptyText: <Empty description="Todavía no se ha cerrado ninguna revisión semestral." /> }}
      />

      <Modal
        title="Cerrar revisión semestral"
        open={modalAbierto}
        onCancel={() => setModalAbierto(false)}
        onOk={() => form.submit()}
        confirmLoading={crearMutation.isPending}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">
          Se generará una foto con el estado actual de todos los activos registrados hoy.
          Esta acción no se puede deshacer automáticamente (aunque la revisión se puede
          eliminar después si fue un error).
        </Typography.Paragraph>
        <Form form={form} layout="vertical" onFinish={confirmarCrear}>
          <Form.Item name="periodo" label="Periodo" rules={[{ required: true, message: 'Ingresa un periodo' }]}>
            <Input placeholder="2026-S1" />
          </Form.Item>
          <Form.Item
            name="fecha_revision"
            label="Fecha de revisión"
            rules={[{ required: true, message: 'Selecciona la fecha' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="observaciones" label="Observaciones">
            <Input.TextArea rows={3} placeholder="Notas de esta revisión (opcional)" />
          </Form.Item>
        </Form>
      </Modal>

      <DetalleRevisionDrawer revision={revisionAbierta} onClose={() => setRevisionAbierta(null)} />
    </Card>
  );
}
