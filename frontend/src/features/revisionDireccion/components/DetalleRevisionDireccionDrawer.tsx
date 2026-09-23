import { DownloadOutlined, LockOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  DatePicker,
  Divider,
  Drawer,
  Empty,
  Form,
  Input,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { BRAND } from '../../../shared/theme/brand';
import { fetchEmpleados } from '../../accounts/api';
import {
  actualizarCompromiso,
  actualizarRevisionDireccion,
  crearCompromiso,
  descargarActaDocx,
  eliminarCompromiso,
  fetchRevisionDireccion,
  finalizarRevisionDireccion,
} from '../api';
import type { CompromisoRevisionDireccion, RevisionDireccionInput } from '../types';

interface Props {
  revisionId: number | null;
  onClose: () => void;
}

const NOMBRE_ESTADO_COMPROMISO: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  COMPLETADO: 'Completado',
};
const COLOR_ESTADO_COMPROMISO: Record<string, string> = {
  PENDIENTE: 'default',
  EN_PROCESO: 'blue',
  COMPLETADO: 'green',
};

/** Caja gris con cifras reales de otro módulo, para apoyar la sección de texto que
 * viene justo debajo — así quien diligencia el acta no tiene que ir módulo por módulo
 * a buscar los datos que la cláusula 9.3.2 le pide resumir. */
