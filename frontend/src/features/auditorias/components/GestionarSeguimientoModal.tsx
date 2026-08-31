import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { eliminarSeguimiento, fetchSeguimientos } from '../api';
import type { Hallazgo, SeguimientoHallazgo } from '../types';
import { SeguimientoFormModal } from './SeguimientoFormModal';

const COLOR_VERIFICACION: Record<SeguimientoHallazgo['verificacion_eficacia'], string> = {
  EFICAZ: 'green',
  PARCIALMENTE_EFICAZ: 'gold',
  INEFICAZ: 'red',
  NO_IMPLEMENTADO: 'default',
};

const NOMBRE_VERIFICACION: Record<SeguimientoHallazgo['verificacion_eficacia'], string> = {
  EFICAZ: 'Eficaz',
  PARCIALMENTE_EFICAZ: 'Parcialmente Eficaz',
  INEFICAZ: 'Ineficaz (No Cumple)',
  NO_IMPLEMENTADO: 'No Implementado',
};

interface Props {
  open: boolean;
  hallazgo: Hallazgo | null;
  onClose: () => void;
}

export function GestionarSeguimientoModal({ open, hallazgo, onClose }: Props) {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const [formAbierto, setFormAbierto] = useState(false);
  const [seguimientoEditando, setSeguimientoEditando] = useState<SeguimientoHallazgo | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['seguimientos', hallazgo?.id],
    queryFn: () => fetchSeguimientos(hallazgo!.id),
    enabled: open && !!hallazgo,
  });

  const eliminarMutation = useMutation({
    mutationFn: eliminarSeguimiento,
    onSuccess: () => {
      message.success('Seguimiento eliminado.');
      queryClient.invalidateQueries({ queryKey: ['seguimientos', hallazgo?.id] });
      queryClient.invalidateQueries({ queryKey: ['hallazgos'] });
    },
    onError: () => message.error('No se pudo eliminar el seguimiento.'),
  });

  function abrirCrear() {
    setSeguimientoEditando(null);
    setFormAbierto(true);
  }

  function abrirEditar(seguimiento: SeguimientoHallazgo) {
    setSeguimientoEditando(seguimiento);
    setFormAbierto(true);
  }

  const columns = [
    {
      title: 'Acción correctiva',
      dataIndex: 'accion_correctiva',
      key: 'accion_correctiva',
      width: 220,
      render: (texto: string) =>
        texto ? (
          <Typography.Text ellipsis={{ tooltip: texto }} style={{ maxWidth: 220, display: 'inline-block' }}>
            {texto}
          </Typography.Text>
        ) : (
          '—'
        ),
    },
    { title: 'Fecha compromiso', dataIndex: 'fecha_compromiso', key: 'fecha_compromiso', width: 120, render: (v: string | null) => v ?? '—' },
    {
      title: 'Responsables',
      dataIndex: 'responsables_nombres',
      key: 'responsables_nombres',
      width: 180,
      render: (nombres: string[]) =>
        nombres.length ? (
          <Space size={[4, 4]} wrap>
            {nombres.map((n) => (
              <Tag key={n}>{n}</Tag>
            ))}
          </Space>
        ) : (
          'Sin asignar'
        ),
    },
    { title: 'Fecha seguimiento', dataIndex: 'fecha_seguimiento', key: 'fecha_seguimiento', width: 120, render: (v: string | null) => v ?? '—' },
    {
      title: 'Avance / Notas',
      dataIndex: 'avance_notas',
      key: 'avance_notas',
      width: 260,
      render: (texto: string) =>
        texto ? (
          <Typography.Text ellipsis={{ tooltip: texto }} style={{ maxWidth: 260, display: 'inline-block' }}>
            {texto}
          </Typography.Text>
        ) : (
          '—'
        ),
    },
    {
      title: 'Verificación de eficacia',
      dataIndex: 'verificacion_eficacia',
      key: 'verificacion_eficacia',
      width: 150,
      render: (v: SeguimientoHallazgo['verificacion_eficacia']) => (
        <Tag color={COLOR_VERIFICACION[v]}>{NOMBRE_VERIFICACION[v]}</Tag>
      ),
    },
    {
      title: 'Evidencias',
      key: 'evidencias',
      width: 100,
      render: (_: unknown, seguimiento: SeguimientoHallazgo) => seguimiento.archivos_adjuntos.length,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 140,
      render: (_: unknown, seguimiento: SeguimientoHallazgo) => (
        <Space>
          {hasPerm('auditorias.change_seguimientohallazgo') && (
            <Button size="small" onClick={() => abrirEditar(seguimiento)}>Editar</Button>
          )}
          {hasPerm('auditorias.delete_seguimientohallazgo') && (
            <Popconfirm
              title="¿Eliminar este seguimiento?"
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              onConfirm={() => eliminarMutation.mutate(seguimiento.id)}
            >
              <Button size="small" danger>Eliminar</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={hallazgo ? `Seguimiento del hallazgo ${hallazgo.codigo}` : 'Seguimiento del hallazgo'}
        open={open}
        onCancel={onClose}
        footer={null}
        width={1300}
        destroyOnHidden
      >
        {hasPerm('auditorias.add_seguimientohallazgo') && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>
              Agregar seguimiento
            </Button>
          </div>
        )}
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.results ?? []}
          pagination={false}
          scroll={{ x: 1290 }}
          locale={{ emptyText: 'Este hallazgo aún no tiene seguimiento registrado.' }}
        />
      </Modal>
      <SeguimientoFormModal
        open={formAbierto}
        hallazgo={hallazgo}
        seguimiento={seguimientoEditando}
        onClose={() => setFormAbierto(false)}
      />
    </>
  );
}
