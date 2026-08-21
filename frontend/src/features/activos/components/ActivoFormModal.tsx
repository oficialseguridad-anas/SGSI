import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Divider, Form, Input, Modal, Radio, Select, Space, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { crearDireccion, actualizarActivo, crearActivo, fetchDirecciones } from '../api';
import type { Activo, ActivoInput, NivelValoracion } from '../types';

const PUNTAJE_NIVEL: Record<NivelValoracion, number> = { BAJA: 1, MEDIA: 2, ALTA: 3 };

const COLOR_CRITICIDAD: Record<NivelValoracion, string> = { BAJA: 'green', MEDIA: 'gold', ALTA: 'red' };

const NOMBRE_CRITICIDAD: Record<NivelValoracion, string> = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' };

function calcularCriticidad(
  confidencialidad?: NivelValoracion,
  integridad?: NivelValoracion,
  disponibilidad?: NivelValoracion,
) {
  if (!confidencialidad || !integridad || !disponibilidad) return null;
  const puntaje = PUNTAJE_NIVEL[confidencialidad] + PUNTAJE_NIVEL[integridad] + PUNTAJE_NIVEL[disponibilidad];
  const criticidad: NivelValoracion = puntaje <= 3 ? 'BAJA' : puntaje <= 7 ? 'MEDIA' : 'ALTA';
  return { puntaje, criticidad };
}

const OPCIONES_TIPO_ACTIVO = [
  { value: 'PRIMARIO', label: 'Primario' },
  { value: 'SECUNDARIO', label: 'Secundario' },
];

const OPCIONES_CLASE = [
  { value: 'SISTEMAS_INFORMACION', label: 'Sistemas de Información' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'HARDWARE', label: 'Hardware' },
  { value: 'INFORMACION', label: 'Información' },
  { value: 'ESTRUCTURA_ORGANIZACION', label: 'Estructura de la organización' },
  { value: 'RED', label: 'Red' },
];

const OPCIONES_NATURALEZA = [
  { value: 'FISICO', label: 'Fisico' },
  { value: 'DIGITAL', label: 'Digital' },
  { value: 'SAAS', label: 'SaaS' },
  { value: 'IAAS', label: 'IaaS' },
  { value: 'PAAS', label: 'PaaS' },
];

const OPCIONES_ETIQUETADO = [
  { value: 'PUBLICO', label: 'Público' },
  { value: 'PRIVADO', label: 'Privado' },
  { value: 'CONFIDENCIAL', label: 'Confidencial' },
];

const OPCIONES_SI_NO = [
  { value: true, label: 'Sí' },
  { value: false, label: 'No' },
];

const OPCIONES_NIVEL = [
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
];

const OPCIONES_ESTADO = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento' },
  { value: 'RETIRADO', label: 'Retirado' },
];

interface Props {
  open: boolean;
  activo: Activo | null;
  onClose: () => void;
}

