import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Popconfirm, Space, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { DocumentoFormModal } from '../components/DocumentoFormModal';
import { eliminarDocumento, fetchDocumentos } from '../api';
import type { Documento, EstadoDocumento, TipoDocumento } from '../types';

const NOMBRE_TIPO: Record<TipoDocumento, string> = {
  POLITICA: 'Política',
  PROCEDIMIENTO: 'Procedimiento',
  MANUAL: 'Manual',
  FORMATO: 'Formato',
  REGISTRO: 'Registro',
  INSTRUCTIVO: 'Instructivo',
};

const COLOR_ESTADO: Record<EstadoDocumento, string> = {
  BORRADOR: 'default',
  EN_REVISION: 'blue',
  APROBADO: 'cyan',
  VIGENTE: 'green',
  OBSOLETO: 'red',
};

export function DocumentosPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['documentos'], queryFn: fetchDocumentos });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [documentoEditando, setDocumentoEditando] = useState<Documento | null>(null);

  const eliminarMutation = useMutation({
    mutationFn: eliminarDocumento,
    onSuccess: () => {
      message.success('Documento eliminado.');
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
    },
    onError: () => message.error('No se pudo eliminar el documento.'),
  });

  function abrirCrear() {
    setDocumentoEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(documento: Documento) {
    setDocumentoEditando(documento);
    setModalAbierto(true);
  }

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      render: (codigo: string) => <strong>{codigo}</strong>,
    },
    { title: 'Título', dataIndex: 'titulo', key: 'titulo' },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo: TipoDocumento) => NOMBRE_TIPO[tipo],
    },
    { title: 'Versión', dataIndex: 'version_actual', key: 'version_actual' },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado: EstadoDocumento) => <Tag color={COLOR_ESTADO[estado]}>{estado}</Tag>,
    },
    { title: 'Propietario', dataIndex: 'propietario_nombre', key: 'propietario_nombre' },
    { title: 'Próxima revisión', dataIndex: 'fecha_proxima_revision', key: 'fecha_proxima_revision' },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_: unknown, documento: Documento) => (
        <Space>
          <Button size="small" onClick={() => abrirEditar(documento)}>Editar</Button>
          <Popconfirm
            title="¿Eliminar este documento?"
            okText="Eliminar"
            okButtonProps={{ danger: true }}
            onConfirm={() => eliminarMutation.mutate(documento.id)}
          >
            <Button size="small" danger>Eliminar</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Documentos"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Nuevo documento</Button>}
    >
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.results ?? []}
        pagination={false}
      />
      <DocumentoFormModal open={modalAbierto} documento={documentoEditando} onClose={() => setModalAbierto(false)} />
    </Card>
  );
}
