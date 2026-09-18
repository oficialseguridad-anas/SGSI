import { HistoryOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, DatePicker, Form, Input, Modal, Select, Typography, Upload, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { fetchUsuarios } from '../../accounts/api';
import { actualizarDocumento, crearDocumento } from '../api';
import { HistorialVersionesModal } from './HistorialVersionesModal';
import type { Documento, DocumentoInput } from '../types';

const OPCIONES_TIPO = [
  { value: 'FORMATO', label: 'Formato' },
  { value: 'GUIA', label: 'Guía' },
  { value: 'INSTRUCTIVO', label: 'Instructivo' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'MATRIZ', label: 'Matriz' },
  { value: 'PLAN', label: 'Plan' },
  { value: 'POLITICA', label: 'Política' },
  { value: 'PROCEDIMIENTO', label: 'Procedimiento' },
  { value: 'PROGRAMA', label: 'Programa' },
  { value: 'PROTOCOLO', label: 'Protocolo' },
  { value: 'REGISTRO', label: 'Registro' },
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
  const [historialAbierto, setHistorialAbierto] = useState(false);
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
        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Select options={OPCIONES_TIPO} />
          </Form.Item>
          <Form.Item
            name="version_actual"
            label="Versión"
            rules={[{ required: true }]}
            style={{ width: 120 }}
            tooltip={documento ? 'Se actualiza sola desde "Control de versiones" — no se edita aquí directamente.' : undefined}
          >
            <Input disabled={Boolean(documento)} />
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

        {documento && (
          <Form.Item label="Control de versiones">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fafafa',
                border: '1px solid #e1e0d9',
                borderRadius: 6,
                padding: '10px 12px',
              }}
            >
              <Typography.Text>
                Versión vigente: <Typography.Text strong>{documento.version_actual}</Typography.Text>
                {' · '}
                {documento.versiones.length === 1
                  ? '1 versión registrada'
                  : `${documento.versiones.length} versiones registradas`}
              </Typography.Text>
              <Button icon={<HistoryOutlined />} onClick={() => setHistorialAbierto(true)}>
                Ver historial / agregar versión
              </Button>
            </div>
          </Form.Item>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item name="fecha_aprobacion" label="Fecha de aprobación" style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="fecha_proxima_revision" label="Próxima revisión" style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        </div>
        {!documento && (
          <Form.Item label="Archivo" tooltip="Queda registrado como la versión inicial (1.0) en el control de versiones.">
            <Upload
              beforeUpload={(file) => {
                setArchivo(file);
                return false;
              }}
              onRemove={() => setArchivo(null)}
              maxCount={1}
              fileList={archivo ? [{ uid: '1', name: archivo.name, status: 'done' }] : []}
            >
              <Button icon={<UploadOutlined />}>Subir archivo</Button>
            </Upload>
          </Form.Item>
        )}
      </Form>
      <HistorialVersionesModal
        open={historialAbierto}
        documento={documento}
        onClose={() => setHistorialAbierto(false)}
      />
    </Modal>
  );
}
