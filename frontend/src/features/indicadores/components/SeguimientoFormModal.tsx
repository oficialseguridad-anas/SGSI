import { UploadOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Tag, Typography, Upload, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { actualizarSeguimiento, crearSeguimiento } from '../api';
import {
  calcularEstadoCumplimiento,
  calcularResultadoRatio,
  COLOR_CUMPLIMIENTO,
  NOMBRE_CUMPLIMIENTO,
  parsearFormulaRatio,
} from '../formula';
import { construirPeriodo, etiquetaSubperiodo, opcionesSubperiodo, parsearPeriodo } from '../periodos';
import type { Indicador, SeguimientoIndicador, SeguimientoIndicadorInput } from '../types';

interface FormValues {
  anio: number;
  subperiodo: string | null;
  fecha_cargue: dayjs.Dayjs | null;
  numerador: number | null;
  denominador: number | null;
  resultado: number | null;
  observaciones: string;
}

interface Props {
  open: boolean;
  indicador: Indicador | null;
  seguimiento: SeguimientoIndicador | null;
  onClose: () => void;
}

export function SeguimientoFormModal({ open, indicador, seguimiento, onClose }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [archivo, setArchivo] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const frecuencia = indicador?.frecuencia ?? 'ANUAL';
  const esAnual = frecuencia === 'ANUAL';
  const formulaRatio = indicador ? parsearFormulaRatio(indicador.formula) : null;

  const numerador = Form.useWatch('numerador', form);
  const denominador = Form.useWatch('denominador', form);
  const resultadoManual = Form.useWatch('resultado', form);
  const resultadoCalculado = formulaRatio ? calcularResultadoRatio(numerador ?? null, denominador ?? null) : resultadoManual;
  const estadoCumplimiento =
    resultadoCalculado !== null && resultadoCalculado !== undefined && indicador
      ? calcularEstadoCumplimiento(resultadoCalculado, indicador.meta)
      : null;

  useEffect(() => {
    if (!open || !indicador) return;
    form.resetFields();
    setArchivo(null);
    const anioActual = dayjs().year();
    if (seguimiento) {
      const { anio, subperiodo } = parsearPeriodo(frecuencia, seguimiento.periodo, anioActual);
      form.setFieldsValue({
        anio,
        subperiodo,
        fecha_cargue: seguimiento.fecha_cargue ? dayjs(seguimiento.fecha_cargue) : null,
        numerador: seguimiento.numerador,
        denominador: seguimiento.denominador,
        resultado: seguimiento.resultado,
        observaciones: seguimiento.observaciones,
      });
    } else {
      const opciones = opcionesSubperiodo(frecuencia);
      form.setFieldsValue({
        anio: anioActual,
        subperiodo: opciones[0]?.value ?? null,
        fecha_cargue: dayjs(),
      });
    }
  }, [open, indicador, seguimiento, form, frecuencia]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!indicador) throw new Error('Falta el indicador');
      const resultado = formulaRatio
        ? calcularResultadoRatio(values.numerador ?? null, values.denominador ?? null)
        : values.resultado ?? null;
      const payload: SeguimientoIndicadorInput = {
        indicador: indicador.id,
        periodo: construirPeriodo(frecuencia, values.anio, values.subperiodo),
        fecha_cargue: values.fecha_cargue ? values.fecha_cargue.format('YYYY-MM-DD') : null,
        numerador: formulaRatio ? values.numerador ?? null : null,
        denominador: formulaRatio ? values.denominador ?? null : null,
        resultado,
        observaciones: values.observaciones ?? '',
        archivo_soporte: archivo,
      };
      return seguimiento ? actualizarSeguimiento(seguimiento.id, payload) : crearSeguimiento(payload);
    },
    onSuccess: () => {
      message.success(seguimiento ? 'Seguimiento actualizado.' : 'Seguimiento creado.');
      queryClient.invalidateQueries({ queryKey: ['seguimientos-indicador', indicador?.id] });
      queryClient.invalidateQueries({ queryKey: ['indicadores'] });
      onClose();
    },
    onError: () => message.error('No se pudo guardar el seguimiento. Revisa los datos e intenta de nuevo.'),
  });

  return (
    <Modal
      title={seguimiento ? 'Editar seguimiento' : 'Nuevo seguimiento'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={560}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item
            name="anio"
            label="Año"
            style={{ width: esAnual ? '100%' : 140 }}
            rules={[{ required: true, message: 'Ingresa el año' }]}
          >
            <InputNumber style={{ width: '100%' }} min={2000} max={2100} />
          </Form.Item>
          {!esAnual && (
            <Form.Item
              name="subperiodo"
              label={etiquetaSubperiodo(frecuencia)}
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Selecciona el periodo' }]}
            >
              <Select options={opcionesSubperiodo(frecuencia)} />
            </Form.Item>
          )}
        </div>
        <Form.Item
          name="fecha_cargue"
          label="Fecha de cargue"
          rules={[{ required: true, message: 'Selecciona la fecha de cargue' }]}
        >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
        {indicador && (
          <Typography.Paragraph
            type="secondary"
            style={{ background: '#f5f5f5', padding: '8px 12px', borderRadius: 4, marginBottom: 16 }}
          >
            <Typography.Text strong>Fórmula: </Typography.Text>
            {indicador.formula || 'No definida.'}
            <br />
            <Typography.Text strong>Meta: </Typography.Text>
            {indicador.meta || 'No definida.'}
          </Typography.Paragraph>
        )}

        {formulaRatio ? (
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="numerador" label={formulaRatio.etiquetaNumerador} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="Ej. 45" />
            </Form.Item>
            <Form.Item name="denominador" label={formulaRatio.etiquetaDenominador} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="Ej. 50" min={0} />
            </Form.Item>
          </div>
        ) : (
          <Form.Item
            name="resultado"
            label={`Resultado${indicador?.unidad_medida ? ` (${indicador.unidad_medida})` : ''}`}
          >
            <InputNumber style={{ width: '100%' }} placeholder="Ej. 85" />
          </Form.Item>
        )}

        {resultadoCalculado !== null && resultadoCalculado !== undefined && (
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
              Resultado: <Typography.Text strong>{resultadoCalculado}</Typography.Text>
            </Typography.Text>
            {estadoCumplimiento && (
              <Tag color={COLOR_CUMPLIMIENTO[estadoCumplimiento]}>{NOMBRE_CUMPLIMIENTO[estadoCumplimiento]}</Tag>
            )}
          </div>
        )}

        <Form.Item name="observaciones" label="Observaciones">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item label="Archivo soporte">
          <Upload
            beforeUpload={(file) => {
              setArchivo(file);
              return false;
            }}
            onRemove={() => setArchivo(null)}
            maxCount={1}
            fileList={archivo ? [{ uid: '1', name: archivo.name, status: 'done' }] : []}
          >
            <Button icon={<UploadOutlined />}>
              {seguimiento?.archivo_soporte ? 'Reemplazar archivo' : 'Subir archivo'}
            </Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
