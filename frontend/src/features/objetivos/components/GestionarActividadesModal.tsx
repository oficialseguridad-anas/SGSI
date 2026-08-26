import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { eliminarActividad, fetchActividades } from '../api';
import type { ActividadObjetivo, Objetivo } from '../types';
import { ActividadFormModal } from './ActividadFormModal';

const COLOR_ESTADO: Record<ActividadObjetivo['estado_ejecucion'], string> = {
  PENDIENTE: 'default',
  VENCIDA: 'red',
  COMPLETADA: 'green',
};

const NOMBRE_ESTADO: Record<ActividadObjetivo['estado_ejecucion'], string> = {
  PENDIENTE: 'Pendiente',
  VENCIDA: 'Vencida',
  COMPLETADA: 'Completada',
};

const NOMBRE_PERIODO: Record<ActividadObjetivo['periodo'], string> = {
  MENSUAL: 'Mensual',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
  '': '—',
};

interface Props {
  open: boolean;
  objetivo: Objetivo | null;
  onClose: () => void;
}

export function GestionarActividadesModal({ open, objetivo, onClose }: Props) {
  const queryClient = useQueryClient();
  const [formAbierto, setFormAbierto] = useState(false);
  const [actividadEditando, setActividadEditando] = useState<ActividadObjetivo | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['actividades', objetivo?.id],
    queryFn: () => fetchActividades(objetivo!.id),
    enabled: open && !!objetivo,
  });

  const eliminarMutation = useMutation({
    mutationFn: eliminarActividad,
    onSuccess: () => {
      message.success('Actividad eliminada.');
      queryClient.invalidateQueries({ queryKey: ['actividades', objetivo?.id] });
      queryClient.invalidateQueries({ queryKey: ['objetivos'] });
    },
    onError: () => message.error('No se pudo eliminar la actividad.'),
  });

  function abrirCrear() {
    setActividadEditando(null);
    setFormAbierto(true);
  }

  function abrirEditar(actividad: ActividadObjetivo) {
    setActividadEditando(actividad);
    setFormAbierto(true);
  }

  function textoCompacto(texto: string, ancho = 220) {
    if (!texto) return '—';
    return (
      <Typography.Text ellipsis={{ tooltip: texto }} style={{ maxWidth: ancho, display: 'inline-block' }}>
        {texto}
      </Typography.Text>
    );
  }

  const columns = [
    {
      title: 'Actividad',
      dataIndex: 'actividad',
      key: 'actividad',
      width: 260,
      render: (texto: string) => textoCompacto(texto, 260),
    },
    {
      title: 'Responsables',
      dataIndex: 'responsables',
      key: 'responsables',
      width: 200,
      render: (texto: string) => textoCompacto(texto, 200),
    },
    {
      title: 'Recursos',
      dataIndex: 'recursos',
      key: 'recursos',
      width: 180,
      render: (texto: string) => textoCompacto(texto, 180),
    },
    {
      title: 'Periodo',
      dataIndex: 'periodo',
      key: 'periodo',
      width: 100,
      render: (periodo: ActividadObjetivo['periodo']) => NOMBRE_PERIODO[periodo],
    },
    { title: 'Plazo', dataIndex: 'plazo', key: 'plazo', width: 110, render: (t: string | null) => t ?? '—' },
    {
      title: 'Estado de ejecución',
      dataIndex: 'estado_ejecucion',
      key: 'estado_ejecucion',
      width: 140,
      render: (estado: ActividadObjetivo['estado_ejecucion']) => (
        <Tag color={COLOR_ESTADO[estado]}>{NOMBRE_ESTADO[estado]}</Tag>
      ),
    },
    {
      title: 'Soportes',
      key: 'soportes',
      width: 90,
      render: (_: unknown, actividad: ActividadObjetivo) => actividad.archivos_adjuntos.length || '—',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 140,
      render: (_: unknown, actividad: ActividadObjetivo) => (
        <Space>
          <Button size="small" onClick={() => abrirEditar(actividad)}>Editar</Button>
          <Popconfirm
            title="¿Eliminar esta actividad?"
            okText="Eliminar"
            okButtonProps={{ danger: true }}
            onConfirm={() => eliminarMutation.mutate(actividad.id)}
          >
            <Button size="small" danger>Eliminar</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={objetivo ? `Actividades del objetivo` : 'Actividades del objetivo'}
        open={open}
        onCancel={onClose}
        footer={null}
        width={1300}
        destroyOnHidden
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>
            Agregar actividad
          </Button>
        </div>
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.results ?? []}
          pagination={false}
          scroll={{ x: 1250 }}
          locale={{ emptyText: 'Este objetivo aún no tiene actividades registradas.' }}
        />
      </Modal>
      <ActividadFormModal
        open={formAbierto}
        objetivo={objetivo}
        actividad={actividadEditando}
        onClose={() => setFormAbierto(false)}
      />
    </>
  );
}