function CajaResumen({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fafafa',
        border: '1px solid #e1e0d9',
        borderRadius: 6,
        padding: '8px 12px',
        marginBottom: 10,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
}

function TituloSeccion({ children }: { children: React.ReactNode }) {
  return (
    <Typography.Title level={5} style={{ color: BRAND.tealDark, marginTop: 18, marginBottom: 8 }}>
      {children}
    </Typography.Title>
  );
}

type FormValues = {
  periodo: string;
  fecha_revision: dayjs.Dayjs;
  preside: number;
  asistentes: number[];
  lugar_modalidad: string;
} & Omit<RevisionDireccionInput, 'periodo' | 'fecha_revision' | 'preside' | 'asistentes' | 'lugar_modalidad'>;

export function DetalleRevisionDireccionDrawer({ revisionId, onClose }: Props) {
  const { user, hasPerm } = useAuth();
  const esAdministrador = Boolean(user?.is_superuser);
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();
  const [nuevoCompromiso, setNuevoCompromiso] = useState<{
    descripcion: string;
    responsable: number | undefined;
    fecha_limite: dayjs.Dayjs | null;
  }>({ descripcion: '', responsable: undefined, fecha_limite: null });

  const { data: revision, isLoading } = useQuery({
    queryKey: ['revision-direccion', revisionId],
    queryFn: () => fetchRevisionDireccion(revisionId!),
    enabled: revisionId !== null,
  });
  const { data: empleados } = useQuery({ queryKey: ['empleados'], queryFn: fetchEmpleados, enabled: revisionId !== null });

  useEffect(() => {
    if (!revision) return;
    form.setFieldsValue({
      periodo: revision.periodo,
      fecha_revision: dayjs(revision.fecha_revision),
      preside: revision.preside,
      asistentes: revision.asistentes,
      lugar_modalidad: revision.lugar_modalidad,
      estado_acciones_previas: revision.estado_acciones_previas,
      cambios_cuestiones_externas_internas: revision.cambios_cuestiones_externas_internas,
      cambios_partes_interesadas: revision.cambios_partes_interesadas,
      desempeno_no_conformidades: revision.desempeno_no_conformidades,
      desempeno_seguimiento_medicion: revision.desempeno_seguimiento_medicion,
      desempeno_auditorias: revision.desempeno_auditorias,
      desempeno_objetivos: revision.desempeno_objetivos,
      retroalimentacion_partes_interesadas: revision.retroalimentacion_partes_interesadas,
      resultados_riesgos: revision.resultados_riesgos,
      oportunidades_mejora: revision.oportunidades_mejora,
      conclusiones_generales: revision.conclusiones_generales,
    });
  }, [revision, form]);

  const guardarMutation = useMutation({
    mutationFn: (values: FormValues) =>
      actualizarRevisionDireccion(revisionId!, { ...values, fecha_revision: values.fecha_revision.format('YYYY-MM-DD') }),
    onSuccess: () => {
      message.success('Acta guardada.');
      queryClient.invalidateQueries({ queryKey: ['revision-direccion', revisionId] });
      queryClient.invalidateQueries({ queryKey: ['revisiones-direccion'] });
    },
    onError: () => message.error('No se pudo guardar el acta.'),
  });

  const finalizarMutation = useMutation({
    mutationFn: (finalizada: boolean) => finalizarRevisionDireccion(revisionId!, finalizada),
    onSuccess: (_, finalizada) => {
      message.success(finalizada ? 'Acta finalizada.' : 'Acta reabierta.');
      queryClient.invalidateQueries({ queryKey: ['revision-direccion', revisionId] });
      queryClient.invalidateQueries({ queryKey: ['revisiones-direccion'] });
    },
    onError: () => message.error('No se pudo cambiar el estado del acta.'),
  });

  const crearCompromisoMutation = useMutation({
    mutationFn: crearCompromiso,
    onSuccess: () => {
      setNuevoCompromiso({ descripcion: '', responsable: undefined, fecha_limite: null });
      queryClient.invalidateQueries({ queryKey: ['revision-direccion', revisionId] });
    },
    onError: () => message.error('No se pudo agregar el compromiso.'),
  });

  const actualizarCompromisoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      actualizarCompromiso(id, { estado: estado as CompromisoRevisionDireccion['estado'] }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['revision-direccion', revisionId] }),
    onError: () => message.error('No se pudo actualizar el compromiso.'),
  });

  const eliminarCompromisoMutation = useMutation({
    mutationFn: eliminarCompromiso,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['revision-direccion', revisionId] }),
    onError: () => message.error('No se pudo eliminar el compromiso.'),
  });

  async function descargarDocx() {
    if (!revision) return;
    try {
      await descargarActaDocx(revision.id, revision.periodo);
    } catch {
      message.error('No se pudo descargar el documento del acta.');
    }
  }

  function agregarCompromiso() {
    if (!revisionId || !nuevoCompromiso.descripcion.trim() || !nuevoCompromiso.responsable) {
      message.warning('Ingresa la descripción y el responsable del compromiso.');
      return;
    }
    crearCompromisoMutation.mutate({
      revision: revisionId,
      descripcion: nuevoCompromiso.descripcion.trim(),
      responsable: nuevoCompromiso.responsable,
      fecha_limite: nuevoCompromiso.fecha_limite ? nuevoCompromiso.fecha_limite.format('YYYY-MM-DD') : null,
      estado: 'PENDIENTE',
    });
  }

  const opcionesEmpleados = empleados?.results.map((e) => ({
    value: e.id,
    label: e.cargo ? `${e.nombre_completo} (${e.cargo})` : e.nombre_completo,
  }));
  const soloLectura = Boolean(revision?.finalizada) && !esAdministrador;
  const puedeEditarActa = hasPerm('revisiones.change_revisiondireccion') && !soloLectura;
  const resumen = revision?.resumen_datos;

  const columnasCompromisos = [
    {
      title: 'Origen',
      key: 'origen',
      width: 130,
      render: (_: unknown, c: CompromisoRevisionDireccion) =>
        c.revision === revision?.id ? (
          <Tag color="blue">Esta revisión</Tag>
        ) : (
          <Tag>{c.revision_periodo}</Tag>
        ),
    },
    { title: 'Compromiso / decisión', dataIndex: 'descripcion', key: 'descripcion' },
    { title: 'Responsable', dataIndex: 'responsable_nombre', key: 'responsable_nombre', width: 180 },
    { title: 'Fecha límite', dataIndex: 'fecha_limite', key: 'fecha_limite', width: 120, render: (f: string | null) => f ?? '—' },
    {
      title: 'Estado',
      key: 'estado',
      width: 160,
      render: (_: unknown, c: CompromisoRevisionDireccion) => (
        <Space direction="vertical" size={2}>
          <Select
            size="small"
            style={{ width: 140 }}
            value={c.estado}
            options={Object.entries(NOMBRE_ESTADO_COMPROMISO).map(([value, label]) => ({ value, label }))}
            onChange={(estado) => actualizarCompromisoMutation.mutate({ id: c.id, estado })}
          />
          {c.esta_vencido && <Tag color="red" style={{ marginTop: 2 }}>Vencido</Tag>}
        </Space>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 90,
      render: (_: unknown, c: CompromisoRevisionDireccion) =>
        hasPerm('revisiones.delete_compromisorevisiondireccion') ? (
          <Popconfirm title="¿Eliminar este compromiso?" okText="Eliminar" okButtonProps={{ danger: true }} onConfirm={() => eliminarCompromisoMutation.mutate(c.id)}>
            <Button size="small" danger>Eliminar</Button>
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <Drawer
      title={revision ? `Revisión por la Dirección — ${revision.periodo}` : 'Revisión por la Dirección'}
      open={revisionId !== null}
      onClose={onClose}
      width="min(96vw, 1100px)"
      destroyOnHidden
    >
      {isLoading && <Skeleton active paragraph={{ rows: 10 }} />}
      {revision && resumen && (
        <>
          {soloLectura && (
            <Alert
              type="warning"
              showIcon
              icon={<LockOutlined />}
              style={{ marginBottom: 16 }}
              message="Esta acta ya fue finalizada y quedó de solo lectura. Solo un administrador puede modificarla."
            />
          )}

          <Form form={form} layout="vertical" disabled={!puedeEditarActa} onFinish={(v) => guardarMutation.mutate(v)}>
            <Space style={{ width: '100%' }} wrap size={12}>
              <Form.Item name="periodo" label="Periodo" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                <Input style={{ width: 140 }} />
              </Form.Item>
              <Form.Item name="fecha_revision" label="Fecha de revisión" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                <DatePicker format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item name="preside" label="Preside" rules={[{ required: true }]} style={{ marginBottom: 12, minWidth: 220 }}>
                <Select showSearch optionFilterProp="label" options={opcionesEmpleados} />
              </Form.Item>
              <Form.Item name="lugar_modalidad" label="Lugar / modalidad" style={{ marginBottom: 12, minWidth: 220 }}>
                <Input />
              </Form.Item>
            </Space>
            <Form.Item name="asistentes" label="Asistentes">
              <Select mode="multiple" showSearch optionFilterProp="label" options={opcionesEmpleados} />
            </Form.Item>

            <Divider />
            <Typography.Title level={4} style={{ color: BRAND.tealDark }}>
              Entradas de la revisión (ISO/IEC 27001:2022, cláusula 9.3.2)
            </Typography.Title>

            <TituloSeccion>a) Estado de las acciones de revisiones por la dirección previas</TituloSeccion>
            {resumen.revision_anterior_periodo ? (
              <CajaResumen>
                <Typography.Text strong style={{ width: '100%' }}>
                  Revisión anterior: {resumen.revision_anterior_periodo} ({resumen.revision_anterior_fecha})
                </Typography.Text>
                {resumen.revision_anterior_conclusiones ? (
                  <Typography.Paragraph
                    italic
                    type="secondary"
                    style={{ width: '100%', marginBottom: 0 }}
                    ellipsis={{ rows: 3, tooltip: { title: resumen.revision_anterior_conclusiones } }}
                  >
                    "{resumen.revision_anterior_conclusiones}"
                  </Typography.Paragraph>
                ) : (
                  <Typography.Text type="secondary" style={{ width: '100%' }}>
                    Esa revisión no dejó conclusiones generales registradas.
                  </Typography.Text>
                )}
                {resumen.compromisos_revision_anterior.length > 0 ? (
                  <>
                    <Typography.Text type="secondary" style={{ width: '100%' }}>
                      Compromisos que dejó:
                    </Typography.Text>
                    {resumen.compromisos_revision_anterior.map((c) => (
                      <Tag key={c.id} color={COLOR_ESTADO_COMPROMISO[c.estado]}>
                        {NOMBRE_ESTADO_COMPROMISO[c.estado] ?? c.estado}: {c.descripcion.slice(0, 40)}
                        {c.descripcion.length > 40 ? '…' : ''}
                      </Tag>
                    ))}
                  </>
                ) : (
                  <Typography.Text type="secondary" style={{ width: '100%' }}>
                    No dejó compromisos registrados.
                  </Typography.Text>
                )}
              </CajaResumen>
            ) : (
              <CajaResumen>
                <Typography.Text type="secondary">
                  No hay una revisión por la dirección anterior finalizada — esta es la primera.
                </Typography.Text>
              </CajaResumen>
            )}
            <Form.Item name="estado_acciones_previas" noStyle>
              <Input.TextArea rows={2} placeholder="Resume el estado de las acciones anteriores..." />
            </Form.Item>

            <TituloSeccion>b) Cambios en las cuestiones externas e internas</TituloSeccion>
            <Form.Item name="cambios_cuestiones_externas_internas" noStyle>
              <Input.TextArea rows={2} />
            </Form.Item>

            <TituloSeccion>c) Cambios en las necesidades y expectativas de las partes interesadas</TituloSeccion>
            <Form.Item name="cambios_partes_interesadas" noStyle>
              <Input.TextArea rows={2} />
            </Form.Item>

            <TituloSeccion>d.1) No conformidades y acciones correctivas</TituloSeccion>
            <CajaResumen>
              <Tag color="default">{resumen.hallazgos.total} hallazgos totales</Tag>
              <Tag color="red">{resumen.hallazgos.por_estado.ABIERTA} abiertos</Tag>
              <Tag color="blue">{resumen.hallazgos.por_estado.EN_PROCESO} en proceso</Tag>
              <Tag color="green">{resumen.hallazgos.por_estado.CERRADA} cerrados</Tag>
            </CajaResumen>
            <Form.Item name="desempeno_no_conformidades" noStyle>
              <Input.TextArea rows={2} />
            </Form.Item>

            <TituloSeccion>d.2) Resultados de seguimiento y medición (indicadores)</TituloSeccion>
            <CajaResumen>
              <Tag color="default">{resumen.indicadores.total} indicadores</Tag>
              <Tag color="blue">{resumen.indicadores.al_dia} al día</Tag>
              <Tag color="green">{resumen.indicadores.cumple} cumplen su meta</Tag>
            </CajaResumen>
            <Form.Item name="desempeno_seguimiento_medicion" noStyle>
              <Input.TextArea rows={2} />
            </Form.Item>

            <TituloSeccion>d.3) Resultados de auditoría</TituloSeccion>
            <CajaResumen>
              <Typography.Text type="secondary">
                Consulta el detalle en Hallazgos de auditoría y en Seguimiento Anexo A (checklists por categoría).
              </Typography.Text>
            </CajaResumen>
            <Form.Item name="desempeno_auditorias" noStyle>
              <Input.TextArea rows={2} />
            </Form.Item>

            <TituloSeccion>d.4) Cumplimiento de los objetivos de seguridad de la información</TituloSeccion>
            <CajaResumen>
              <Tag color="default">{resumen.objetivos.total} objetivos</Tag>
              <Tag color="green">{resumen.objetivos.actividades_por_estado.COMPLETADA} actividades completadas</Tag>
              <Tag color="blue">{resumen.objetivos.actividades_por_estado.PENDIENTE} pendientes</Tag>
              <Tag color="red">{resumen.objetivos.actividades_por_estado.VENCIDA} vencidas</Tag>
            </CajaResumen>
            <Form.Item name="desempeno_objetivos" noStyle>
              <Input.TextArea rows={2} />
            </Form.Item>

            <TituloSeccion>e) Retroalimentación de las partes interesadas</TituloSeccion>
            <Form.Item name="retroalimentacion_partes_interesadas" noStyle>
              <Input.TextArea rows={2} />
            </Form.Item>

            <TituloSeccion>f) Resultados de la valoración de riesgos y estado del plan de tratamiento</TituloSeccion>
            <CajaResumen>
              <Tag color="default">{resumen.riesgos.total} riesgos</Tag>
              <Tag color="red">{resumen.riesgos.por_nivel.CRITICO} críticos</Tag>
              <Tag color="orange">{resumen.riesgos.por_nivel.ALTO} altos</Tag>
              <Tag color="gold">{resumen.riesgos.por_nivel.MEDIO} medios</Tag>
              <Tag color="green">{resumen.riesgos.por_nivel.BAJO} bajos</Tag>
              <Tag color="blue">{resumen.riesgos.tratamientos_pendientes} tratamientos pendientes</Tag>
              {resumen.riesgos.tratamientos_vencidos > 0 && (
                <Tag color="red">{resumen.riesgos.tratamientos_vencidos} tratamientos vencidos</Tag>
              )}
              <Tag color="default">{resumen.incidentes.total} incidentes/eventos registrados</Tag>
            </CajaResumen>
            <Form.Item name="resultados_riesgos" noStyle>
              <Input.TextArea rows={2} />
            </Form.Item>

            <TituloSeccion>g) Oportunidades de mejora continua</TituloSeccion>
            <Form.Item name="oportunidades_mejora" noStyle>
              <Input.TextArea rows={2} />
            </Form.Item>

            <Divider />
            <Typography.Title level={4} style={{ color: BRAND.tealDark }}>
              Conclusiones generales
            </Typography.Title>
            <Form.Item name="conclusiones_generales" noStyle>
              <Input.TextArea rows={3} />
            </Form.Item>

            {puedeEditarActa && (
              <div style={{ marginTop: 16 }}>
                <Button onClick={() => form.submit()} loading={guardarMutation.isPending}>
                  Guardar cambios
                </Button>
              </div>
            )}
          </Form>

          <Divider />
          <Typography.Title level={4} style={{ color: BRAND.tealDark }}>
            Salidas — compromisos y decisiones (cláusula 9.3.3)
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            Incluye los compromisos de esta revisión y los que quedaron pendientes o en
            proceso de revisiones anteriores, para poder darles cierre desde aquí. Quedan
            como la entrada a) de la próxima revisión — su estado se puede seguir
            actualizando aunque esta acta ya esté finalizada.
          </Typography.Paragraph>
          <Table
            rowKey="id"
            size="small"
            columns={columnasCompromisos}
            dataSource={[...revision.compromisos, ...revision.compromisos_pendientes_anteriores]}
            pagination={false}
            locale={{ emptyText: <Empty description="Sin compromisos registrados todavía." /> }}
            style={{ marginBottom: 16 }}
          />
          {hasPerm('revisiones.add_compromisorevisiondireccion') && (
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <Input.TextArea
                rows={2}
                placeholder="Descripción del compromiso / decisión..."
                value={nuevoCompromiso.descripcion}
                onChange={(e) => setNuevoCompromiso((prev) => ({ ...prev, descripcion: e.target.value }))}
              />
              <Space wrap>
                <Select
                  placeholder="Responsable"
                  style={{ width: 220 }}
                  showSearch
                  optionFilterProp="label"
                  options={opcionesEmpleados}
                  value={nuevoCompromiso.responsable}
                  onChange={(responsable) => setNuevoCompromiso((prev) => ({ ...prev, responsable }))}
                />
                <DatePicker
                  placeholder="Fecha límite"
                  format="YYYY-MM-DD"
                  value={nuevoCompromiso.fecha_limite}
                  onChange={(fecha_limite) => setNuevoCompromiso((prev) => ({ ...prev, fecha_limite }))}
                />
                <Button icon={<PlusOutlined />} loading={crearCompromisoMutation.isPending} onClick={agregarCompromiso}>
                  Agregar compromiso
                </Button>
              </Space>
            </Space>
          )}

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {revision.finalizada && (
              <Button icon={<DownloadOutlined />} onClick={descargarDocx}>
                Descargar evidencia (Word)
              </Button>
            )}
            {hasPerm('revisiones.change_revisiondireccion') && (
              <>
                {!revision.finalizada && (
                  <Button type="primary" loading={finalizarMutation.isPending} onClick={() => finalizarMutation.mutate(true)}>
                    Finalizar acta
                  </Button>
                )}
                {revision.finalizada && esAdministrador && (
                  <Button loading={finalizarMutation.isPending} onClick={() => finalizarMutation.mutate(false)}>
                    Reabrir acta (administrador)
                  </Button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </Drawer>
  );
}
