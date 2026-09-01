import { UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, DatePicker, Form, Input, Modal, Select, Upload, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { fetchUsuarios } from '../../accounts/api';
import { actualizarDocumento, crearDocumento } from '../api';
import type { Documento, DocumentoInput } from '../types';

const OPCIONES_TIPO = [
  { value: 'POLITICA', label: 'Política' },
  { value: 'PROCEDIMIENTO', label: 'Procedimiento' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'FORMATO', label: 'Formato' },
  { value: 'REGISTRO', label: 'Registro' },
  { value: 'INSTRUCTIVO', label: 'Instructivo' },
  { value: 'PLAN', label: 'Plan' },
  { value: 'MATRIZ', label: 'Matriz' },
  { value: 'GUIA', label: 'Guía' },
  { value: 'PROGRAMA', label: 'Programa' },
];

const OPCIONES_ESTADO = [
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'EN_REVISION', label: 'En revisión' },
  { value: 'APROBADO', label: 'Aprobado' },
  { value: 'VIGENTE', label: 'Vigente' },
  { value: 'OBSOLETO', label: 'Obsoleto' },
];

type FormValues = Omit<DocumentoInput, 'archivo' | 'fecha_aprobacion' | 'fecha_proxima_revision'> & {
  fecha_aprobacion: dayjs.Dayjs | null;
  fecha_proxima_revision: dayjs.Dayjs | null;
};

interface Props {
  open: boolean;
  documento: Documento | null;
  onClose: () => void;
}

export function DocumentoFormModal({ open, documento, onClose }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [archivo, setArchivo] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const { data: usuarios } = useQuery({ queryKey: ['usuarios'], queryFn: fetchUsuarios, enabled: open });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setArchivo(null);
    if (documento) {
      form.setFieldsValue({
        codigo: documento.codigo,
        titulo: documento.titulo,
        tipo: documento.tipo,
        descripcion: documento.descripcion,
        version_actual: documento.version_actual,
        estado: documento.estado,
        propietario: documento.propietario,
        aprobado_por: documento.aprobado_por,
        fecha_aprobacion: documento.fecha_aprobacion ? dayjs(documento.fecha_aprobacion) : null,
        fecha_proxima_revision: documento.fecha_proxima_revision ? dayjs(documento.fecha_proxima_revision) : null,
      });
    } else {
      form.setFieldsValue({ version_actual: '1.0', estado: 'BORRADOR' });
    }
  }, [open, documento, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: DocumentoInput = {
        ...values,
        fecha_aprobacion: values.fecha_aprobacion ? values.fecha_aprobacion.format('YYYY-MM-DD') : null,
        fecha_proxima_revision: values.fecha_proxima_revision
          ? values.fecha_proxima_revision.format('YYYY-MM-DD')
          : null,
        archivo,
      };
      return documento ? actualizarDocumento(documento.id, payload) : crearDocumento(payload);
    },
    onSuccess: () => {
      message.success(documento ? 'Documento actualizado.' : 'Documento creado.');
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      onClose();
    },
    onError: () => {
      message.error('No se pudo guardar el documento. Revisa los datos e intenta de nuevo.');
    },
  });

  return (
    <Modal
      title={documento ? `Editar documento ${documento.codigo}` : 'Nuevo documento'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={640}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item name="codigo" label="Código" rules={[{ required: true, message: 'Ingresa un código' }]}>
          <Input placeholder="POL-001" />
        </Form.Item>
        <Form.Item name="titulo" label="Título" rules={[{ required: true, message: 'Ingresa un título' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="descripcion" label="Descripción">
          <Input.TextArea rows={2} />
        </Form.Item>
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Select options={OPCIONES_TIPO} />
          </Form.Item>
          <Form.Item name="version_actual" label="Versión" rules={[{ required: true }]} style={{ width: 120 }}>
            <Input />
          </Form.Item>
          <Form.Item name="estado" label="Estado" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Select options={OPCIONES_ESTADO} />
          </Form.Item>
        </div>
        <Form.Item name="propietario" label="Propietario" rules={[{ required: true, message: 'Selecciona un propietario' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={usuarios?.results.map((u) => ({ value: u.id, label: `${u.nombre_completo} (${u.email})` }))}
          />
        </Form.Item>
        <Form.Item name="aprobado_por" label="Aprobado por">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            options={usuarios?.results.map((u) => ({ value: u.id, label: `${u.nombre_completo} (${u.email})` }))}
          />
        </Form.Item>
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="fecha_aprobacion" label="Fecha de aprobación" style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="fecha_proxima_revision" label="Próxima revisión" style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </div>
        <Form.Item label="Archivo">
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
              {documento?.archivo ? 'Reemplazar archivo' : 'Subir archivo'}
            </Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
