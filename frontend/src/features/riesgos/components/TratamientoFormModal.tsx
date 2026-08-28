import { DeleteOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, DatePicker, Form, Input, Modal, Popconfirm, Select, Tag, Typography, Upload, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { fetchUsuarios } from '../../accounts/api';
import { descargarArchivo, nombreDeArchivo } from '../../../shared/api/descargarArchivo';
import {
  actualizarTratamiento,
  crearTratamiento,
  eliminarArchivoTratamiento,
  subirArchivoTratamiento,
} from '../api';
import { ESCALA_IMPACTO, ESCALA_PROBABILIDAD, opcionesEscala } from '../escalasRiesgo';
import { calcularNivelDeRiesgo, COLOR_NIVEL_RIESGO, NOMBRE_NIVEL_RIESGO, TEXTO_NIVEL_RIESGO } from '../nivelRiesgo';
import type { ArchivoAdjuntoTratamiento, Riesgo, TratamientoRiesgo, TratamientoRiesgoInput } from '../types';

const OPCIONES_OPCION = [
  { value: 'MITIGAR', label: 'Mitigar' },
  { value: 'TRANSFERIR', label: 'Transferir' },
  { value: 'EVITAR', label: 'Evitar' },
  { value: 'ACEPTAR', label: 'Aceptar' },
];

const COLOR_ESTADO: Record<TratamientoRiesgo['estado'], string> = {
  PENDIENTE: 'default',
  VENCIDO: 'red',
  COMPLETADO: 'green',
};

const NOMBRE_ESTADO: Record<TratamientoRiesgo['estado'], string> = {
  PENDIENTE: 'Pendiente',
  VENCIDO: 'Vencido',
  COMPLETADO: 'Completado',
};

type FormValues = Omit<
  TratamientoRiesgoInput,
  'riesgo' | 'fecha_limite' | 'fecha_cierre' | 'fecha_proximo_seguimiento'
> & {
  fecha_limite: dayjs.Dayjs | null;
  fecha_cierre: dayjs.Dayjs | null;
  fecha_proximo_seguimiento: dayjs.Dayjs | null;
};

interface Props {
  open: boolean;
  riesgo: Riesgo | null;
  tratamiento: TratamientoRiesgo | null;
  onClose: () => void;
}

export function TratamientoFormModal({ open, riesgo, tratamiento, onClose }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([]);
  const [archivosExistentes, setArchivosExistentes] = useState<ArchivoAdjuntoTratamiento[]>([]);
  const queryClient = useQueryClient();

  const { data: usuarios } = useQuery({ queryKey: ['usuarios'], queryFn: fetchUsuarios, enabled: open });

  const probabilidadResidual = Form.useWatch('probabilidad_residual', form);
  const impactoResidual = Form.useWatch('impacto_residual', form);
  const riesgoResidual =
    probabilidadResidual && impactoResidual ? probabilidadResidual * impactoResidual : null;
  const nivelDeRiesgoResidual =
    probabilidadResidual && impactoResidual ? calcularNivelDeRiesgo(probabilidadResidual, impactoResidual) : null;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setArchivosNuevos([]);
    setArchivosExistentes(tratamiento?.archivos_adjuntos ?? []);
    if (tratamiento) {
      form.setFieldsValue({
        opcion: tratamiento.opcion,
        descripcion: tratamiento.descripcion,
        accion_mitigacion: tratamiento.accion_mitigacion,
        recursos_necesarios: tratamiento.recursos_necesarios,
        responsables: tratamiento.responsables,
        fecha_limite: tratamiento.fecha_limite ? dayjs(tratamiento.fecha_limite) : null,
        fecha_cierre: tratamiento.fecha_cierre ? dayjs(tratamiento.fecha_cierre) : null,
        fecha_proximo_seguimiento: tratamiento.fecha_proximo_seguimiento
          ? dayjs(tratamiento.fecha_proximo_seguimiento)
          : null,
        evidencias_esperadas: tratamiento.evidencias_esperadas,
        probabilidad_residual: tratamiento.probabilidad_residual,
        impacto_residual: tratamiento.impacto_residual,
      });
    } else {
      form.setFieldsValue({ opcion: 'MITIGAR', responsables: [] });
    }
  }, [open, tratamiento, form]);

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['tratamientos', riesgo?.id] });
    queryClient.invalidateQueries({ queryKey: ['riesgos'] });
  };

  const eliminarArchivoMutation = useMutation({
    mutationFn: eliminarArchivoTratamiento,
    onSuccess: (_, archivoId) => {
      message.success('Archivo eliminado.');
      setArchivosExistentes((previos) => previos.filter((a) => a.id !== archivoId));
      invalidar();
    },
    onError: () => message.error('No se pudo eliminar el archivo.'),
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!riesgo) throw new Error('Falta el riesgo');
      const payload: TratamientoRiesgoInput = {
        ...values,
        riesgo: riesgo.id,
        fecha_limite: values.fecha_limite ? values.fecha_limite.format('YYYY-MM-DD') : null,
        fecha_cierre: values.fecha_cierre ? values.fecha_cierre.format('YYYY-MM-DD') : null,
        fecha_proximo_seguimiento: values.fecha_proximo_seguimiento
          ? values.fecha_proximo_seguimiento.format('YYYY-MM-DD')
          : null,
      };
      const guardado = tratamiento
        ? await actualizarTratamiento(tratamiento.id, payload)
        : await crearTratamiento(payload);
      for (const archivo of archivosNuevos) {
        await subirArchivoTratamiento(guardado.id, archivo);
      }
      return guardado;
    },
    onSuccess: () => {
      message.success(tratamiento ? 'Tratamiento actualizado.' : 'Tratamiento creado.');
      invalidar();
      onClose();
    },
    onError: () => message.error('No se pudo guardar el tratamiento. Revisa los datos e intenta de nuevo.'),
  });

  return (
    <Modal
      title={tratamiento ? 'Editar tratamiento' : 'Nuevo tratamiento'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={680}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item
          name="opcion"
          label="Opción de tratamiento"
          rules={[{ required: true, message: 'Selecciona una opción' }]}
        >
          <Select options={OPCIONES_OPCION} />
        </Form.Item>
        <Form.Item name="descripcion" label="Descripción">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="accion_mitigacion" label="Acción de mitigación">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="recursos_necesarios" label="Recursos necesarios">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item
          name="responsables"
          label="Responsables"
          rules={[{ required: true, message: 'Selecciona al menos un responsable' }]}
        >
          <Select
            mode="multiple"
            showSearch
            optionFilterProp="label"
            options={usuarios?.results.map((u) => ({ value: u.id, label: `${u.nombre_completo} (${u.email})` }))}
          />
        </Form.Item>
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="fecha_limite" label="Fecha límite (plazo)" style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="fecha_cierre" label="Fecha de seguimiento" style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="fecha_proximo_seguimiento" label="Fecha de próximo seguimiento" style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </div>
        <Form.Item name="evidencias_esperadas" label="Evidencias esperadas">
          <Input.TextArea rows={2} />
        </Form.Item>
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="probabilidad_residual" label="Probabilidad residual" style={{ flex: 1 }}>
            <Select allowClear options={opcionesEscala(ESCALA_PROBABILIDAD)} />
          </Form.Item>
          <Form.Item name="impacto_residual" label="Impacto residual" style={{ flex: 1 }}>
            <Select allowClear options={opcionesEscala(ESCALA_IMPACTO)} />
          </Form.Item>
        </div>
        {riesgoResidual !== null && nivelDeRiesgoResidual && (
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
              Riesgo residual (probabilidad × impacto): <Typography.Text strong>{riesgoResidual}</Typography.Text>
            </Typography.Text>
            <Typography.Text>
              Nivel de riesgo residual:{' '}
              <Tag
                color={COLOR_NIVEL_RIESGO[nivelDeRiesgoResidual]}
                style={{ color: TEXTO_NIVEL_RIESGO[nivelDeRiesgoResidual], borderColor: 'transparent' }}
              >
                {NOMBRE_NIVEL_RIESGO[nivelDeRiesgoResidual]}
              </Tag>
            </Typography.Text>
          </div>
        )}
        <Form.Item label="Adjuntar evidencias">
          {archivosExistentes.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 8 }}>
              {archivosExistentes.map((archivo) => (
                <li key={archivo.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <PaperClipOutlined />
                  <Typography.Link
                    style={{ flex: 1 }}
                    onClick={() =>
                      descargarArchivo(
                        `/archivos-adjuntos-tratamiento/${archivo.id}/descargar/`,
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
        {tratamiento && (
          <Typography.Text type="secondary">
            Estado (automático, según la fecha límite y las evidencias cargadas):{' '}
            <Tag color={COLOR_ESTADO[tratamiento.estado]}>{NOMBRE_ESTADO[tratamiento.estado]}</Tag>
          </Typography.Text>
        )}
      </Form>
    </Modal>
  );
}
