import { DeleteOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, DatePicker, Form, Input, Modal, Popconfirm, Select, TimePicker, Typography, Upload, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { fetchUsuarios } from '../../accounts/api';
import { descargarArchivo, nombreDeArchivo } from '../../../shared/api/descargarArchivo';
import {
  actualizarIncidente,
  crearIncidente,
  eliminarArchivoIncidente,
  subirArchivoIncidente,
} from '../api';
import { NOMBRE_TIPO_INCIDENTE } from '../tipoIncidente';
import type { ArchivoAdjuntoIncidente, Incidente, IncidenteInput } from '../types';

const OPCIONES_TIPO = Object.entries(NOMBRE_TIPO_INCIDENTE).map(([value, label]) => ({ value, label }));

type FormValues = Omit<IncidenteInput, 'fecha' | 'hora'> & {
  fecha: dayjs.Dayjs;
  hora: dayjs.Dayjs;
};

interface Props {
  open: boolean;
  incidente: Incidente | null;
  onClose: () => void;
}

export function IncidenteFormModal({ open, incidente, onClose }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([]);
  const [archivosExistentes, setArchivosExistentes] = useState<ArchivoAdjuntoIncidente[]>([]);
  const queryClient = useQueryClient();

  const { data: usuarios } = useQuery({ queryKey: ['usuarios'], queryFn: fetchUsuarios, enabled: open });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setArchivosNuevos([]);
    setArchivosExistentes(incidente?.archivos_adjuntos ?? []);
    if (incidente) {
      form.setFieldsValue({
        fecha: dayjs(incidente.fecha),
        hora: dayjs(incidente.hora, 'HH:mm:ss'),
        nombre_evento: incidente.nombre_evento,
        descripcion: incidente.descripcion,
        tipo: incidente.tipo,
        fuente: incidente.fuente,
        responsable: incidente.responsable,
        registrado_por: incidente.registrado_por,
      });
    } else {
      form.setFieldsValue({ fecha: dayjs(), hora: dayjs(), tipo: 'EVENTO' });
    }
  }, [open, incidente, form]);

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['incidentes'] });
  };

  const eliminarArchivoMutation = useMutation({
    mutationFn: eliminarArchivoIncidente,
    onSuccess: (_, archivoId) => {
      message.success('Archivo eliminado.');
      setArchivosExistentes((previos) => previos.filter((a) => a.id !== archivoId));
      invalidar();
    },
    onError: () => message.error('No se pudo eliminar el archivo.'),
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload: IncidenteInput = {
        ...values,
        fecha: values.fecha.format('YYYY-MM-DD'),
        hora: values.hora.format('HH:mm:ss'),
      };
      const guardado = incidente
        ? await actualizarIncidente(incidente.id, payload)
        : await crearIncidente(payload);
      for (const archivo of archivosNuevos) {
        await subirArchivoIncidente(guardado.id, archivo);
      }
      return guardado;
    },
    onSuccess: () => {
      message.success(incidente ? 'Registro actualizado.' : 'Registro creado.');
      invalidar();
      onClose();
    },
    onError: (err) =>
      message.error(
        extraerMensajeError(err) ?? 'No se pudo guardar el registro. Revisa los datos e intenta de nuevo.',
      ),
  });

  return (
    <Modal
      title={incidente ? `Editar ${incidente.codigo}` : 'Nuevo evento/incidente'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={680}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="fecha" label="Fecha" rules={[{ required: true, message: 'Selecciona la fecha' }]} style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="hora" label="Hora" rules={[{ required: true, message: 'Selecciona la hora' }]} style={{ flex: 1 }}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
          <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Select options={OPCIONES_TIPO} />
          </Form.Item>
        </div>
        <Form.Item
          name="nombre_evento"
          label="Nombre del evento o incidente"
          rules={[{ required: true, message: 'Ingresa el nombre del evento o incidente' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="descripcion" label="Descripción" rules={[{ required: true, message: 'Ingresa la descripción' }]}>
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item name="fuente" label="Fuente">
          <Input placeholder="Reporte de funcionarios, monitoreo, alerta automática..." />
        </Form.Item>
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item
            name="responsable"
            label="Responsable"
            rules={[{ required: true, message: 'Selecciona el responsable' }]}
            style={{ flex: 1 }}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={usuarios?.results.map((u) => ({ value: u.id, label: `${u.nombre_completo} (${u.email})` }))}
            />
          </Form.Item>
          <Form.Item
            name="registrado_por"
            label="Registrado por"
            rules={[{ required: true, message: 'Selecciona quién registra' }]}
            style={{ flex: 1 }}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={usuarios?.results.map((u) => ({ value: u.id, label: `${u.nombre_completo} (${u.email})` }))}
            />
          </Form.Item>
        </div>
        <Form.Item label="Soportes">
          {archivosExistentes.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 8 }}>
              {archivosExistentes.map((archivo) => (
                <li key={archivo.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <PaperClipOutlined />
                  <Typography.Link
                    style={{ flex: 1 }}
                    onClick={() =>
                      descargarArchivo(
                        `/archivos-adjuntos-incidente/${archivo.id}/descargar/`,
                        nombreDeArchivo(archivo.archivo),
                      )
                    }
                  >
                    {nombreDeArchivo(archivo.archivo)}
                  </Typography.Link>
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
      </Form>
    </Modal>
  );
}

// Convierte la respuesta de error de DRF en un mensaje legible en vez del genérico
// de siempre — mismo criterio que en el formulario de seguimiento de hallazgos.
function extraerMensajeError(err: unknown): string | null {
  const data = (err as { response?: { data?: unknown } }).response?.data;
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    for (const valor of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(valor) && typeof valor[0] === 'string') return valor[0];
      if (typeof valor === 'string') return valor;
    }
  }
  return null;
}
