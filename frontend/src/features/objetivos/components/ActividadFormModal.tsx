import { DeleteOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, DatePicker, Form, Input, Modal, Popconfirm, Select, Tag, Typography, Upload, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import {
  actualizarActividad,
  crearActividad,
  eliminarArchivoActividad,
  subirArchivoActividad,
} from '../api';
import type { ActividadObjetivo, ActividadObjetivoInput, ArchivoAdjuntoActividad, Objetivo } from '../types';

const COLOR_ESTADO: Record<ActividadObjetivo['estado_ejecucion'], string> = {
  PENDIENTE: 'default',
  VENCIDA: 'red',
  COMPLETADA: 'green',
};

const NOMBRE_ESTADO: Record<ActividadObjetivo['estado_ejecucion'], string> = {
  PENDIENTE: 'Pendiente',
  VENCIDA: 'Vencida',
  COMPLETADA: 'Completada',
};

const OPCIONES_PERIODO = [
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
];

type FormValues = Omit<ActividadObjetivoInput, 'objetivo' | 'plazo'> & { plazo: dayjs.Dayjs | null };

interface Props {
  open: boolean;
  objetivo: Objetivo | null;
  actividad: ActividadObjetivo | null;
  onClose: () => void;
}

export function ActividadFormModal({ open, objetivo, actividad, onClose }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([]);
  const [archivosExistentes, setArchivosExistentes] = useState<ArchivoAdjuntoActividad[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setArchivosNuevos([]);
    setArchivosExistentes(actividad?.archivos_adjuntos ?? []);
    if (actividad) {
      form.setFieldsValue({
        actividad: actividad.actividad,
        responsables: actividad.responsables,
        recursos: actividad.recursos,
        periodo: actividad.periodo,
        plazo: actividad.plazo ? dayjs(actividad.plazo) : null,
      });
    }
  }, [open, actividad, form]);

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['actividades', objetivo?.id] });
    queryClient.invalidateQueries({ queryKey: ['objetivos'] });
  };

  const eliminarArchivoMutation = useMutation({
    mutationFn: eliminarArchivoActividad,
    onSuccess: (_, archivoId) => {
      message.success('Archivo eliminado.');
      setArchivosExistentes((previos) => previos.filter((a) => a.id !== archivoId));
      invalidar();
    },
    onError: () => message.error('No se pudo eliminar el archivo.'),
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!objetivo) throw new Error('Falta el objetivo');
      const payload: ActividadObjetivoInput = {
        ...values,
        objetivo: objetivo.id,
        plazo: values.plazo ? values.plazo.format('YYYY-MM-DD') : null,
      };
      const guardado = actividad
        ? await actualizarActividad(actividad.id, payload)
        : await crearActividad(payload);
      for (const archivo of archivosNuevos) {
        await subirArchivoActividad(guardado.id, archivo);
      }
      return guardado;
    },
    onSuccess: () => {
      message.success(actividad ? 'Actividad actualizada.' : 'Actividad creada.');
      invalidar();
      onClose();
    },
    onError: () => message.error('No se pudo guardar la actividad. Revisa los datos e intenta de nuevo.'),
  });

  return (
    <Modal
      title={actividad ? 'Editar actividad' : 'Nueva actividad'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={680}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item
          name="actividad"
          label="Actividad"
          rules={[{ required: true, message: 'Ingresa la actividad' }]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="responsables" label="Responsables">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="recursos" label="Recursos">
          <Input.TextArea rows={2} />
        </Form.Item>
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="periodo" label="Periodo" style={{ flex: 1 }}>
            <Select allowClear options={OPCIONES_PERIODO} />
          </Form.Item>
          <Form.Item name="plazo" label="Plazo" style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </div>
        <Form.Item label="Soportes">
          {archivosExistentes.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 8 }}>
              {archivosExistentes.map((archivo) => (
                <li key={archivo.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <PaperClipOutlined />
                  <a href={archivo.archivo} target="_blank" rel="noreferrer" style={{ flex: 1 }}>
                    {archivo.archivo.split('/').pop()}
                  </a>
                  <Popconfirm
                    title="¿Eliminar este archivo?"
                    okText="Eliminar"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => eliminarArchivoMutation.mutate(archivo.id)}
                  >
                    <Button size="small" danger type="text" icon={<DeleteOutlined />} />
                  </Popconfirm>
                </li>
              ))}
            </ul>
          )}
          <Upload
            multiple
            beforeUpload={(file) => {
              setArchivosNuevos((previos) => [...previos, file]);
              return false;
            }}
            onRemove={(file) => {
              setArchivosNuevos((previos) => previos.filter((a) => a.name !== file.name));
            }}
            fileList={archivosNuevos.map((a, i) => ({ uid: String(i), name: a.name, status: 'done' as const }))}
          >
            <Button icon={<UploadOutlined />}>Agregar archivos</Button>
          </Upload>
        </Form.Item>
        {actividad && (
          <Typography.Text type="secondary">
            Estado de ejecución (automático, según los soportes cargados):{' '}
            <Tag color={COLOR_ESTADO[actividad.estado_ejecucion]}>{NOMBRE_ESTADO[actividad.estado_ejecucion]}</Tag>
          </Typography.Text>
        )}
      </Form>
    </Modal>
  );
}