export function ActivoFormModal({ open, activo, onClose }: Props) {
  const [form] = Form.useForm<ActivoInput>();
  const queryClient = useQueryClient();
  const [nuevaDireccion, setNuevaDireccion] = useState('');

  const confidencialidad = Form.useWatch('valor_confidencialidad', form);
  const integridad = Form.useWatch('valor_integridad', form);
  const disponibilidad = Form.useWatch('valor_disponibilidad', form);
  const resultado = calcularCriticidad(confidencialidad, integridad, disponibilidad);
  const direccionSeleccionada = Form.useWatch('direccion', form);

  const { data: direcciones } = useQuery({
    queryKey: ['direcciones'],
    queryFn: () => fetchDirecciones(),
    enabled: open,
  });

  const procesoDeLaDireccion = direcciones?.results.find((d) => d.id === direccionSeleccionada)?.proceso_nombre;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (activo) {
      form.setFieldsValue({
        direccion: activo.direccion,
        nombre: activo.nombre,
        descripcion: activo.descripcion,
        tipo_activo: activo.tipo_activo,
        clase_activo: activo.clase_activo,
        naturaleza: activo.naturaleza,
        propietario: activo.propietario,
        custodio: activo.custodio,
        etiquetado: activo.etiquetado,
        contiene_datos_personales: activo.contiene_datos_personales,
        valor_confidencialidad: activo.valor_confidencialidad,
        valor_integridad: activo.valor_integridad,
        valor_disponibilidad: activo.valor_disponibilidad,
        estado: activo.estado,
        fecha_baja: activo.fecha_baja,
      });
    } else {
      form.setFieldsValue({
        tipo_activo: 'PRIMARIO',
        etiquetado: 'PRIVADO',
        contiene_datos_personales: false,
        valor_confidencialidad: 'MEDIA',
        valor_integridad: 'MEDIA',
        valor_disponibilidad: 'MEDIA',
        estado: 'ACTIVO',
      });
    }
  }, [open, activo, form]);

  const crearDireccionMutation = useMutation({
    mutationFn: crearDireccion,
    onSuccess: (nueva) => {
      queryClient.invalidateQueries({ queryKey: ['direcciones'] });
      form.setFieldValue('direccion', nueva.id);
      setNuevaDireccion('');
    },
    onError: () => message.error('No se pudo crear la dirección.'),
  });

  function agregarDireccion() {
    if (!nuevaDireccion.trim()) return;
    crearDireccionMutation.mutate({ proceso: null, nombre: nuevaDireccion.trim(), descripcion: '' });
  }

  const mutation = useMutation({
    mutationFn: (values: ActivoInput) => (activo ? actualizarActivo(activo.id, values) : crearActivo(values)),
    onSuccess: () => {
      message.success(activo ? 'Activo actualizado.' : 'Activo creado.');
      queryClient.invalidateQueries({ queryKey: ['activos'] });
      onClose();
    },
    onError: () => message.error('No se pudo guardar el activo. Revisa los datos e intenta de nuevo.'),
  });

  return (
    <Modal
      title={activo ? `Editar activo ${activo.codigo}` : 'Inventario Activos Form'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={680}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item name="direccion" label="Direccion" rules={[{ required: true, message: 'Selecciona una dirección' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={direcciones?.results.map((d) => ({ value: d.id, label: d.nombre }))}
            popupRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: '8px 0' }} />
                <Space style={{ padding: '0 8px 4px' }}>
                  <Input
                    placeholder="Nueva dirección"
                    value={nuevaDireccion}
                    onChange={(e) => setNuevaDireccion(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    loading={crearDireccionMutation.isPending}
                    onClick={agregarDireccion}
                  >
                    Agregar
                  </Button>
                </Space>
              </>
            )}
          />
        </Form.Item>
        {direccionSeleccionada && (
          <Typography.Text type="secondary" style={{ display: 'block', marginTop: -12, marginBottom: 16 }}>
            Proceso: {procesoDeLaDireccion ?? 'sin proceso asignado todavía'}
          </Typography.Text>
        )}
        <Form.Item name="nombre" label="Nombre del Activo de Información" rules={[{ required: true, message: 'Ingresa un nombre' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="descripcion" label="Descripción del activo de información">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="tipo_activo" label="Tipo de Activo" rules={[{ required: true }]}>
          <Radio.Group options={OPCIONES_TIPO_ACTIVO} optionType="button" buttonStyle="solid" />
        </Form.Item>
        <Form.Item name="clase_activo" label="Clase de Activo" rules={[{ required: true, message: 'Selecciona una clase' }]}>
          <Select options={OPCIONES_CLASE} />
        </Form.Item>
        <Form.Item name="naturaleza" label="Físico / Digital / Como servicio" rules={[{ required: true, message: 'Selecciona una opción' }]}>
          <Select showSearch optionFilterProp="label" options={OPCIONES_NATURALEZA} />
        </Form.Item>
        <Form.Item name="propietario" label="Propietario del activo" rules={[{ required: true, message: 'Ingresa un propietario' }]}>
          <Input placeholder="Ej. Jefe de tecnologia" />
        </Form.Item>
        <Form.Item name="custodio" label="Custodio del Activo de Información">
          <Input placeholder="Ej. Jefe de tecnologia" />
        </Form.Item>
        <Form.Item name="etiquetado" label="Etiquetado de la Información" rules={[{ required: true }]}>
          <Radio.Group options={OPCIONES_ETIQUETADO} optionType="button" buttonStyle="solid" />
        </Form.Item>
        <Form.Item
          name="contiene_datos_personales"
          label="¿El activo contiene datos personales (Ley 1581 de 2012)? LEY DATOS PERSONALES"
          rules={[{ required: true }]}
        >
          <Radio.Group options={OPCIONES_SI_NO} optionType="button" buttonStyle="solid" />
        </Form.Item>
        <div
          style={{
            background: '#f0f0f0',
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            padding: '8px 12px',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          <Typography.Text strong>VALORACIÓN DEL ACTIVO DE INFORMACIÓN</Typography.Text>
          <br />
          <Typography.Text type="secondary">(Determinar la criticidad del activo)</Typography.Text>
        </div>
        <Form.Item name="valor_confidencialidad" label="Confidencialidad" rules={[{ required: true }]}>
          <Radio.Group options={OPCIONES_NIVEL} optionType="button" buttonStyle="solid" />
        </Form.Item>
        <Form.Item name="valor_integridad" label="Integridad" rules={[{ required: true }]}>
          <Radio.Group options={OPCIONES_NIVEL} optionType="button" buttonStyle="solid" />
        </Form.Item>
        <Form.Item name="valor_disponibilidad" label="Disponibilidad" rules={[{ required: true }]}>
          <Radio.Group options={OPCIONES_NIVEL} optionType="button" buttonStyle="solid" />
        </Form.Item>
        {resultado && (
          <div style={{ marginBottom: 16 }}>
            <Typography.Text>
              Puntaje: <Typography.Text strong>{resultado.puntaje}</Typography.Text> (3-9) — Criticidad:{' '}
            </Typography.Text>
            <Tag color={COLOR_CRITICIDAD[resultado.criticidad]}>{NOMBRE_CRITICIDAD[resultado.criticidad]}</Tag>
          </div>
        )}
        <Form.Item name="estado" label="Estado" rules={[{ required: true }]}>
          <Select options={OPCIONES_ESTADO} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
