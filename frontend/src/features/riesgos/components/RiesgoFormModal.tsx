import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Divider, Form, Input, Modal, Radio, Select, Space, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { fetchUsuarios } from '../../accounts/api';
import { fetchActivos } from '../../activos/api';
import { fetchControlesCatalogo } from '../../controles/api';
import { crearAmenaza, crearRiesgo, fetchAmenazas, actualizarRiesgo } from '../api';
import { descripcionDe, ESCALA_IMPACTO, ESCALA_PROBABILIDAD, opcionesEscala } from '../escalasRiesgo';
import { calcularNivelDeRiesgo, COLOR_NIVEL_RIESGO, NOMBRE_NIVEL_RIESGO, TEXTO_NIVEL_RIESGO } from '../nivelRiesgo';
import { MapaCalorRiesgosModal } from './MapaCalorRiesgosModal';
import type { Riesgo, RiesgoInput } from '../types';

const OPCIONES_SI_NO = [
  { value: true, label: 'Sí' },
  { value: false, label: 'No' },
];

interface Props {
  open: boolean;
  riesgo: Riesgo | null;
  onClose: () => void;
}

export function RiesgoFormModal({ open, riesgo, onClose }: Props) {
  const [form] = Form.useForm<RiesgoInput>();
  const queryClient = useQueryClient();
  const [nuevaAmenaza, setNuevaAmenaza] = useState('');
  const [mapaCalorAbierto, setMapaCalorAbierto] = useState(false);

  const { data: activos } = useQuery({ queryKey: ['activos'], queryFn: fetchActivos, enabled: open });
  const { data: amenazas } = useQuery({ queryKey: ['amenazas'], queryFn: fetchAmenazas, enabled: open });
  const { data: usuarios } = useQuery({ queryKey: ['usuarios'], queryFn: fetchUsuarios, enabled: open });
  const { data: controles } = useQuery({
    queryKey: ['controles-catalogo'],
    queryFn: fetchControlesCatalogo,
    enabled: open,
  });

  const probabilidad = Form.useWatch('probabilidad', form);
  const impacto = Form.useWatch('impacto', form);
  const riesgoInherente = probabilidad && impacto ? probabilidad * impacto : null;
  const nivelDeRiesgo = probabilidad && impacto ? calcularNivelDeRiesgo(probabilidad, impacto) : null;
  const descripcionProbabilidad = descripcionDe(ESCALA_PROBABILIDAD, probabilidad);
  const descripcionImpacto = descripcionDe(ESCALA_IMPACTO, impacto);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (riesgo) {
      form.setFieldsValue({
        codigo: riesgo.codigo,
        activos: riesgo.activos,
        amenaza: riesgo.amenaza,
        descripcion: riesgo.descripcion,
        probabilidad: riesgo.probabilidad,
        impacto: riesgo.impacto,
        propietarios_riesgo: riesgo.propietarios_riesgo,
        controles: riesgo.controles,
        esta_activo: riesgo.esta_activo,
      });
    } else {
      form.setFieldsValue({
        probabilidad: 3,
        impacto: 10,
        propietarios_riesgo: [],
        controles: [],
        esta_activo: true,
      });
    }
  }, [open, riesgo, form]);

  const crearAmenazaMutation = useMutation({
    mutationFn: crearAmenaza,
    onSuccess: (nueva) => {
      queryClient.invalidateQueries({ queryKey: ['amenazas'] });
      form.setFieldValue('amenaza', nueva.id);
      setNuevaAmenaza('');
    },
    onError: () => message.error('No se pudo crear la amenaza.'),
  });

  const mutation = useMutation({
    mutationFn: (values: RiesgoInput) => (riesgo ? actualizarRiesgo(riesgo.id, values) : crearRiesgo(values)),
    onSuccess: () => {
      message.success(riesgo ? 'Riesgo actualizado.' : 'Riesgo creado.');
      queryClient.invalidateQueries({ queryKey: ['riesgos'] });
      onClose();
    },
    onError: () => message.error('No se pudo guardar el riesgo. Revisa los datos e intenta de nuevo.'),
  });

  return (
    <Modal
      title={riesgo ? `Editar riesgo ${riesgo.codigo}` : 'Nuevo riesgo'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={680}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item name="codigo" label="Código" rules={[{ required: true, message: 'Ingresa un código' }]}>
          <Input placeholder="R-001" />
        </Form.Item>
        <Form.Item
          name="activos"
          label="Activos afectados"
          rules={[{ required: true, message: 'Selecciona al menos un activo' }]}
        >
          <Select
            mode="multiple"
            showSearch
            optionFilterProp="label"
            options={activos?.results.map((a) => ({ value: a.id, label: `${a.codigo} - ${a.nombre}` }))}
          />
        </Form.Item>
        <Form.Item name="amenaza" label="Amenaza" rules={[{ required: true, message: 'Selecciona una amenaza' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={amenazas?.results.map((a) => ({ value: a.id, label: a.nombre }))}
            popupRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: '8px 0' }} />
                <Space style={{ padding: '0 8px 4px' }}>
                  <Input
                    placeholder="Nueva amenaza"
                    value={nuevaAmenaza}
                    onChange={(e) => setNuevaAmenaza(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    loading={crearAmenazaMutation.isPending}
                    onClick={() =>
                      nuevaAmenaza.trim() &&
                      crearAmenazaMutation.mutate({ nombre: nuevaAmenaza.trim(), descripcion: '', origen: 'TECNICA' })
                    }
                  >
                    Agregar
                  </Button>
                </Space>
              </>
            )}
          />
        </Form.Item>
        <Form.Item name="descripcion" label="Justificación">
          <Input.TextArea rows={2} />
        </Form.Item>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Form.Item name="probabilidad" label="Probabilidad" rules={[{ required: true, message: 'Selecciona la probabilidad' }]}>
              <Select options={opcionesEscala(ESCALA_PROBABILIDAD)} />
            </Form.Item>
            {descripcionProbabilidad && (
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: -12, marginBottom: 16, fontSize: 12 }}>
                {descripcionProbabilidad}
              </Typography.Text>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item name="impacto" label="Impacto" rules={[{ required: true, message: 'Selecciona el impacto' }]}>
              <Select options={opcionesEscala(ESCALA_IMPACTO)} />
            </Form.Item>
            {descripcionImpacto && (
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: -12, marginBottom: 16, fontSize: 12 }}>
                {descripcionImpacto}
              </Typography.Text>
            )}
          </div>
        </div>
        {riesgoInherente !== null && nivelDeRiesgo && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f0f2f5',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              padding: '8px 12px',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <Typography.Text>
              Riesgo inherente (probabilidad × impacto): <Typography.Text strong>{riesgoInherente}</Typography.Text>
            </Typography.Text>
            <Typography.Text>
              Nivel de riesgo:{' '}
              <Tag
                color={COLOR_NIVEL_RIESGO[nivelDeRiesgo]}
                style={{ color: TEXTO_NIVEL_RIESGO[nivelDeRiesgo], borderColor: 'transparent' }}
              >
                {NOMBRE_NIVEL_RIESGO[nivelDeRiesgo]}
              </Tag>
            </Typography.Text>
            <Button size="small" type="link" onClick={() => setMapaCalorAbierto(true)}>
              Ver mapa de calor de referencia
            </Button>
          </div>
        )}
        <Form.Item
          name="propietarios_riesgo"
          label="Propietarios del riesgo"
          rules={[{ required: true, message: 'Selecciona al menos un propietario' }]}
        >
          <Select
            mode="multiple"
            showSearch
            optionFilterProp="label"
            options={usuarios?.results.map((u) => ({ value: u.id, label: `${u.nombre_completo} (${u.email})` }))}
          />
        </Form.Item>
        <Form.Item name="controles" label="Controles asociados">
          <Select
            mode="multiple"
            showSearch
            optionFilterProp="label"
            options={controles?.results.map((c) => ({ value: c.id, label: `${c.codigo} - ${c.nombre}` }))}
          />
        </Form.Item>
        <Form.Item name="esta_activo" label="¿Riesgo activo?" rules={[{ required: true }]}>
          <Radio.Group options={OPCIONES_SI_NO} optionType="button" buttonStyle="solid" />
        </Form.Item>
      </Form>
      <MapaCalorRiesgosModal open={mapaCalorAbierto} onClose={() => setMapaCalorAbierto(false)} />
    </Modal>
  );
}
