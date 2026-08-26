import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Input, Modal, Select, message } from 'antd';
import { useEffect } from 'react';
import { actualizarIndicador, crearIndicador } from '../api';
import type { FrecuenciaIndicador, Indicador, IndicadorInput, TipoIndicador } from '../types';

const OPCIONES_TIPO = [
  { value: 'EFICACIA', label: 'Eficacia' },
  { value: 'CULTURA_RESULTADO', label: 'Cultura / Resultado' },
  { value: 'PREVENTIVO_OPERATIVO', label: 'Preventivo / Operativo' },
  { value: 'CONTINUIDAD_OPERATIVO', label: 'Continuidad / Operativo' },
];

const OPCIONES_FRECUENCIA = [
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
];

interface Props {
  open: boolean;
  indicador: Indicador | null;
  onClose: () => void;
}

export function IndicadorFormModal({ open, indicador, onClose }: Props) {
  const [form] = Form.useForm<IndicadorInput>();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (indicador) {
      form.setFieldsValue({
        codigo: indicador.codigo,
        tipo: indicador.tipo,
        nombre: indicador.nombre,
        objetivo: indicador.objetivo,
        unidad_medida: indicador.unidad_medida,
        descripcion: indicador.descripcion,
        formula: indicador.formula,
        frecuencia: indicador.frecuencia,
        responsable_medicion: indicador.responsable_medicion,
        correo_propietario: indicador.correo_propietario,
        meta: indicador.meta,
        fuente_datos: indicador.fuente_datos,
        responsable_analisis: indicador.responsable_analisis,
        analisis: indicador.analisis,
        accion: indicador.accion,
      });
    } else {
      form.setFieldsValue({ tipo: 'EFICACIA', frecuencia: 'ANUAL' });
    }
  }, [open, indicador, form]);

  const mutation = useMutation({
    mutationFn: (values: IndicadorInput) =>
      indicador ? actualizarIndicador(indicador.id, values) : crearIndicador(values),
    onSuccess: () => {
      message.success(indicador ? 'Indicador actualizado.' : 'Indicador creado.');
      queryClient.invalidateQueries({ queryKey: ['indicadores'] });
      onClose();
    },
    onError: () => message.error('No se pudo guardar el indicador. Revisa los datos e intenta de nuevo.'),
  });

  return (
    <Modal
      title={indicador ? `Editar indicador ${indicador.codigo}` : 'Nuevo indicador'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={720}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item
            name="codigo"
            label="ID Indicador"
            style={{ width: 140 }}
            rules={[{ required: true, message: 'Ingresa un ID' }]}
          >
            <Input placeholder="A1" />
          </Form.Item>
          <Form.Item name="tipo" label="Tipo de indicador" style={{ flex: 1 }} rules={[{ required: true }]}>
            <Select options={OPCIONES_TIPO as { value: TipoIndicador; label: string }[]} />
          </Form.Item>
          <Form.Item name="frecuencia" label="Frecuencia" style={{ width: 150 }} rules={[{ required: true }]}>
            <Select options={OPCIONES_FRECUENCIA as { value: FrecuenciaIndicador; label: string }[]} />
          </Form.Item>
        </div>
        <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: 'Ingresa un nombre' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="objetivo" label="Objetivo">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="descripcion" label="Descripción">
          <Input.TextArea rows={2} />
        </Form.Item>
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="unidad_medida" label="Unidad de medida del indicador" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item name="meta" label="Meta" style={{ width: 150 }}>
            <Input placeholder="=90%" />
          </Form.Item>
        </div>
        <Form.Item name="formula" label="Fórmula">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="fuente_datos" label="Fuente de datos">
          <Input.TextArea rows={2} />
        </Form.Item>
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="responsable_medicion" label="Responsable de la medición" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item name="correo_propietario" label="Correo propietario" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </div>
        <Form.Item name="responsable_analisis" label="Responsable del análisis">
          <Input />
        </Form.Item>
        <Form.Item name="analisis" label="Análisis">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="accion" label="Acción">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
