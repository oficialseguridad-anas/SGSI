import { PaperClipOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Empty, Input, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { normalizarTexto } from '../../../shared/utils/normalizarTexto';
import { eliminarIncidente, fetchIncidentes } from '../api';
import { IncidenteFormModal } from '../components/IncidenteFormModal';
import { PrevisualizarSoportesIncidenteModal } from '../components/PrevisualizarSoportesIncidenteModal';
import { COLOR_TIPO_INCIDENTE, NOMBRE_TIPO_INCIDENTE } from '../tipoIncidente';
import type { Incidente } from '../types';

function textoCompacto(texto: string, filas = 3, ancho = 280) {
  if (!texto) return '—';
  return (
    <Typography.Paragraph
      ellipsis={{ rows: filas, tooltip: { title: texto, placement: 'topLeft' } }}
      style={{ marginBottom: 0, maxWidth: ancho }}
    >
      {texto}
    </Typography.Paragraph>
  );
}

export function IncidentesPage() {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['incidentes'], queryFn: fetchIncidentes });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [incidenteEditando, setIncidenteEditando] = useState<Incidente | null>(null);
  const [previsualizarAbierto, setPrevisualizarAbierto] = useState(false);
  const [incidenteParaPrevisualizar, setIncidenteParaPrevisualizar] = useState<Incidente | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const incidentes = data?.results ?? [];
  const incidentesFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    if (!termino) return incidentes;
    return incidentes.filter((i) => {
      const campos = [
        i.codigo,
        i.nombre_evento,
        i.descripcion,
        NOMBRE_TIPO_INCIDENTE[i.tipo],
        i.fuente,
        i.responsable_nombre,
        i.registrado_por_nombre,
      ];
      return campos.some((campo) => campo && normalizarTexto(campo).includes(termino));
    });
  }, [incidentes, busqueda]);

  const eliminarMutation = useMutation({
    mutationFn: eliminarIncidente,
    onSuccess: () => {
      message.success('Registro eliminado.');
      queryClient.invalidateQueries({ queryKey: ['incidentes'] });
    },
    onError: () => message.error('No se pudo eliminar el registro.'),
  });

  function abrirCrear() {
    setIncidenteEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(incidente: Incidente) {
    setIncidenteEditando(incidente);
    setModalAbierto(true);
  }

  function abrirPrevisualizacion(incidente: Incidente) {
    setIncidenteParaPrevisualizar(incidente);
    setPrevisualizarAbierto(true);
  }

  const columns = [
    {
      title: 'No.',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 90,
      sorter: (a: Incidente, b: Incidente) => a.codigo.localeCompare(b.codigo),
      defaultSortOrder: 'descend' as const,
      render: (codigo: string) => <strong>{codigo}</strong>,
    },
    { title: 'Fecha', dataIndex: 'fecha', key: 'fecha', width: 100 },
    { title: 'Hora', dataIndex: 'hora', key: 'hora', width: 80, render: (h: string) => h.slice(0, 5) },
    {
      title: 'Nombre del evento o incidente',
      dataIndex: 'nombre_evento',
      key: 'nombre_evento',
      width: 220,
      render: (texto: string) => textoCompacto(texto, 2, 220),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      width: 300,
      render: (texto: string) => textoCompacto(texto, 3, 300),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 100,
      render: (tipo: Incidente['tipo']) => <Tag color={COLOR_TIPO_INCIDENTE[tipo]}>{NOMBRE_TIPO_INCIDENTE[tipo]}</Tag>,
    },
    { title: 'Fuente', dataIndex: 'fuente', key: 'fuente', width: 160, render: (t: string) => t || '—' },
    { title: 'Responsable', dataIndex: 'responsable_nombre', key: 'responsable_nombre', width: 160 },
    { title: 'Registro por', dataIndex: 'registrado_por_nombre', key: 'registrado_por_nombre', width: 160 },
    {
      title: 'Soportes',
      key: 'soportes',
      width: 100,
      render: (_: unknown, incidente: Incidente) =>
        incidente.archivos_adjuntos.length > 0 ? (
          <Button
            size="small"
            type="text"
            icon={<PaperClipOutlined />}
            onClick={() => abrirPrevisualizacion(incidente)}
          >
            {incidente.archivos_adjuntos.length}
          </Button>
        ) : (
          '—'
        ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 140,
      render: (_: unknown, incidente: Incidente) => (
        <Space>
          {hasPerm('incidentes.change_incidente') && (
            <Button size="small" onClick={() => abrirEditar(incidente)}>Editar</Button>
          )}
          {hasPerm('incidentes.delete_incidente') && (
            <Popconfirm
              title="¿Eliminar este registro?"
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              onConfirm={() => eliminarMutation.mutate(incidente.id)}
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
      title="Matriz de incidentes y eventos de seguridad de la información"
      extra={
        hasPerm('incidentes.add_incidente') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Nuevo registro</Button>
        )
      }
    >
      <ErrorCarga visible={isError} entidad="los incidentes" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#898781' }} />}
          placeholder="Buscar por No., nombre, descripción, tipo, fuente, responsable o registrado por..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: 480 }}
        />
        {busqueda && (
          <Typography.Text type="secondary">
            {incidentesFiltrados.length} de {incidentes.length} registros
          </Typography.Text>
        )}
      </div>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={incidentesFiltrados}
        pagination={false}
        scroll={{ x: 1700 }}
        locale={{
          emptyText: busqueda ? <Empty description={`Ningún registro coincide con "${busqueda}".`} /> : undefined,
        }}
      />
      <IncidenteFormModal open={modalAbierto} incidente={incidenteEditando} onClose={() => setModalAbierto(false)} />
      <PrevisualizarSoportesIncidenteModal
        open={previsualizarAbierto}
        titulo={incidenteParaPrevisualizar ? `Soportes — ${incidenteParaPrevisualizar.codigo}` : 'Soportes'}
        archivos={incidenteParaPrevisualizar?.archivos_adjuntos ?? []}
        onClose={() => setPrevisualizarAbierto(false)}
      />
    </Card>
  );
}
