import { CheckOutlined, DownloadOutlined, LeftOutlined, PlusOutlined, RightOutlined, UnlockOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DatePicker,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
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
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { BRAND } from '../../../shared/theme/brand';
import { fetchEmpleados } from '../../accounts/api';
import { fetchProcesos } from '../../activos/api';
import { fetchHallazgos } from '../../auditorias/api';
import { SeguimientoFormModal } from '../../auditorias/components/SeguimientoFormModal';
import { COLOR_ESTADO_HALLAZGO, NOMBRE_ESTADO_HALLAZGO, TEXTO_ESTADO_HALLAZGO } from '../../auditorias/estadoHallazgo';
import type { EstadoHallazgo, Hallazgo, SeguimientoHallazgo } from '../../auditorias/types';
import {
  actualizarAuditoria,
  actualizarItemVerificacion,
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
  vincularItemAHallazgo,
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
const COLOR_VERIFICACION: Record<SeguimientoHallazgo['verificacion_eficacia'], string> = {
  EFICAZ: 'green',
  PARCIALMENTE_EFICAZ: 'gold',
  INEFICAZ: 'red',
  NO_IMPLEMENTADO: 'default',
};
const NOMBRE_VERIFICACION: Record<SeguimientoHallazgo['verificacion_eficacia'], string> = {
  EFICAZ: 'Eficaz',
  PARCIALMENTE_EFICAZ: 'Parcialmente Eficaz',
  INEFICAZ: 'Ineficaz (No Cumple)',
  NO_IMPLEMENTADO: 'No Implementado',
};

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
  const [itemEditando, setItemEditando] = useState<ItemVerificacionAuditoria | null>(null);
  const [itemEditValores, setItemEditValores] = useState<{
    sesion: number | undefined; etapa: string | undefined; descripcion_elemento: string; requisito_iso: string;
    otros_requisitos: string; tipo_hallazgo: string | undefined; descripcion_hallazgo: string;
  }>({ sesion: undefined, etapa: undefined, descripcion_elemento: '', requisito_iso: '', otros_requisitos: '', tipo_hallazgo: undefined, descripcion_hallazgo: '' });
  const [itemParaAsignar, setItemParaAsignar] = useState<ItemVerificacionAuditoria | null>(null);
  const [hallazgoSeleccionado, setHallazgoSeleccionado] = useState<number | undefined>(undefined);
  const [itemsSeleccionadosParaHallazgo, setItemsSeleccionadosParaHallazgo] = useState<number[]>([]);
  const [seguimientoFormAbierto, setSeguimientoFormAbierto] = useState(false);
  const [seguimientoEditando, setSeguimientoEditando] = useState<SeguimientoHallazgo | null>(null);
  const [checklistTabActivo, setChecklistTabActivo] = useState<string | undefined>(undefined);
  const checklistScrollRef = useRef<HTMLDivElement>(null);

  const { data: auditoria, isLoading } = useQuery({
    queryKey: ['auditoria', auditoriaId],
    queryFn: () => fetchAuditoria(auditoriaId!),
    enabled: auditoriaId !== null,
  });
  const { data: hallazgosData } = useQuery({
    queryKey: ['hallazgos'],
    queryFn: fetchHallazgos,
    enabled: auditoriaId !== null,
  });
  const itemsChecklist = auditoria?.items_verificacion ?? [];
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
  const actualizarItemMutation = useMutation({
    mutationFn: () =>
      actualizarItemVerificacion(itemEditando!.id, {
        sesion: itemEditValores.sesion ?? null,
        etapa: (itemEditValores.etapa as ItemVerificacionAuditoria['etapa']) ?? '',
        descripcion_elemento: itemEditValores.descripcion_elemento,
        requisito_iso: itemEditValores.requisito_iso,
        otros_requisitos: itemEditValores.otros_requisitos,
        tipo_hallazgo: (itemEditValores.tipo_hallazgo as ItemVerificacionAuditoria['tipo_hallazgo']) ?? '',
        descripcion_hallazgo: itemEditValores.descripcion_hallazgo,
      }),
    onSuccess: () => {
      message.success('Item actualizado.');
      setItemEditando(null);
      invalidar();
    },
    onError: () => message.error('No se pudo actualizar el item.'),
  });
  const generarHallazgoMutation = useMutation({
    mutationFn: generarHallazgoDesdeItem,
    onSuccess: (item) => {
      message.success(`Hallazgo ${item.hallazgo_generado_codigo} generado.`);
      invalidar();
    },
    onError: () => message.error('No se pudo generar el hallazgo — verifica que el tipo no sea Conformidad.'),
  });
  const asignarHallazgoMutation = useMutation({
    mutationFn: async () => {
      const item = itemParaAsignar!;
      const promesas: Promise<unknown>[] = [];
      // El vínculo del propio item siempre se guarda explícitamente (según el
      // selector de arriba), sin depender del multi-select de "otros items".
      if (item.hallazgo_generado !== (hallazgoSeleccionado ?? null)) {
        promesas.push(vincularItemAHallazgo(item.id, hallazgoSeleccionado ?? null));
      }
      if (hallazgoSeleccionado) {
        const yaVinculados = itemsVinculadosA(hallazgoSeleccionado, item.id);
        const aVincular = itemsSeleccionadosParaHallazgo.filter((id) => !yaVinculados.includes(id));
        const aDesvincular = yaVinculados.filter((id) => !itemsSeleccionadosParaHallazgo.includes(id));
        promesas.push(...aVincular.map((id) => vincularItemAHallazgo(id, hallazgoSeleccionado)));
        promesas.push(...aDesvincular.map((id) => vincularItemAHallazgo(id, null)));
      }
      await Promise.all(promesas);
    },
    onSuccess: () => {
      message.success('Relación con el hallazgo actualizada.');
      setItemParaAsignar(null);
      invalidar();
      queryClient.invalidateQueries({ queryKey: ['hallazgos'] });
    },
    onError: () => message.error('No se pudo actualizar la relación.'),
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

  function abrirEditarItem(item: ItemVerificacionAuditoria) {
    setItemEditando(item);
    setItemEditValores({
      sesion: item.sesion ?? undefined,
      etapa: item.etapa || undefined,
      descripcion_elemento: item.descripcion_elemento,
      requisito_iso: item.requisito_iso,
      otros_requisitos: item.otros_requisitos,
      tipo_hallazgo: item.tipo_hallazgo || undefined,
      descripcion_hallazgo: item.descripcion_hallazgo,
    });
  }

  // Excluye siempre el item que se está asignando/editando: su propia relación la
  // maneja el selector de arriba (hallazgoSeleccionado), no el multi-select de "otros
  // items" — así no puede desvincularse a sí mismo por accidente al tildar/destildar
  // en una lista larga (bug real detectado: un item que sí tenía hallazgo terminó sin
  // él porque el multi-select lo incluía como una opción más, indistinguible del
  // resto).
  function itemsVinculadosA(hallazgoId: number, excluirId: number) {
    return itemsChecklist.filter((it) => it.hallazgo_generado === hallazgoId && it.id !== excluirId).map((it) => it.id);
  }

  function abrirAsignarExistente(item: ItemVerificacionAuditoria) {
    setItemParaAsignar(item);
    const hallazgoActual = item.hallazgo_generado ?? undefined;
    setHallazgoSeleccionado(hallazgoActual);
    setItemsSeleccionadosParaHallazgo(hallazgoActual ? itemsVinculadosA(hallazgoActual, item.id) : []);
  }

  function cambiarHallazgoSeleccionado(valor: number | undefined) {
    setHallazgoSeleccionado(valor);
    if (!valor || !itemParaAsignar) {
      setItemsSeleccionadosParaHallazgo([]);
      return;
    }
    setItemsSeleccionadosParaHallazgo(itemsVinculadosA(valor, itemParaAsignar.id));
  }

  function abrirGestionSeguimiento(seguimiento: SeguimientoHallazgo | null) {
    setSeguimientoEditando(seguimiento);
    setSeguimientoFormAbierto(true);
  }

  const hallazgoAsignado = hallazgosData?.results.find((h) => h.id === hallazgoSeleccionado);

  // Antes de elegir nada en el selector: si otras filas del MISMO elemento a revisar
  // (mismo etapa + descripcion_elemento — las que quedan fusionadas visualmente en la
  // tabla) ya están relacionadas con algún hallazgo, se sugieren aquí para reutilizar
  // con un clic, en vez de tener que buscarlo de nuevo.
  const idsHallazgosSugeridos = itemParaAsignar
    ? Array.from(new Set(
        itemsChecklist
          .filter((it) =>
            it.id !== itemParaAsignar.id
            && it.etapa === itemParaAsignar.etapa
            && it.descripcion_elemento === itemParaAsignar.descripcion_elemento
            && it.hallazgo_generado !== null,
          )
          .map((it) => it.hallazgo_generado as number),
      ))
    : [];
  const hallazgosSugeridos = idsHallazgosSugeridos
    .map((id) => hallazgosData?.results.find((h) => h.id === id))
    .filter((h): h is Hallazgo => h !== undefined && h.id !== hallazgoSeleccionado);

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

  // Agrupa por sesión, en el mismo orden en que aparecen los items (ordenados por
  // id = orden original de las filas del Excel) — así los grupos quedan en el mismo
  // orden de las hojas del archivo real, sin necesidad de mapear nombres a mano. Los
  // items sin sesión (la hoja "Sedes", que cubre dos visitas a la vez) quedan en su
  // propio grupo, en la posición donde realmente aparecían en el Excel.
  const gruposChecklist: { clave: string; titulo: string; items: ItemVerificacionAuditoria[] }[] = [];
  const indicePorClave = new Map<string, number>();
  for (const item of itemsChecklist) {
    const clave = item.sesion !== null ? String(item.sesion) : 'sin-sesion';
    if (!indicePorClave.has(clave)) {
      const sesionInfo = item.sesion !== null ? auditoria?.sesiones.find((s) => s.id === item.sesion) : undefined;
      const titulo = sesionInfo ? (sesionInfo.tema || sesionInfo.proceso_nombre || `Sesión ${sesionInfo.id}`) : 'Sedes (sin sesión asociada)';
      indicePorClave.set(clave, gruposChecklist.length);
      gruposChecklist.push({ clave, titulo, items: [] });
    }
    gruposChecklist[indicePorClave.get(clave)!].items.push(item);
  }

  function columnasChecklist(items: ItemVerificacionAuditoria[]) {
    // Filas consecutivas con la misma etapa + elemento a revisar se fusionan
    // visualmente en una sola celda (rowSpan), igual que en el Excel real (celdas
    // combinadas D:H).
    const rowSpans: number[] = new Array(items.length).fill(1);
    for (let inicio = 0, i = 1; i <= items.length; i++) {
      const mismoGrupo = i < items.length
        && items[i].etapa === items[inicio].etapa
        && items[i].descripcion_elemento === items[inicio].descripcion_elemento;
      if (!mismoGrupo) {
        rowSpans[inicio] = i - inicio;
        for (let j = inicio + 1; j < i; j++) rowSpans[j] = 0;
        inicio = i;
      }
    }
    return [
      {
        title: 'Etapa', dataIndex: 'etapa', key: 'etapa', width: 90,
        render: (e: string, _item: ItemVerificacionAuditoria, index: number) => ({
          children: ETIQUETA_ETAPA[e] ?? '—',
          props: { rowSpan: rowSpans[index] },
        }),
      },
      {
        title: 'Elemento a revisar', dataIndex: 'descripcion_elemento', key: 'descripcion_elemento',
        render: (texto: string, _item: ItemVerificacionAuditoria, index: number) => ({
          children: texto || '—',
          props: { rowSpan: rowSpans[index] },
        }),
      },
      { title: 'Requisito ISO', dataIndex: 'requisito_iso', key: 'requisito_iso', width: 120, render: (v: string) => v || '—' },
      {
        title: 'Tipo de hallazgo', dataIndex: 'tipo_hallazgo', key: 'tipo_hallazgo', width: 170,
        render: (v: string) => (v ? <Tag color={COLOR_TIPO_HALLAZGO[v]}>{ETIQUETA_TIPO_HALLAZGO[v]}</Tag> : '—'),
      },
      {
        title: 'Descripción del hallazgo', dataIndex: 'descripcion_hallazgo', key: 'descripcion_hallazgo', width: 260,
        render: (v: string) => v || '—',
      },
      {
        title: 'Hallazgo', key: 'hallazgo', width: 190,
        render: (_: unknown, item: ItemVerificacionAuditoria) => {
          // Una Fortaleza o Conformidad no es una no conformidad ni requiere
          // subsanación, así que no tiene sentido generarle ni asignarle un hallazgo
          // (mismo criterio ya aplicado en RelacionarChecklistModal y en el
          // multi-select de "Items relacionados" de este mismo modal).
          const aplicaHallazgo = item.tipo_hallazgo === 'NO_CONFORMIDAD' || item.tipo_hallazgo === 'OPORTUNIDAD_MEJORA';
          return (
            <Space direction="vertical" size={4}>
              {item.hallazgo_generado_codigo && <Tag color="purple">{item.hallazgo_generado_codigo}</Tag>}
              {puedeEditar && aplicaHallazgo && (
                <Space size={4} wrap>
                  {!item.hallazgo_generado_codigo && (
                    <Button size="small" loading={generarHallazgoMutation.isPending} onClick={() => generarHallazgoMutation.mutate(item.id)}>
                      Generar hallazgo
                    </Button>
                  )}
                  <Button size="small" onClick={() => abrirAsignarExistente(item)}>
                    {item.hallazgo_generado_codigo ? 'Editar hallazgo' : 'Asignar existente'}
                  </Button>
                </Space>
              )}
            </Space>
          );
        },
      },
      {
        title: '', key: 'acciones', width: 150,
        render: (_: unknown, item: ItemVerificacionAuditoria) =>
          puedeEditar && (
            <Space size={4}>
              <Button size="small" onClick={() => abrirEditarItem(item)}>Editar</Button>
              <Popconfirm title="¿Eliminar?" onConfirm={() => eliminarItemMutation.mutate(item.id)}>
                <Button size="small" danger>Eliminar</Button>
              </Popconfirm>
            </Space>
          ),
      },
    ];
  }

  const claveChecklistActiva = checklistTabActivo ?? gruposChecklist[0]?.clave;
  const grupoChecklistActivo = gruposChecklist.find((g) => g.clave === claveChecklistActiva);

  function desplazarTabsChecklist(delta: number) {
    checklistScrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }

  const tabChecklist = (
    <div>
      {gruposChecklist.length === 0 ? (
        <Empty description="Sin items registrados." />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: '1px solid #f0f0f0', marginBottom: 12 }}>
            <Button type="text" size="small" icon={<LeftOutlined />} onClick={() => desplazarTabsChecklist(-240)} style={{ flexShrink: 0 }} />
            <div ref={checklistScrollRef} style={{ display: 'flex', overflowX: 'auto', scrollBehavior: 'smooth', flex: 1 }}>
              {gruposChecklist.map((grupo) => {
                const activo = grupo.clave === claveChecklistActiva;
                return (
                  <button
                    key={grupo.clave}
                    type="button"
                    onClick={() => setChecklistTabActivo(grupo.clave)}
                    style={{
                      flexShrink: 0,
                      padding: '8px 14px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: activo ? BRAND.tealDark : '#1a1a1a',
                      fontWeight: activo ? 600 : 400,
                      borderBottom: activo ? `2px solid ${BRAND.tealDark}` : '2px solid transparent',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {grupo.titulo} ({grupo.items.length})
                  </button>
                );
              })}
            </div>
            <Button type="text" size="small" icon={<RightOutlined />} onClick={() => desplazarTabsChecklist(240)} style={{ flexShrink: 0 }} />
          </div>
          {grupoChecklistActivo && (
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={grupoChecklistActivo.items}
              columns={columnasChecklist(grupoChecklistActivo.items)}
            />
          )}
        </>
      )}
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
    <>
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
    <Modal
      title="Editar item de la lista de verificación"
      open={itemEditando !== null}
      onCancel={() => setItemEditando(null)}
      onOk={() => actualizarItemMutation.mutate()}
      confirmLoading={actualizarItemMutation.isPending}
      destroyOnHidden
      width={640}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space wrap>
          <Select placeholder="Sesión (opcional)" allowClear style={{ width: 220 }} options={opcionesSesiones} value={itemEditValores.sesion} onChange={(v) => setItemEditValores({ ...itemEditValores, sesion: v })} />
          <Select placeholder="Etapa" allowClear style={{ width: 130 }} options={Object.entries(ETIQUETA_ETAPA).map(([value, label]) => ({ value, label }))} value={itemEditValores.etapa} onChange={(v) => setItemEditValores({ ...itemEditValores, etapa: v })} />
          <Input placeholder="Requisito ISO" style={{ width: 140 }} value={itemEditValores.requisito_iso} onChange={(e) => setItemEditValores({ ...itemEditValores, requisito_iso: e.target.value })} />
          <Select placeholder="Tipo de hallazgo" allowClear style={{ width: 190 }} options={Object.entries(ETIQUETA_TIPO_HALLAZGO).map(([value, label]) => ({ value, label }))} value={itemEditValores.tipo_hallazgo} onChange={(v) => setItemEditValores({ ...itemEditValores, tipo_hallazgo: v })} />
        </Space>
        <Input.TextArea placeholder="Descripción del elemento a revisar" rows={2} value={itemEditValores.descripcion_elemento} onChange={(e) => setItemEditValores({ ...itemEditValores, descripcion_elemento: e.target.value })} />
        <Input.TextArea placeholder="Otros requisitos" rows={2} value={itemEditValores.otros_requisitos} onChange={(e) => setItemEditValores({ ...itemEditValores, otros_requisitos: e.target.value })} />
        <Input.TextArea placeholder="Descripción del hallazgo (si aplica)" rows={2} value={itemEditValores.descripcion_hallazgo} onChange={(e) => setItemEditValores({ ...itemEditValores, descripcion_hallazgo: e.target.value })} />
      </Space>
    </Modal>
    <Modal
      title={itemParaAsignar
        ? `${itemParaAsignar.hallazgo_generado_codigo ? 'Editar hallazgo' : 'Asignar hallazgo'} — ${itemParaAsignar.descripcion_elemento || 'item de la lista de verificación'}`
        : 'Asignar hallazgo'}
      open={itemParaAsignar !== null}
      onCancel={() => setItemParaAsignar(null)}
      onOk={() => asignarHallazgoMutation.mutate()}
      confirmLoading={asignarHallazgoMutation.isPending}
      destroyOnHidden
      width={560}
    >
      <Typography.Paragraph type="secondary">
        Selecciona un hallazgo ya existente para relacionarlo con este item (o déjalo vacío para quitar la relación
        actual). Se muestra también el tratamiento (seguimiento) que ya tenga registrado cada hallazgo, para
        identificarlo más fácil.
      </Typography.Paragraph>
      {hallazgosSugeridos.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Typography.Text strong style={{ fontSize: 13 }}>
            Hallazgos ya relacionados con "{itemParaAsignar?.descripcion_elemento}"
          </Typography.Text>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 2, marginBottom: 8 }}>
            Otras filas de este mismo elemento ya están relacionadas con estos hallazgos — puedes reutilizar uno si
            aplica.
          </Typography.Paragraph>
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            {hallazgosSugeridos.map((h) => (
              <div
                key={h.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: 8, border: '1px solid #f0f0f0', borderRadius: 6 }}
              >
                <div>
                  <Space size={6}>
                    <Tag
                      color={COLOR_ESTADO_HALLAZGO[h.estado]}
                      style={{ color: TEXTO_ESTADO_HALLAZGO[h.estado], borderColor: 'transparent' }}
                    >
                      {NOMBRE_ESTADO_HALLAZGO[h.estado]}
                    </Tag>
                    <Typography.Text strong>{h.codigo}</Typography.Text>
                  </Space>
                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{h.descripcion}</Typography.Text>
                  </div>
                </div>
                <Button size="small" onClick={() => cambiarHallazgoSeleccionado(h.id)}>Usar este</Button>
              </div>
            ))}
          </Space>
        </div>
      )}
      <Select
        allowClear
        showSearch
        style={{ width: '100%' }}
        placeholder="Buscar hallazgo por código, descripción o tratamiento..."
        value={hallazgoSeleccionado}
        onChange={cambiarHallazgoSeleccionado}
        filterOption={(input, option) =>
          `${option?.label ?? ''} ${option?.tratamiento ?? ''}`.toLowerCase().includes(input.toLowerCase())
        }
        optionRender={(option) => (
          <div>
            <Space size={6} wrap>
              <Tag
                color={COLOR_ESTADO_HALLAZGO[option.data.estado as EstadoHallazgo]}
                style={{ color: TEXTO_ESTADO_HALLAZGO[option.data.estado as EstadoHallazgo], borderColor: 'transparent' }}
              >
                {NOMBRE_ESTADO_HALLAZGO[option.data.estado as EstadoHallazgo]}
              </Tag>
              <Typography.Text strong>{option.data.codigo}</Typography.Text>
              <Typography.Text>{option.data.descripcion}</Typography.Text>
            </Space>
            {option.data.tratamiento && (
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Tratamiento: {option.data.tratamiento}
                </Typography.Text>
              </div>
            )}
          </div>
        )}
        options={(hallazgosData?.results ?? []).map((h: Hallazgo) => ({
          value: h.id,
          label: `${h.codigo} — ${h.descripcion}`,
          codigo: h.codigo,
          descripcion: h.descripcion,
          estado: h.estado,
          tratamiento: h.seguimientos.map((s) => s.accion_correctiva).filter(Boolean).join(' | '),
        }))}
      />
      {hallazgoAsignado && (
        <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 6 }}>
          <Space size={6} wrap>
            <Tag
              color={COLOR_ESTADO_HALLAZGO[hallazgoAsignado.estado]}
              style={{ color: TEXTO_ESTADO_HALLAZGO[hallazgoAsignado.estado], borderColor: 'transparent' }}
            >
              {NOMBRE_ESTADO_HALLAZGO[hallazgoAsignado.estado]}
            </Tag>
            <Typography.Text strong>{hallazgoAsignado.codigo}</Typography.Text>
          </Space>
          <Typography.Paragraph style={{ marginTop: 4, marginBottom: 12 }}>
            {hallazgoAsignado.descripcion}
          </Typography.Paragraph>

          <Typography.Text strong style={{ fontSize: 13 }}>Tratamiento (seguimiento)</Typography.Text>
          {hallazgoAsignado.seguimientos.length === 0 ? (
            <Typography.Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
              Sin seguimiento registrado todavía.
            </Typography.Paragraph>
          ) : (
            <Space direction="vertical" size={8} style={{ width: '100%', marginTop: 8 }}>
              {hallazgoAsignado.seguimientos.map((s) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <Typography.Text style={{ fontSize: 13 }}>{s.accion_correctiva || 'Sin acción correctiva registrada'}</Typography.Text>
                    <br />
                    <Tag color={COLOR_VERIFICACION[s.verificacion_eficacia]} style={{ fontSize: 11 }}>
                      {NOMBRE_VERIFICACION[s.verificacion_eficacia]}
                    </Tag>
                  </div>
                  <Button size="small" onClick={() => abrirGestionSeguimiento(s)}>Editar</Button>
                </div>
              ))}
            </Space>
          )}
          <Button size="small" style={{ marginTop: 8 }} onClick={() => abrirGestionSeguimiento(null)}>
            + Agregar seguimiento
          </Button>

          <Typography.Text strong style={{ fontSize: 13, display: 'block', marginTop: 16 }}>
            Otros items del checklist relacionados con este hallazgo
          </Typography.Text>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 2, marginBottom: 6 }}>
            El item actual ({itemParaAsignar?.descripcion_elemento || 'este item'}) se guarda con el selector de
            arriba. Aquí solo se gestionan los DEMÁS items (de cualquier sesión) — marca o desmarca para agregar o
            quitar su relación con este mismo hallazgo.
          </Typography.Paragraph>
          <Select
            mode="multiple"
            showSearch
            style={{ width: '100%' }}
            optionFilterProp="label"
            value={itemsSeleccionadosParaHallazgo}
            onChange={setItemsSeleccionadosParaHallazgo}
            options={itemsChecklist
              .filter((it) => it.id !== itemParaAsignar?.id)
              .filter((it) => it.tipo_hallazgo !== 'FORTALEZA' && it.tipo_hallazgo !== 'CONFORMIDAD')
              .filter((it) => !it.hallazgo_generado || it.hallazgo_generado === hallazgoSeleccionado)
              .map((it) => {
                const sesionNombre = it.sesion !== null
                  ? auditoria?.sesiones.find((s) => s.id === it.sesion)?.tema
                  : undefined;
                return {
                  value: it.id,
                  label: `${it.descripcion_elemento || 'Sin elemento'}${it.requisito_iso ? ` (${it.requisito_iso})` : ''}${sesionNombre ? ` — ${sesionNombre}` : ''}`,
                };
              })}
          />
        </div>
      )}
    </Modal>
    <SeguimientoFormModal
      open={seguimientoFormAbierto}
      hallazgo={hallazgoAsignado ?? null}
      seguimiento={seguimientoEditando}
      onClose={() => setSeguimientoFormAbierto(false)}
    />
    </>
  );
}
