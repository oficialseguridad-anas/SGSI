import { EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Col, Empty, Input, Popconfirm, Row, Space, Table, Tag, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { BRAND } from '../../../shared/theme/brand';
import { normalizarTexto } from '../../../shared/utils/normalizarTexto';
import { DocumentoFormModal } from '../components/DocumentoFormModal';
import { HistorialVersionesModal } from '../components/HistorialVersionesModal';
import { PrevisualizarDocumentoModal } from '../components/PrevisualizarDocumentoModal';
import { eliminarDocumento, fetchDocumentos } from '../api';
import type { Documento, EstadoDocumento, TipoDocumento } from '../types';

const NOMBRE_TIPO: Record<TipoDocumento, string> = {
  FORMATO: 'Formato',
  GUIA: 'Guía',
  INSTRUCTIVO: 'Instructivo',
  MANUAL: 'Manual',
  MATRIZ: 'Matriz',
  PLAN: 'Plan',
  POLITICA: 'Política',
  PROCEDIMIENTO: 'Procedimiento',
  PROGRAMA: 'Programa',
  PROTOCOLO: 'Protocolo',
  REGISTRO: 'Registro',
};

const TIPOS_DOCUMENTO: TipoDocumento[] = [
  'FORMATO', 'GUIA', 'INSTRUCTIVO', 'MANUAL', 'MATRIZ', 'PLAN',
  'POLITICA', 'PROCEDIMIENTO', 'PROGRAMA', 'PROTOCOLO', 'REGISTRO',
];

// Paleta categórica: los 8 tonos fijos validados con el skill de dataviz (mismo orden
// que GraficaActivosPorClase) para los primeros 8 tipos, extendida con 3 tonos
// adicionales bien diferenciados para los tipos restantes. Cada tarjeta siempre
// muestra su etiqueta de texto, así que el color nunca es el único canal de identidad.
const COLOR_TIPO: Record<TipoDocumento, string> = {
  FORMATO: '#2a78d6',
  GUIA: '#eb6834',
  INSTRUCTIVO: '#1baf7a',
  MANUAL: '#eda100',
  MATRIZ: '#e87ba4',
  PLAN: '#008300',
  POLITICA: '#4a3aa7',
  PROCEDIMIENTO: '#e34948',
  PROGRAMA: BRAND.teal,
  PROTOCOLO: '#8d6e63',
  REGISTRO: '#37474f',
};

const COLOR_ESTADO: Record<EstadoDocumento, string> = {
  BORRADOR: 'default',
  EN_REVISION: 'blue',
  APROBADO: 'cyan',
  VIGENTE: 'green',
  OBSOLETO: 'red',
};

function fondoClaro(colorHex: string, alpha = 0.14) {
  const r = parseInt(colorHex.slice(1, 3), 16);
  const g = parseInt(colorHex.slice(3, 5), 16);
  const b = parseInt(colorHex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function TarjetaKpi({
  color,
  valor,
  etiqueta,
  seleccionada,
  onClick,
}: {
  color: string;
  valor: number;
  etiqueta: string;
  seleccionada: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      size="small"
      hoverable
      onClick={onClick}
      styles={{ body: { padding: '14px 16px' } }}
      style={{
        cursor: 'pointer',
        background: fondoClaro(color, seleccionada ? 0.22 : 0.14),
        borderColor: seleccionada ? color : undefined,
        boxShadow: seleccionada ? `0 0 0 1px ${color}` : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 12 }}>
        <div style={{ width: 4, borderRadius: 2, background: color }} />
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, color: '#1a1a1a' }}>{valor}</div>
          <div style={{ fontSize: 12.5, color: '#4a4944' }}>{etiqueta}</div>
        </div>
      </div>
    </Card>
  );
}

export function DocumentosPage() {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['documentos'], queryFn: fetchDocumentos });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [documentoEditando, setDocumentoEditando] = useState<Documento | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [previsualizarAbierto, setPrevisualizarAbierto] = useState(false);
  const [documentoParaPrevisualizar, setDocumentoParaPrevisualizar] = useState<Documento | null>(null);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [documentoParaHistorial, setDocumentoParaHistorial] = useState<Documento | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<TipoDocumento | null>(null);

  // Filtro instantáneo en el cliente: el listado completo ya viaja en un solo request
  // (no hay paginación en este módulo), así que filtrar localmente responde al instante
  // en cada tecla, sin la latencia ni la carga al servidor de repetir la consulta por AJAX.
  const documentos = data?.results ?? [];
  const documentosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    return documentos.filter((documento) => {
      if (filtroTipo && documento.tipo !== filtroTipo) return false;
      if (!termino) return true;
      const campos = [
        documento.codigo,
        documento.titulo,
        NOMBRE_TIPO[documento.tipo],
        documento.propietario_nombre,
      ];
      return campos.some((campo) => campo && normalizarTexto(campo).includes(termino));
    });
  }, [documentos, busqueda, filtroTipo]);

  const resumenTipos = useMemo(() => {
    const conteo = TIPOS_DOCUMENTO.reduce((acc, tipo) => ({ ...acc, [tipo]: 0 }), {} as Record<TipoDocumento, number>);
    documentos.forEach((documento) => {
      conteo[documento.tipo] += 1;
    });
    return conteo;
  }, [documentos]);

  function alternarFiltroTipo(tipo: TipoDocumento) {
    setFiltroTipo((actual) => (actual === tipo ? null : tipo));
  }

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

  function abrirHistorial(documento: Documento) {
    setDocumentoParaHistorial(documento);
    setHistorialAbierto(true);
  }

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      render: (codigo: string) => <strong>{codigo}</strong>,
    },
    {
      title: 'Título',
      dataIndex: 'titulo',
      key: 'titulo',
      render: (titulo: string, documento: Documento) => (
        <Typography.Link onClick={() => abrirHistorial(documento)} title="Ver control de versiones">
          {titulo}
        </Typography.Link>
      ),
    },
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
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={4}>
          <TarjetaKpi
            color={BRAND.teal}
            valor={documentos.length}
            etiqueta="Total de documentos"
            seleccionada={filtroTipo === null}
            onClick={() => setFiltroTipo(null)}
          />
        </Col>
        {TIPOS_DOCUMENTO.map((tipo) => (
          <Col key={tipo} xs={12} sm={8} md={4}>
            <TarjetaKpi
              color={COLOR_TIPO[tipo]}
              valor={resumenTipos[tipo]}
              etiqueta={NOMBRE_TIPO[tipo]}
              seleccionada={filtroTipo === tipo}
              onClick={() => alternarFiltroTipo(tipo)}
            />
          </Col>
        ))}
      </Row>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#898781' }} />}
          placeholder="Buscar por código, título, tipo o propietario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: 420 }}
        />
        {filtroTipo && (
          <Tag
            closable
            onClose={() => setFiltroTipo(null)}
            color={COLOR_TIPO[filtroTipo]}
            style={{ borderColor: 'transparent' }}
          >
            Filtrando por: {NOMBRE_TIPO[filtroTipo]}
          </Tag>
        )}
        {(busqueda || filtroTipo) && (
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
          emptyText:
            busqueda || filtroTipo ? (
              <Empty description="Ningún documento coincide con el filtro aplicado." />
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
      <HistorialVersionesModal
        open={historialAbierto}
        documento={documentoParaHistorial}
        onClose={() => setHistorialAbierto(false)}
      />
    </Card>
  );
}
