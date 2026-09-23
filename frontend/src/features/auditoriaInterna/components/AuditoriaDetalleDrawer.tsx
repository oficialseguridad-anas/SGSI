import { CheckOutlined, DownloadOutlined, PlusOutlined, UnlockOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DatePicker,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Table,
  Tabs,
  Tag,
  TimePicker,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { BRAND } from '../../../shared/theme/brand';
import { fetchEmpleados } from '../../accounts/api';
import { fetchProcesos } from '../../activos/api';
import {
  actualizarAuditoria,
  crearItemVerificacion,
  crearOportunidadPlan,
  crearRiesgoPlan,
  crearSesionAuditoria,
  descargarInformeAuditoriaXlsx,
  eliminarItemVerificacion,
  eliminarOportunidadPlan,
  eliminarRiesgoPlan,
  eliminarSesionAuditoria,
  fetchAuditoria,
  generarHallazgoDesdeItem,
} from '../api';
import type { EstadoAuditoria, ItemVerificacionAuditoria, SesionAuditoria } from '../types';

interface Props {
  auditoriaId: number | null;
  onClose: () => void;
}

const ETIQUETA_ESTADO: Record<EstadoAuditoria, string> = {
  PLANIFICADA: 'Planificada',
  EN_EJECUCION: 'En ejecución',
  CERRADA: 'Cerrada',
};
const COLOR_ESTADO: Record<EstadoAuditoria, string> = {
  PLANIFICADA: 'default',
  EN_EJECUCION: 'blue',
  CERRADA: 'green',
};
const ETIQUETA_TIPO_HALLAZGO: Record<string, string> = {
  CONFORMIDAD: 'Conformidad',
  NO_CONFORMIDAD: 'No Conformidad',
  OPORTUNIDAD_MEJORA: 'Oportunidad de Mejora',
  FORTALEZA: 'Fortaleza',
};
const COLOR_TIPO_HALLAZGO: Record<string, string> = {
  CONFORMIDAD: 'green',
  NO_CONFORMIDAD: 'red',
  OPORTUNIDAD_MEJORA: 'gold',
  FORTALEZA: 'blue',
};
const ETIQUETA_ETAPA: Record<string, string> = { P: 'Planear', H: 'Hacer', V: 'Verificar', A: 'Actuar' };

function TituloSeccion({ children }: { children: React.ReactNode }) {
  return (
    <Typography.Title level={5} style={{ color: BRAND.tealDark, marginTop: 18, marginBottom: 8 }}>
      {children}
    </Typography.Title>
  );
}

type FormValues = {
  objetivo: string;
  alcance: string;
  criterios: string;
  metodologia: string;
  auditor_lider: number | undefined;
  equipo_auditor: number[];
  numero_auditados: number | null;
  numero_auditores: number | null;
  ciudad: string;
  fecha_auditoria: dayjs.Dayjs | null;
  fecha_elaboracion_informe: dayjs.Dayjs | null;
  aprobado_por: number | undefined;
  conclusiones_generales: string;
};

export function AuditoriaDetalleDrawer({ auditoriaId, onClose }: Props) {
  const { user, hasPerm } = useAuth();
  const esAdministrador = Boolean(user?.is_superuser);
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();

  const [nuevoRiesgo, setNuevoRiesgo] = useState({ nombre_riesgo: '', accion_control: '', responsable: '', evidencia: '' });
  const [nuevaOportunidad, setNuevaOportunidad] = useState({ nombre_oportunidad: '', medida_aprovechar: '', responsable: '', evidencia: '' });
  const [nuevaSesion, setNuevaSesion] = useState<{
    ciudad: string; fecha: dayjs.Dayjs | null; hora_inicio: dayjs.Dayjs | null; hora_fin: dayjs.Dayjs | null;
    proceso: number | undefined; tema: string; procedimiento: string; requisitos_a_auditar: string; auditado: string; auditor: number | undefined;
  }>({ ciudad: '', fecha: null, hora_inicio: null, hora_fin: null, proceso: undefined, tema: '', procedimiento: '', requisitos_a_auditar: '', auditado: '', auditor: undefined });
  const [nuevoItem, setNuevoItem] = useState<{
    sesion: number | undefined; etapa: string | undefined; descripcion_elemento: string; requisito_iso: string;
    otros_requisitos: string; tipo_hallazgo: string | undefined; descripcion_hallazgo: string;
  }>({ sesion: undefined, etapa: undefined, descripcion_elemento: '', requisito_iso: '', otros_requisitos: '', tipo_hallazgo: undefined, descripcion_hallazgo: '' });

  const { data: auditoria, isLoading } = useQuery({
    queryKey: ['auditoria', auditoriaId],
    queryFn: () => fetchAuditoria(auditoriaId!),
    enabled: auditoriaId !== null,
  });
  const { data: empleadosData } = useQuery({ queryKey: ['empleados'], queryFn: fetchEmpleados, enabled: auditoriaId !== null });
  const { data: procesosData } = useQuery({ queryKey: ['procesos'], queryFn: fetchProcesos, enabled: auditoriaId !== null });

  useEffect(() => {
    if (!auditoria) return;
    form.setFieldsValue({
      objetivo: auditoria.objetivo,
      alcance: auditoria.alcance,
      criterios: auditoria.criterios,
      metodologia: auditoria.metodologia,
      auditor_lider: auditoria.auditor_lider ?? undefined,
      equipo_auditor: auditoria.equipo_auditor,
      numero_auditados: auditoria.numero_auditados,
      numero_auditores: auditoria.numero_auditores,
      ciudad: auditoria.ciudad,
      fecha_auditoria: auditoria.fecha_auditoria ? dayjs(auditoria.fecha_auditoria) : null,
      fecha_elaboracion_informe: auditoria.fecha_elaboracion_informe ? dayjs(auditoria.fecha_elaboracion_informe) : null,
      aprobado_por: auditoria.aprobado_por ?? undefined,
      conclusiones_generales: auditoria.conclusiones_generales,
    });
  }, [auditoria, form]);

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ['auditoria', auditoriaId] });
    queryClient.invalidateQueries({ queryKey: ['auditorias'] });
  }

  const guardarMutation = useMutation({
    mutationFn: (valores: FormValues) =>
      actualizarAuditoria(auditoriaId!, {
        ...valores,
        auditor_lider: valores.auditor_lider ?? null,
        aprobado_por: valores.aprobado_por ?? null,
        fecha_auditoria: valores.fecha_auditoria ? valores.fecha_auditoria.format('YYYY-MM-DD') : null,
        fecha_elaboracion_informe: valores.fecha_elaboracion_informe ? valores.fecha_elaboracion_informe.format('YYYY-MM-DD') : null,
      }),
    onSuccess: () => {
      message.success('Plan de auditoría guardado.');
      invalidar();
    },
    onError: () => message.error('No se pudo guardar.'),
  });

  const cambiarEstadoMutation = useMutation({
    mutationFn: (estado: EstadoAuditoria) => actualizarAuditoria(auditoriaId!, { estado }),
    onSuccess: (_, estado) => {
      message.success(`Auditoría ${estado === 'CERRADA' ? 'cerrada' : 'actualizada'}.`);
      invalidar();
    },
    onError: () => message.error('No se pudo cambiar el estado.'),
  });

  const crearRiesgoMutation = useMutation({
    mutationFn: crearRiesgoPlan,
    onSuccess: () => {
      setNuevoRiesgo({ nombre_riesgo: '', accion_control: '', responsable: '', evidencia: '' });
      invalidar();
    },
    onError: () => message.error('No se pudo agregar el riesgo.'),
  });
  const eliminarRiesgoMutation = useMutation({ mutationFn: eliminarRiesgoPlan, onSuccess: invalidar });

  const crearOportunidadMutation = useMutation({
    mutationFn: crearOportunidadPlan,
    onSuccess: () => {
      setNuevaOportunidad({ nombre_oportunidad: '', medida_aprovechar: '', responsable: '', evidencia: '' });
      invalidar();
    },
    onError: () => message.error('No se pudo agregar la oportunidad.'),
  });
  const eliminarOportunidadMutation = useMutation({ mutationFn: eliminarOportunidadPlan, onSuccess: invalidar });

  const crearSesionMutation = useMutation({
    mutationFn: crearSesionAuditoria,
    onSuccess: () => {
      setNuevaSesion({ ciudad: '', fecha: null, hora_inicio: null, hora_fin: null, proceso: undefined, tema: '', procedimiento: '', requisitos_a_auditar: '', auditado: '', auditor: undefined });
      invalidar();
    },
    onError: () => message.error('No se pudo agregar la sesión.'),
  });
  const eliminarSesionMutation = useMutation({ mutationFn: eliminarSesionAuditoria, onSuccess: invalidar });

  const crearItemMutation = useMutation({
    mutationFn: crearItemVerificacion,
    onSuccess: () => {
      setNuevoItem({ sesion: undefined, etapa: undefined, descripcion_elemento: '', requisito_iso: '', otros_requisitos: '', tipo_hallazgo: undefined, descripcion_hallazgo: '' });
      invalidar();
    },
    onError: () => message.error('No se pudo agregar el item.'),
  });
  const eliminarItemMutation = useMutation({ mutationFn: eliminarItemVerificacion, onSuccess: invalidar });
  const generarHallazgoMutation = useMutation({
    mutationFn: generarHallazgoDesdeItem,
    onSuccess: (item) => {
      message.success(`Hallazgo ${item.hallazgo_generado_codigo} generado.`);
      invalidar();
    },
    onError: () => message.error('No se pudo generar el hallazgo — verifica que el tipo no sea Conformidad.'),
  });

  async function descargarXlsx() {
    if (!auditoria) return;
    try {
      await descargarInformeAuditoriaXlsx(auditoria.id, auditoria.codigo);
    } catch {
      message.error('No se pudo descargar el informe en Excel.');
    }
  }

  function agregarRiesgo() {
    if (!auditoriaId || !nuevoRiesgo.nombre_riesgo.trim()) {
      message.warning('Ingresa el nombre del riesgo.');
      return;
    }
    crearRiesgoMutation.mutate({ auditoria: auditoriaId, ...nuevoRiesgo });
  }

  function agregarOportunidad() {
    if (!auditoriaId || !nuevaOportunidad.nombre_oportunidad.trim()) {
      message.warning('Ingresa el nombre de la oportunidad.');
      return;
    }
    crearOportunidadMutation.mutate({ auditoria: auditoriaId, ...nuevaOportunidad });
  }

  function agregarSesion() {
    if (!auditoriaId) return;
    crearSesionMutation.mutate({
      auditoria: auditoriaId,
      ciudad: nuevaSesion.ciudad,
      fecha: nuevaSesion.fecha ? nuevaSesion.fecha.format('YYYY-MM-DD') : null,
      hora_inicio: nuevaSesion.hora_inicio ? nuevaSesion.hora_inicio.format('HH:mm:ss') : null,
      hora_fin: nuevaSesion.hora_fin ? nuevaSesion.hora_fin.format('HH:mm:ss') : null,
      proceso: nuevaSesion.proceso ?? null,
      tema: nuevaSesion.tema,
      procedimiento: nuevaSesion.procedimiento,
      requisitos_a_auditar: nuevaSesion.requisitos_a_auditar,
      auditado: nuevaSesion.auditado,
      auditor: nuevaSesion.auditor ?? null,
    });
  }

  function agregarItem() {
    if (!auditoriaId || !nuevoItem.descripcion_elemento.trim()) {
      message.warning('Ingresa la descripción del elemento a revisar.');
      return;
    }
    crearItemMutation.mutate({
      auditoria: auditoriaId,
      sesion: nuevoItem.sesion ?? null,
      etapa: (nuevoItem.etapa as ItemVerificacionAuditoria['etapa']) ?? '',
      descripcion_elemento: nuevoItem.descripcion_elemento,
      requisito_iso: nuevoItem.requisito_iso,
      otros_requisitos: nuevoItem.otros_requisitos,
      tipo_hallazgo: (nuevoItem.tipo_hallazgo as ItemVerificacionAuditoria['tipo_hallazgo']) ?? '',
      descripcion_hallazgo: nuevoItem.descripcion_hallazgo,
    });
  }

  const opcionesEmpleados = (empleadosData?.results ?? []).map((e) => ({
    value: e.id,
    label: e.cargo ? `${e.nombre_completo} (${e.cargo})` : e.nombre_completo,
  }));
  const opcionesProcesos = (procesosData?.results ?? []).map((p) => ({ value: p.id, label: p.nombre }));
  const soloLectura = auditoria?.estado === 'CERRADA' && !esAdministrador;
  const puedeEditar = hasPerm('auditorias.change_auditoria') && !soloLectura;

  const tabPlan = (
    <div>
      <Form form={form} layout="vertical" disabled={!puedeEditar} onFinish={(v) => guardarMutation.mutate(v)}>
        <Form.Item name="objetivo" label="Objetivo de la auditoría">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="alcance" label="Alcance">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="criterios" label="Criterios">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="metodologia" label="Metodología de la auditoría">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Space.Compact block style={{ marginBottom: 12 }}>
          <Form.Item name="auditor_lider" label="Auditor líder" style={{ flex: 1, marginRight: 8 }}>
            <Select allowClear showSearch optionFilterProp="label" options={opcionesEmpleados} />
          </Form.Item>
          <Form.Item name="equipo_auditor" label="Equipo auditor" style={{ flex: 1 }}>
            <Select mode="multiple" showSearch optionFilterProp="label" options={opcionesEmpleados} />
          </Form.Item>
        </Space.Compact>
        <Space.Compact block style={{ marginBottom: 12 }}>
          <Form.Item name="numero_auditados" label="N° de auditados" style={{ marginRight: 8 }}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="numero_auditores" label="N° de auditores" style={{ marginRight: 8 }}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="ciudad" label="Ciudad">
            <Input />
          </Form.Item>
        </Space.Compact>
        <Space.Compact block style={{ marginBottom: 12 }}>
          <Form.Item name="fecha_auditoria" label="Fecha de auditoría" style={{ marginRight: 8 }}>
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="fecha_elaboracion_informe" label="Fecha de elaboración del informe" style={{ marginRight: 8 }}>
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="aprobado_por" label="Aprueba (informe)">
            <Select allowClear showSearch optionFilterProp="label" options={opcionesEmpleados} style={{ minWidth: 220 }} />
          </Form.Item>
        </Space.Compact>
        <Form.Item name="conclusiones_generales" label="Conclusiones generales">
          <Input.TextArea rows={3} />
        </Form.Item>
        {puedeEditar && (
          <Button type="primary" htmlType="submit" loading={guardarMutation.isPending}>Guardar plan</Button>
        )}
      </Form>

      <TituloSeccion>Riesgos del plan de auditoría</TituloSeccion>
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={auditoria?.riesgos_plan ?? []}
        locale={{ emptyText: <Empty description="Sin riesgos registrados." image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        columns={[
          { title: 'Riesgo', dataIndex: 'nombre_riesgo', key: 'nombre_riesgo' },
          { title: 'Acción de control', dataIndex: 'accion_control', key: 'accion_control' },
          { title: 'Responsable', dataIndex: 'responsable', key: 'responsable', render: (v: string) => v || '—' },
          {
            title: '', key: 'acciones', width: 80,
            render: (_: unknown, r: { id: number }) =>
              puedeEditar && (
                <Popconfirm title="¿Eliminar?" onConfirm={() => eliminarRiesgoMutation.mutate(r.id)}>
                  <Button size="small" danger>Eliminar</Button>
                </Popconfirm>
              ),
          },
        ]}
      />
      {puedeEditar && (
        <Space wrap style={{ marginTop: 8, marginBottom: 20 }}>
          <Input placeholder="Nombre del riesgo" style={{ width: 200 }} value={nuevoRiesgo.nombre_riesgo} onChange={(e) => setNuevoRiesgo({ ...nuevoRiesgo, nombre_riesgo: e.target.value })} />
          <Input placeholder="Acción de control" style={{ width: 200 }} value={nuevoRiesgo.accion_control} onChange={(e) => setNuevoRiesgo({ ...nuevoRiesgo, accion_control: e.target.value })} />
          <Input placeholder="Responsable (rol o persona)" style={{ width: 180 }} value={nuevoRiesgo.responsable} onChange={(e) => setNuevoRiesgo({ ...nuevoRiesgo, responsable: e.target.value })} />
          <Button icon={<PlusOutlined />} loading={crearRiesgoMutation.isPending} onClick={agregarRiesgo}>Agregar</Button>
        </Space>
      )}

      <TituloSeccion>Oportunidades del plan de auditoría</TituloSeccion>
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={auditoria?.oportunidades_plan ?? []}
        locale={{ emptyText: <Empty description="Sin oportunidades registradas." image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        columns={[
          { title: 'Oportunidad', dataIndex: 'nombre_oportunidad', key: 'nombre_oportunidad' },
          { title: 'Medida para aprovechar', dataIndex: 'medida_aprovechar', key: 'medida_aprovechar' },
          { title: 'Responsable', dataIndex: 'responsable', key: 'responsable', render: (v: string) => v || '—' },
          {
            title: '', key: 'acciones', width: 80,
            render: (_: unknown, o: { id: number }) =>
              puedeEditar && (
                <Popconfirm title="¿Eliminar?" onConfirm={() => eliminarOportunidadMutation.mutate(o.id)}>
                  <Button size="small" danger>Eliminar</Button>
                </Popconfirm>
              ),
          },
        ]}
      />
      {puedeEditar && (
        <Space wrap style={{ marginTop: 8 }}>
          <Input placeholder="Nombre de la oportunidad" style={{ width: 200 }} value={nuevaOportunidad.nombre_oportunidad} onChange={(e) => setNuevaOportunidad({ ...nuevaOportunidad, nombre_oportunidad: e.target.value })} />
          <Input placeholder="Medida para aprovechar" style={{ width: 200 }} value={nuevaOportunidad.medida_aprovechar} onChange={(e) => setNuevaOportunidad({ ...nuevaOportunidad, medida_aprovechar: e.target.value })} />
          <Input placeholder="Responsable (rol o persona)" style={{ width: 180 }} value={nuevaOportunidad.responsable} onChange={(e) => setNuevaOportunidad({ ...nuevaOportunidad, responsable: e.target.value })} />
          <Button icon={<PlusOutlined />} loading={crearOportunidadMutation.isPending} onClick={agregarOportunidad}>Agregar</Button>
        </Space>
      )}
    </div>
  );

  const tabCronograma = (
    <div>
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={auditoria?.sesiones ?? []}
        locale={{ emptyText: <Empty description="Sin sesiones registradas." /> }}
        columns={[
          { title: 'Fecha', dataIndex: 'fecha', key: 'fecha', render: (v: string) => v || '—' },
          { title: 'Hora', key: 'hora', render: (_: unknown, s: SesionAuditoria) => `${s.hora_inicio ?? '—'} - ${s.hora_fin ?? '—'}` },
          {
            title: 'Proceso / Tema', key: 'proceso_tema',
            render: (_: unknown, s: SesionAuditoria) => s.proceso_nombre ?? s.tema ?? '—',
          },
          { title: 'Auditado', dataIndex: 'auditado', key: 'auditado', render: (v: string) => v || '—' },
          { title: 'Auditor', dataIndex: 'auditor_nombre', key: 'auditor_nombre', render: (v: string) => v || '—' },
          {
            title: '', key: 'acciones', width: 80,
            render: (_: unknown, s: SesionAuditoria) =>
              puedeEditar && (
                <Popconfirm title="¿Eliminar?" onConfirm={() => eliminarSesionMutation.mutate(s.id)}>
                  <Button size="small" danger>Eliminar</Button>
                </Popconfirm>
              ),
          },
        ]}
      />
      {puedeEditar && (
        <Space wrap style={{ marginTop: 12 }}>
          <Input placeholder="Ciudad" style={{ width: 120 }} value={nuevaSesion.ciudad} onChange={(e) => setNuevaSesion({ ...nuevaSesion, ciudad: e.target.value })} />
          <DatePicker placeholder="Fecha" value={nuevaSesion.fecha} onChange={(v) => setNuevaSesion({ ...nuevaSesion, fecha: v })} />
          <TimePicker placeholder="Hora inicio" format="HH:mm" value={nuevaSesion.hora_inicio} onChange={(v) => setNuevaSesion({ ...nuevaSesion, hora_inicio: v })} />
          <TimePicker placeholder="Hora fin" format="HH:mm" value={nuevaSesion.hora_fin} onChange={(v) => setNuevaSesion({ ...nuevaSesion, hora_fin: v })} />
          <Select placeholder="Proceso (si aplica)" allowClear showSearch optionFilterProp="label" style={{ width: 160 }} options={opcionesProcesos} value={nuevaSesion.proceso} onChange={(v) => setNuevaSesion({ ...nuevaSesion, proceso: v })} />
          <Input placeholder="Tema / dominio (si no es un proceso exacto)" style={{ width: 220 }} value={nuevaSesion.tema} onChange={(e) => setNuevaSesion({ ...nuevaSesion, tema: e.target.value })} />
          <Input placeholder="Auditado" style={{ width: 140 }} value={nuevaSesion.auditado} onChange={(e) => setNuevaSesion({ ...nuevaSesion, auditado: e.target.value })} />
          <Select placeholder="Auditor" allowClear showSearch optionFilterProp="label" style={{ width: 180 }} options={opcionesEmpleados} value={nuevaSesion.auditor} onChange={(v) => setNuevaSesion({ ...nuevaSesion, auditor: v })} />
          <Button icon={<PlusOutlined />} loading={crearSesionMutation.isPending} onClick={agregarSesion}>Agregar sesión</Button>
        </Space>
      )}
    </div>
  );

  const opcionesSesiones = (auditoria?.sesiones ?? []).map((s) => ({
    value: s.id,
    label: `${s.fecha ?? 'sin fecha'} — ${s.proceso_nombre ?? s.procedimiento ?? 'sin proceso'}`,
  }));

  const tabChecklist = (
    <div>
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={auditoria?.items_verificacion ?? []}
        locale={{ emptyText: <Empty description="Sin items registrados." /> }}
        columns={[
          { title: 'Etapa', dataIndex: 'etapa', key: 'etapa', width: 90, render: (e: string) => ETIQUETA_ETAPA[e] ?? '—' },
          { title: 'Elemento a revisar', dataIndex: 'descripcion_elemento', key: 'descripcion_elemento' },
          { title: 'Requisito ISO', dataIndex: 'requisito_iso', key: 'requisito_iso', width: 120, render: (v: string) => v || '—' },
          {
            title: 'Tipo de hallazgo', dataIndex: 'tipo_hallazgo', key: 'tipo_hallazgo', width: 170,
            render: (v: string) => (v ? <Tag color={COLOR_TIPO_HALLAZGO[v]}>{ETIQUETA_TIPO_HALLAZGO[v]}</Tag> : '—'),
          },
          {
            title: 'Hallazgo', key: 'hallazgo', width: 160,
            render: (_: unknown, item: ItemVerificacionAuditoria) =>
              item.hallazgo_generado_codigo ? (
                <Tag color="purple">{item.hallazgo_generado_codigo}</Tag>
              ) : (
                item.tipo_hallazgo && item.tipo_hallazgo !== 'CONFORMIDAD' && puedeEditar && (
                  <Button size="small" loading={generarHallazgoMutation.isPending} onClick={() => generarHallazgoMutation.mutate(item.id)}>
                    Generar hallazgo
                  </Button>
                )
              ),
          },
          {
            title: '', key: 'acciones', width: 80,
            render: (_: unknown, item: ItemVerificacionAuditoria) =>
              puedeEditar && (
                <Popconfirm title="¿Eliminar?" onConfirm={() => eliminarItemMutation.mutate(item.id)}>
                  <Button size="small" danger>Eliminar</Button>
                </Popconfirm>
              ),
          },
        ]}
        expandable={{
          rowExpandable: () => true,
          expandedRowRender: (item: ItemVerificacionAuditoria) => (
            <div>
              <Typography.Text type="secondary">Otros requisitos: {item.otros_requisitos || '—'}</Typography.Text>
              <br />
              <Typography.Text type="secondary">Descripción del hallazgo: {item.descripcion_hallazgo || '—'}</Typography.Text>
            </div>
          ),
        }}
      />
      {puedeEditar && (
        <Space direction="vertical" style={{ marginTop: 12, width: '100%' }}>
          <Space wrap>
            <Select placeholder="Sesión (opcional)" allowClear style={{ width: 220 }} options={opcionesSesiones} value={nuevoItem.sesion} onChange={(v) => setNuevoItem({ ...nuevoItem, sesion: v })} />
            <Select placeholder="Etapa" allowClear style={{ width: 130 }} options={Object.entries(ETIQUETA_ETAPA).map(([value, label]) => ({ value, label }))} value={nuevoItem.etapa} onChange={(v) => setNuevoItem({ ...nuevoItem, etapa: v })} />
            <Input placeholder="Requisito ISO" style={{ width: 140 }} value={nuevoItem.requisito_iso} onChange={(e) => setNuevoItem({ ...nuevoItem, requisito_iso: e.target.value })} />
            <Select placeholder="Tipo de hallazgo" allowClear style={{ width: 190 }} options={Object.entries(ETIQUETA_TIPO_HALLAZGO).map(([value, label]) => ({ value, label }))} value={nuevoItem.tipo_hallazgo} onChange={(v) => setNuevoItem({ ...nuevoItem, tipo_hallazgo: v })} />
          </Space>
          <Input.TextArea placeholder="Descripción del elemento a revisar" rows={2} value={nuevoItem.descripcion_elemento} onChange={(e) => setNuevoItem({ ...nuevoItem, descripcion_elemento: e.target.value })} />
          <Input.TextArea placeholder="Descripción del hallazgo (si aplica)" rows={2} value={nuevoItem.descripcion_hallazgo} onChange={(e) => setNuevoItem({ ...nuevoItem, descripcion_hallazgo: e.target.value })} />
          <Button icon={<PlusOutlined />} loading={crearItemMutation.isPending} onClick={agregarItem}>Agregar item</Button>
        </Space>
      )}
    </div>
  );

  return (
    <Drawer
      title={
        auditoria ? (
          <Space direction="vertical" size={0}>
            <span>Auditoría — {auditoria.codigo}</span>
            <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
              {auditoria.programa_descripcion ?? (auditoria.tipo === 'EXTRAORDINARIA' ? 'Extraordinaria — sin programa asociado' : 'Sin programa asociado')}
            </Typography.Text>
          </Space>
        ) : (
          'Auditoría'
        )
      }
      open={auditoriaId !== null}
      onClose={onClose}
      width="min(96vw, 1100px)"
      destroyOnHidden
      extra={
        auditoria && (
          <Space>
            <Tag color={COLOR_ESTADO[auditoria.estado]}>{ETIQUETA_ESTADO[auditoria.estado]}</Tag>
            {auditoria.estado === 'PLANIFICADA' && puedeEditar && (
              <Button size="small" onClick={() => cambiarEstadoMutation.mutate('EN_EJECUCION')}>Iniciar ejecución</Button>
            )}
            {auditoria.estado === 'EN_EJECUCION' && puedeEditar && (
              <Popconfirm title="¿Cerrar esta auditoría? Ya no se podrá editar salvo como administrador." okText="Cerrar" onConfirm={() => cambiarEstadoMutation.mutate('CERRADA')}>
                <Button size="small" type="primary" icon={<CheckOutlined />}>Cerrar auditoría</Button>
              </Popconfirm>
            )}
            {auditoria.estado === 'CERRADA' && esAdministrador && (
              <Button size="small" icon={<UnlockOutlined />} onClick={() => cambiarEstadoMutation.mutate('EN_EJECUCION')}>Reabrir</Button>
            )}
            {auditoria.estado === 'CERRADA' && (
              <Button size="small" icon={<DownloadOutlined />} onClick={descargarXlsx}>Excel</Button>
            )}
          </Space>
        )
      }
    >
      {isLoading && <Skeleton active paragraph={{ rows: 10 }} />}
      {auditoria && (
        <Tabs
          items={[
            { key: 'plan', label: 'Plan de auditoría', children: tabPlan },
            { key: 'cronograma', label: `Cronograma (${auditoria.sesiones.length})`, children: tabCronograma },
            { key: 'checklist', label: `Lista de verificación (${auditoria.items_verificacion.length})`, children: tabChecklist },
          ]}
        />
      )}
    </Drawer>
  );
}
