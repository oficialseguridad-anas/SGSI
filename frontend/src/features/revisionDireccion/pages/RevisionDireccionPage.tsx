import { DownloadOutlined, LockOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Empty, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { descargarActaDocx, eliminarRevisionDireccion, fetchRevisionesDireccion } from '../api';
import { DetalleRevisionDireccionDrawer } from '../components/DetalleRevisionDireccionDrawer';
import { NuevaRevisionDireccionModal } from '../components/NuevaRevisionDireccionModal';
import type { RevisionDireccion } from '../types';

export function RevisionDireccionPage() {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['revisiones-direccion'],
    queryFn: fetchRevisionesDireccion,
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [revisionAbiertaId, setRevisionAbiertaId] = useState<number | null>(null);

  const eliminarMutation = useMutation({
    mutationFn: eliminarRevisionDireccion,
    onSuccess: () => {
      message.success('Revisión eliminada.');
      queryClient.invalidateQueries({ queryKey: ['revisiones-direccion'] });
    },
    onError: () => message.error('No se pudo eliminar la revisión.'),
  });

  const revisiones = data?.results ?? [];

  async function descargarDocx(revision: RevisionDireccion) {
    try {
      await descargarActaDocx(revision.id, revision.periodo);
    } catch {
      message.error('No se pudo descargar el documento del acta.');
    }
  }

  const columns = [
    { title: 'Periodo', dataIndex: 'periodo', key: 'periodo', width: 140, render: (p: string) => <strong>{p}</strong> },
    { title: 'Fecha de revisión', dataIndex: 'fecha_revision', key: 'fecha_revision', width: 140 },
    { title: 'Preside', dataIndex: 'preside_nombre', key: 'preside_nombre', width: 200 },
    {
      title: 'Compromisos',
      key: 'compromisos',
      width: 180,
      render: (_: unknown, revision: RevisionDireccion) => {
        const total = revision.compromisos.length;
        const completados = revision.compromisos.filter((c) => c.estado === 'COMPLETADO').length;
        const vencidos = revision.compromisos.filter((c) => c.esta_vencido).length;
        return total === 0 ? (
          '—'
        ) : (
          <Space size={4} wrap>
            <Tag color="blue">{completados}/{total} completados</Tag>
            {vencidos > 0 && <Tag color="red">{vencidos} vencidos</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Estado',
      key: 'estado',
      width: 130,
      render: (_: unknown, revision: RevisionDireccion) =>
        revision.finalizada ? (
          <Tag icon={<LockOutlined />} color="gold">Finalizada</Tag>
        ) : (
          <Tag color="default">Borrador</Tag>
        ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 240,
      render: (_: unknown, revision: RevisionDireccion) => (
        <Space>
          <Button size="small" onClick={() => setRevisionAbiertaId(revision.id)}>Abrir</Button>
          {revision.finalizada && (
            <Button size="small" icon={<DownloadOutlined />} onClick={() => descargarDocx(revision)}>
              Word
            </Button>
          )}
          {hasPerm('revisiones.delete_revisiondireccion') && (
            <Popconfirm
              title="¿Eliminar esta revisión y sus compromisos?"
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              onConfirm={() => eliminarMutation.mutate(revision.id)}
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
      title="Revisión por la Dirección"
      extra={
        hasPerm('revisiones.add_revisiondireccion') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalAbierto(true)}>
            Nueva revisión
          </Button>
        )
      }
    >
      <Typography.Paragraph type="secondary">
        Acta de revisión del SGSI por la Alta Dirección, con las entradas y salidas que
        exige la cláusula 9.3 de ISO/IEC 27001:2022 — apoyada con cifras reales de
        Riesgos, Hallazgos, Objetivos, Indicadores e Incidentes.
      </Typography.Paragraph>
      <ErrorCarga visible={isError} entidad="las revisiones por la dirección" />
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={revisiones}
        pagination={false}
        scroll={{ x: 960 }}
        locale={{ emptyText: <Empty description="Todavía no se ha registrado ninguna revisión por la dirección." /> }}
      />
      <NuevaRevisionDireccionModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onCreada={(id) => setRevisionAbiertaId(id)}
      />
      <DetalleRevisionDireccionDrawer
        revisionId={revisionAbiertaId}
        onClose={() => setRevisionAbiertaId(null)}
      />
    </Card>
  );
}
