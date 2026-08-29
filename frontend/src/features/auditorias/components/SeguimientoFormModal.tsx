import { DeleteOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, DatePicker, Form, Input, Modal, Popconfirm, Select, Tag, Typography, Upload, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { fetchUsuarios } from '../../accounts/api';
import { descargarArchivo, nombreDeArchivo } from '../../../shared/api/descargarArchivo';
import {
  actualizarSeguimiento,
  crearSeguimiento,
  eliminarArchivoSeguimiento,
  subirArchivoSeguimiento,
} from '../api';
import type {
  ArchivoAdjuntoSeguimiento,
  Hallazgo,
  SeguimientoHallazgo,
  SeguimientoHallazgoInput,
} from '../types';

const OPCIONES_VERIFICACION = [
  { value: 'EFICAZ', label: 'Eficaz' },
  { value: 'PARCIALMENTE_EFICAZ', label: 'Parcialmente Eficaz' },
  { value: 'INEFICAZ', label: 'Ineficaz (No Cumple)' },
  { value: 'NO_IMPLEMENTADO', label: 'No Implementado' },
];

const COLOR_VERIFICACION: Record<SeguimientoHallazgo['verificacion_eficacia'], string> = {
  EFICAZ: 'green',
  PARCIALMENTE_EFICAZ: 'gold',
  INEFICAZ: 'red',
  NO_IMPLEMENTADO: 'default',
};

type FormValues = Omit<SeguimientoHallazgoInput, 'hallazgo' | 'fecha_compromiso' | 'fecha_seguimiento'> & {
  fecha_compromiso: dayjs.Dayjs | null;
  fecha_seguimiento: dayjs.Dayjs | null;
};

interface Props {
  open: boolean;
  hallazgo: Hallazgo | null;
  seguimiento: SeguimientoHallazgo | null;
  onClose: () => void;
}

export function SeguimientoFormModal({ open, hallazgo, seguimiento, onClose }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([]);
  const [archivosExistentes, setArchivosExistentes] = useState<ArchivoAdjuntoSeguimiento[]>([]);
  const queryClient = useQueryClient();

  const { data: usuarios } = useQuery({ queryKey: ['usuarios'], queryFn: fetchUsuarios, enabled: open });

  // La verificación de eficacia solo tiene sentido si hay al menos una evidencia de
  // cierre que la respalde: sin evidencias, el campo queda bloqueado en "No
  // Implementado" (tanto las ya subidas como las que el usuario acaba de adjuntar en
  // este mismo formulario, aunque todavía no se hayan enviado al servidor).
  const tieneEvidencias = archivosExistentes.length > 0 || archivosNuevos.length > 0;

  useEffect(() => {
    if (!tieneEvidencias) {
      form.setFieldValue('verificacion_eficacia', 'NO_IMPLEMENTADO');
    }
  }, [tieneEvidencias, form]);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setArchivosNuevos([]);
    setArchivosExistentes(seguimiento?.archivos_adjuntos ?? []);
    if (seguimiento) {
      form.setFieldsValue({
        accion_correctiva: seguimiento.accion_correctiva,
        fecha_compromiso: seguimiento.fecha_compromiso ? dayjs(seguimiento.fecha_compromiso) : null,
        responsables: seguimiento.responsables,
        fecha_seguimiento: seguimiento.fecha_seguimiento ? dayjs(seguimiento.fecha_seguimiento) : null,
        avance_notas: seguimiento.avance_notas,
        verificacion_eficacia: seguimiento.verificacion_eficacia,
      });
    } else {
      form.setFieldsValue({
        accion_correctiva: '',
        fecha_compromiso: null,
        responsables: [],
        fecha_seguimiento: null,
        avance_notas: '',
        verificacion_eficacia: 'NO_IMPLEMENTADO',
      });
    }
  }, [open, seguimiento, form]);

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['seguimientos', hallazgo?.id] });
    queryClient.invalidateQueries({ queryKey: ['hallazgos'] });
  };

  const eliminarArchivoMutation = useMutation({
    mutationFn: eliminarArchivoSeguimiento,
    onSuccess: (_, archivoId) => {
      message.success('Archivo eliminado.');
      setArchivosExistentes((previos) => previos.filter((a) => a.id !== archivoId));
      invalidar();
    },
    onError: () => message.error('No se pudo eliminar el archivo.'),
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!hallazgo) throw new Error('Falta el hallazgo');
      const payload: SeguimientoHallazgoInput = {
        ...values,
        hallazgo: hallazgo.id,
        fecha_compromiso: values.fecha_compromiso ? values.fecha_compromiso.format('YYYY-MM-DD') : null,
        fecha_seguimiento: values.fecha_seguimiento ? values.fecha_seguimiento.format('YYYY-MM-DD') : null,
      };
      const guardado = seguimiento
        ? await actualizarSeguimiento(seguimiento.id, payload)
        : await crearSeguimiento(payload);
      for (const archivo of archivosNuevos) {
        await subirArchivoSeguimiento(guardado.id, archivo);
      }
      return guardado;
    },
    onSuccess: () => {
      message.success(seguimiento ? 'Seguimiento actualizado.' : 'Seguimiento creado.');
      invalidar();
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
      width={680}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item name="accion_correctiva" label="Acción correctiva">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="fecha_compromiso" label="Fecha compromiso">
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item name="responsables" label="Responsables">
          <Select
            mode="multiple"
            showSearch
            optionFilterProp="label"
            options={usuarios?.results.map((u) => ({ value: u.id, label: `${u.nombre_completo} (${u.email})` }))}
          />
        </Form.Item>
        <Form.Item name="fecha_seguimiento" label="Fecha de seguimiento">
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item name="avance_notas" label="Avance / Notas">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item label="Evidencias de cierre">
          {archivosExistentes.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 8 }}>
              {archivosExistentes.map((archivo) => (
                <li key={archivo.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <PaperClipOutlined />
                  <Typography.Link
                    style={{ flex: 1 }}
                    onClick={() =>
                      descargarArchivo(
                        `/archivos-adjuntos-seguimiento/${archivo.id}/descargar/`,
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
        <Form.Item name="verificacion_eficacia" label="Verificación de eficacia" rules={[{ required: true }]}>
          <Select options={OPCIONES_VERIFICACION} disabled={!tieneEvidencias} />
        </Form.Item>
        {!tieneEvidencias && (
          <Typography.Text type="secondary" style={{ display: 'block', marginTop: -12, marginBottom: 16 }}>
            Adjunta al menos una evidencia de cierre para poder cambiar la verificación de eficacia.
          </Typography.Text>
        )}
        {seguimiento && (
          <Typography.Text type="secondary">
            Verificación actual:{' '}
            <Tag color={COLOR_VERIFICACION[seguimiento.verificacion_eficacia]}>
              {OPCIONES_VERIFICACION.find((o) => o.value === seguimiento.verificacion_eficacia)?.label}
            </Tag>
          </Typography.Text>
        )}
      </Form>
    </Modal>
  );
}
