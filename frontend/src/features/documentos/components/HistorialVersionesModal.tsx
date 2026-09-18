import { PaperClipOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, DatePicker, Empty, Form, Input, Modal, Skeleton, Table, Typography, Upload, message } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { descargarArchivo, nombreDeArchivo } from '../../../shared/api/descargarArchivo';
import { crearVersionDocumento, fetchVersionesDocumento } from '../api';
import type { Documento, VersionDocumento, VersionDocumentoInput } from '../types';

interface Props {
  open: boolean;
  documento: Documento | null;
  onClose: () => void;
}

interface NuevaVersionValues {
  version: string;
  fecha_version: dayjs.Dayjs;
  cambios: string;
}

export function HistorialVersionesModal({ open, documento, onClose }: Props) {
  const { user, hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<NuevaVersionValues>();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [formularioAbierto, setFormularioAbierto] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['versiones-documento', documento?.id],
    queryFn: () => fetchVersionesDocumento(documento!.id),
    enabled: open && !!documento,
  });

  const mutation = useMutation({
    mutationFn: (values: NuevaVersionValues) => {
      if (!documento) throw new Error('Falta el documento');
      const payload: VersionDocumentoInput = {
        documento: documento.id,
        version: values.version,
        fecha_version: values.fecha_version.format('YYYY-MM-DD'),
        cambios: values.cambios,
        creado_por: user?.id ?? null,
        archivo,
      };
      return crearVersionDocumento(payload);
    },
    onSuccess: () => {
      message.success('Nueva versión registrada.');
      queryClient.invalidateQueries({ queryKey: ['versiones-documento', documento?.id] });
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      form.resetFields();
      setArchivo(null);
      setFormularioAbierto(false);
    },
    onError: () => message.error('No se pudo registrar la versión. Revisa los datos e intenta de nuevo.'),
  });

  function abrirFormularioNuevaVersion() {
    form.setFieldsValue({
      version: '',
      fecha_version: dayjs(),
      cambios: '',
    });
    setArchivo(null);
    setFormularioAbierto(true);
  }

  const columns = [
    { title: 'Versión', dataIndex: 'version', key: 'version', width: 90 },
    { title: 'Fecha', dataIndex: 'fecha_version', key: 'fecha_version', width: 110 },
    {
      title: 'Descripción del cambio',
      dataIndex: 'cambios',
      key: 'cambios',
      render: (texto: string) =>
        texto ? (
          <Typography.Text ellipsis={{ tooltip: texto }} style={{ maxWidth: 260, display: 'inline-block' }}>
            {texto}
          </Typography.Text>
        ) : (
          '—'
        ),
    },
    { title: 'Registrado por', dataIndex: 'creado_por_nombre', key: 'creado_por_nombre', width: 160, render: (t: string | null) => t ?? '—' },
    {
      title: 'Archivo',
      key: 'archivo',
      width: 110,
      render: (_: unknown, version: VersionDocumento) =>
        version.archivo ? (
          <Button
            size="small"
            type="text"
            icon={<PaperClipOutlined />}
            onClick={() =>
              descargarArchivo(`/versiones-documento/${version.id}/descargar/`, nombreDeArchivo(version.archivo!))
            }
          >
            Ver
          </Button>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <Modal
      title={documento ? `Control de versiones — ${documento.codigo}` : 'Control de versiones'}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={820}
    >
      {documento && (
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Versión vigente: <Typography.Text strong>{documento.version_actual}</Typography.Text>
        </Typography.Text>
      )}

      {isLoading && <Skeleton active paragraph={{ rows: 4 }} />}

      {!isLoading && (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.results ?? []}
          pagination={false}
          size="small"
          locale={{
            emptyText: (
              <Empty description="Este documento todavía no tiene versiones registradas en su historial." />
            ),
          }}
          style={{ marginBottom: 16 }}
        />
      )}

      {hasPerm('documentos.add_versiondocumento') && (
        <>
          {!formularioAbierto ? (
            <Button icon={<PlusOutlined />} onClick={abrirFormularioNuevaVersion}>
              Agregar nueva versión
            </Button>
          ) : (
            <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Form.Item
                  name="version"
                  label="Nueva versión"
                  rules={[{ required: true, message: 'Ingresa el número de versión' }]}
                  style={{ width: 140 }}
                >
                  <Input placeholder="Ej. 2.0" />
                </Form.Item>
                <Form.Item
                  name="fecha_version"
                  label="Fecha de la versión"
                  rules={[{ required: true, message: 'Selecciona la fecha' }]}
                  style={{ flex: 1 }}
                >
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </div>
              <Form.Item
                name="cambios"
                label="Descripción del cambio"
                rules={[{ required: true, message: 'Describe qué cambió en esta versión' }]}
              >
                <Input.TextArea rows={2} placeholder="Qué cambió y por qué, respecto a la versión anterior" />
              </Form.Item>
              <Form.Item label="Archivo de esta versión">
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
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" loading={mutation.isPending}>
                  Guardar versión
                </Button>
                <Button style={{ marginLeft: 8 }} onClick={() => setFormularioAbierto(false)}>
                  Cancelar
                </Button>
              </Form.Item>
            </Form>
          )}
        </>
      )}
    </Modal>
  );
}
