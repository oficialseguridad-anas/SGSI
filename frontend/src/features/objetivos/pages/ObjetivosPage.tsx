import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Empty, Input, Popconfirm, Space, Table, Tag, Tooltip, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { normalizarTexto } from '../../../shared/utils/normalizarTexto';
import { GestionarActividadesModal } from '../components/GestionarActividadesModal';
import { ObjetivoFormModal } from '../components/ObjetivoFormModal';
import { eliminarObjetivo, fetchObjetivos } from '../api';
import type { Objetivo } from '../types';

export function ObjetivosPage() {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['objetivos'], queryFn: fetchObjetivos });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [objetivoEditando, setObjetivoEditando] = useState<Objetivo | null>(null);
  const [actividadesModalAbierto, setActividadesModalAbierto] = useState(false);
  const [objetivoParaActividades, setObjetivoParaActividades] = useState<Objetivo | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const objetivos = data?.results ?? [];
  const objetivosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    if (!termino) return objetivos;
    return objetivos.filter((o) => {
      const campos = [
        o.objetivo,
        o.componente_politica,
        o.responsables_seguimiento,
        o.indicador_desempeno,
        o.meta_indicador,
        ...o.procesos_nombres,
        ...o.indicadores_codigos,
      ];
      return campos.some((campo) => campo && normalizarTexto(campo).includes(termino));
    });
  }, [objetivos, busqueda]);

  const eliminarMutation = useMutation({
    mutationFn: eliminarObjetivo,
    onSuccess: () => {
      message.success('Objetivo eliminado.');
      queryClient.invalidateQueries({ queryKey: ['objetivos'] });
    },
    onError: () => message.error('No se pudo eliminar el objetivo.'),
  });

  function abrirCrear() {
    setObjetivoEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(objetivo: Objetivo) {
    setObjetivoEditando(objetivo);
    setModalAbierto(true);
  }

  function abrirActividades(objetivo: Objetivo) {
    setObjetivoParaActividades(objetivo);
    setActividadesModalAbierto(true);
  }

  function textoCompacto(texto: string, filas = 3, ancho = 220) {
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

  const columns = [
    {
      title: 'ID',
      key: 'id_visual',
      width: 60,
      render: (_: unknown, __: Objetivo, index: number) => <strong>{String(index + 1).padStart(2, '0')}</strong>,
    },
    {
      title: 'Objetivo',
      dataIndex: 'objetivo',
      key: 'objetivo',
      width: 240,
      render: (texto: string) => textoCompacto(texto, 4, 240),
    },
    {
      title: 'Componente de la política',
      dataIndex: 'componente_politica',
      key: 'componente_politica',
      width: 240,
      render: (texto: string) => textoCompacto(texto, 4, 240),
    },
    {
      title: 'Procesos asociados',
      dataIndex: 'procesos_nombres',
      key: 'procesos_nombres',
      width: 200,
      render: (nombres: string[]) =>
        nombres.length ? (
          <Space size={[4, 4]} wrap>
            {nombres.map((n) => (
              <Tag key={n}>{n}</Tag>
            ))}
          </Space>
        ) : (
          '—'
        ),
    },
    {
      title: 'Responsables de seguimiento',
      dataIndex: 'responsables_seguimiento',
      key: 'responsables_seguimiento',
      width: 200,
      render: (texto: string) => textoCompacto(texto, 3, 200),
    },
    {
      title: 'Indicador de desempeño',
      dataIndex: 'indicador_desempeno',
      key: 'indicador_desempeno',
      width: 220,
      render: (texto: string) => textoCompacto(texto, 3, 220),
    },
    {
      title: 'Indicadores',
      dataIndex: 'indicadores_codigos',
      key: 'indicadores_codigos',
      width: 130,
      render: (codigos: string[], objetivo: Objetivo) =>
        codigos.length ? (
          <Space size={[4, 4]} wrap>
            {codigos.map((c, i) => (
              <Tooltip key={c} title={objetivo.indicadores_nombres[i]}>
                <Tag color="blue">{c}</Tag>
              </Tooltip>
            ))}
          </Space>
        ) : (
          '—'
        ),
    },
    {
      title: 'Meta del indicador',
      dataIndex: 'meta_indicador',
      key: 'meta_indicador',
      width: 180,
      render: (texto: string) => textoCompacto(texto, 3, 180),
    },
    {
      title: 'Actividades',
      key: 'actividades',
      width: 150,
      render: (_: unknown, objetivo: Objetivo) => (
        <Button size="small" onClick={() => abrirActividades(objetivo)}>
          {objetivo.actividades.length > 0
            ? `Gestionar (${objetivo.actividades.length})`
            : 'Agregar actividad'}
        </Button>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      render: (_: unknown, objetivo: Objetivo) => (
        <Space direction="vertical" size={4}>
          {hasPerm('objetivos.change_objetivo') && (
            <Button size="small" onClick={() => abrirEditar(objetivo)}>Editar</Button>
          )}
          {hasPerm('objetivos.delete_objetivo') && (
            <Popconfirm
              title="¿Eliminar este objetivo?"
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              onConfirm={() => eliminarMutation.mutate(objetivo.id)}
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
      title="Objetivos del SGSI"
      extra={
        hasPerm('objetivos.add_objetivo') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>
            Nuevo objetivo
          </Button>
        )
      }
    >
      <ErrorCarga visible={isError} entidad="los objetivos" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#898781' }} />}
          placeholder="Buscar por objetivo, componente, proceso, responsable o indicador..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: 480 }}
        />
        {busqueda && (
          <Typography.Text type="secondary">
            {objetivosFiltrados.length} de {objetivos.length} objetivos
          </Typography.Text>
        )}
      </div>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={objetivosFiltrados}
        pagination={false}
        scroll={{ x: 1710 }}
        locale={{
          emptyText: busqueda ? <Empty description={`Ningún objetivo coincide con "${busqueda}".`} /> : undefined,
        }}
      />
      <ObjetivoFormModal open={modalAbierto} objetivo={objetivoEditando} onClose={() => setModalAbierto(false)} />
      <GestionarActividadesModal
        open={actividadesModalAbierto}
        objetivo={objetivoParaActividades}
        onClose={() => setActividadesModalAbierto(false)}
      />
    </Card>
  );
}
