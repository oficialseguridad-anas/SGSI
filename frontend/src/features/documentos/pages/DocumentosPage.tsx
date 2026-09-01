import { EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Empty, Input, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { normalizarTexto } from '../../../shared/utils/normalizarTexto';
import { DocumentoFormModal } from '../components/DocumentoFormModal';
import { PrevisualizarDocumentoModal } from '../components/PrevisualizarDocumentoModal';
import { eliminarDocumento, fetchDocumentos } from '../api';
import type { Documento, EstadoDocumento, TipoDocumento } from '../types';

const NOMBRE_TIPO: Record<TipoDocumento, string> = {
  POLITICA: 'Política',
  PROCEDIMIENTO: 'Procedimiento',
  MANUAL: 'Manual',
  FORMATO: 'Formato',
  REGISTRO: 'Registro',
  INSTRUCTIVO: 'Instructivo',
  PLAN: 'Plan',
  MATRIZ: 'Matriz',
  GUIA: 'Guía',
  PROGRAMA: 'Programa',
};

const COLOR_ESTADO: Record<EstadoDocumento, string> = {
  BORRADOR: 'default',
  EN_REVISION: 'blue',
  APROBADO: 'cyan',
  VIGENTE: 'green',
  OBSOLETO: 'red',
};

export function DocumentosPage() {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['documentos'], queryFn: fetchDocumentos });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [documentoEditando, setDocumentoEditando] = useState<Documento | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [previsualizarAbierto, setPrevisualizarAbierto] = useState(false);
  const [documentoParaPrevisualizar, setDocumentoParaPrevisualizar] = useState<Documento | null>(null);

  // Filtro instantáneo en el cliente: el listado completo ya viaja en un solo request
  // (no hay paginación en este módulo), así que filtrar localmente responde al instante
  // en cada tecla, sin la latencia ni la carga al servidor de repetir la consulta por AJAX.
  const documentos = data?.results ?? [];
  const documentosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    if (!termino) return documentos;
    return documentos.filter((documento) => {
      const campos = [
        documento.codigo,
        documento.titulo,
        documento.descripcion,
        NOMBRE_TIPO[documento.tipo],
        documento.propietario_nombre,
      ];
      return campos.some((campo) => campo && normalizarTexto(campo).includes(termino));
    });
  }, [documentos, busqueda]);

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

  function abrirPrevisualizacion(documento: Documento) {
    setDocumentoParaPrevisualizar(documento);
    setPrevisualizarAbierto(true);
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
      title: 'Archivo',
      key: 'archivo',
      render: (_: unknown, documento: Documento) =>
        documento.archivo ? (
          <Button size="small" icon={<EyeOutlined />} onClick={() => abrirPrevisualizacion(documento)}>
            Ver
          </Button>
        ) : (
          '—'
        ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_: unknown, documento: Documento) => (
        <Space>
          {hasPerm('documentos.change_documento') && (
            <Button size="small" onClick={() => abrirEditar(documento)}>Editar</Button>
          )}
          {hasPerm('documentos.delete_documento') && (
            <Popconfirm
              title="¿Eliminar este documento?"
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              onConfirm={() => eliminarMutation.mutate(documento.id)}
            >
              <Button size="small" danger>Eliminar</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Documentos"
      extra={
        hasPerm('documentos.add_documento') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Nuevo documento</Button>
        )
      }
    >
      <ErrorCarga visible={isError} entidad="los documentos" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#898781' }} />}
          placeholder="Buscar por código, título, descripción, tipo o propietario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: 420 }}
        />
        {busqueda && (
          <Typography.Text type="secondary">
            {documentosFiltrados.length} de {documentos.length} documentos
          </Typography.Text>
        )}
      </div>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={documentosFiltrados}
        pagination={false}
        locale={{
          emptyText: busqueda ? (
            <Empty description={`Ningún documento coincide con "${busqueda}".`} />
          ) : undefined,
        }}
      />
      <DocumentoFormModal open={modalAbierto} documento={documentoEditando} onClose={() => setModalAbierto(false)} />
      <PrevisualizarDocumentoModal
        open={previsualizarAbierto}
        titulo={
          documentoParaPrevisualizar
            ? `${documentoParaPrevisualizar.codigo} — ${documentoParaPrevisualizar.titulo}`
            : 'Documento'
        }
        documentoId={documentoParaPrevisualizar?.id ?? null}
        archivo={documentoParaPrevisualizar?.archivo ?? null}
        onClose={() => setPrevisualizarAbierto(false)}
      />
    </Card>
  );
}
