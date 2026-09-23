import { DownloadOutlined, FileExcelOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Empty, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import {
  descargarInformeAuditoriaXlsx,
  descargarPlantillaInformeAuditoria,
  descargarPlantillaPlanAuditoria,
  eliminarAuditoria,
  fetchAuditorias,
} from '../api';
import { AuditoriaDetalleDrawer } from '../components/AuditoriaDetalleDrawer';
import { NuevaAuditoriaExtraordinariaModal } from '../components/NuevaAuditoriaExtraordinariaModal';
import type { Auditoria } from '../types';

const ETIQUETA_ESTADO: Record<string, string> = {
  PLANIFICADA: 'Planificada',
  EN_EJECUCION: 'En ejecución',
  CERRADA: 'Cerrada',
};
const COLOR_ESTADO: Record<string, string> = {
  PLANIFICADA: 'default',
  EN_EJECUCION: 'blue',
  CERRADA: 'green',
};

export function AuditoriasPage() {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [auditoriaAbiertaId, setAuditoriaAbiertaId] = useState<number | null>(null);
  const [modalNuevaAbierto, setModalNuevaAbierto] = useState(false);

  const { data, isLoading, isError } = useQuery({ queryKey: ['auditorias'], queryFn: () => fetchAuditorias() });

  const eliminarMutation = useMutation({
    mutationFn: eliminarAuditoria,
    onSuccess: () => {
      message.success('Auditoría eliminada.');
      queryClient.invalidateQueries({ queryKey: ['auditorias'] });
      queryClient.invalidateQueries({ queryKey: ['programa-auditoria'] });
    },
    onError: () => message.error('No se pudo eliminar — si ya está cerrada, solo un administrador puede hacerlo.'),
  });

  useEffect(() => {
    const abrir = searchParams.get('abrir');
    if (abrir) {
      setAuditoriaAbiertaId(Number(abrir));
      searchParams.delete('abrir');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const auditorias = data?.results ?? [];

  async function descargarXlsx(auditoria: Auditoria) {
    try {
      await descargarInformeAuditoriaXlsx(auditoria.id, auditoria.codigo);
    } catch {
      message.error('No se pudo descargar el informe en Excel.');
    }
  }

  async function descargarPlantillaPlan() {
    try {
      await descargarPlantillaPlanAuditoria();
    } catch {
      message.error('No se pudo descargar la plantilla del plan.');
    }
  }

  async function descargarPlantillaInforme() {
    try {
      await descargarPlantillaInformeAuditoria();
    } catch {
      message.error('No se pudo descargar la plantilla del informe.');
    }
  }

  const columns = [
    { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 140, render: (c: string) => <strong>{c}</strong> },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', width: 120, render: (t: string) => (t === 'ORDINARIA' ? 'Ordinaria' : 'Extraordinaria') },
    {
      title: 'Origen (programa)',
      dataIndex: 'programa_descripcion',
      key: 'programa_descripcion',
      render: (v: string | null) => (v ? <Tag color="geekblue">{v}</Tag> : <Tag>Sin programa</Tag>),
    },
    {
      title: 'Proceso(s)',
      dataIndex: 'procesos_auditados_nombres',
      key: 'procesos_auditados_nombres',
      render: (nombres: string[]) => (nombres.length ? nombres.join(', ') : '—'),
    },
    { title: 'Auditor líder', dataIndex: 'auditor_lider_nombre', key: 'auditor_lider_nombre', render: (v: string) => v || 'Por definir' },
    { title: 'Fecha', dataIndex: 'fecha_auditoria', key: 'fecha_auditoria', width: 120, render: (v: string) => v || '—' },
    { title: 'Hallazgos', dataIndex: 'total_hallazgos', key: 'total_hallazgos', width: 100 },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 130,
      render: (estado: string) => <Tag color={COLOR_ESTADO[estado]}>{ETIQUETA_ESTADO[estado]}</Tag>,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 220,
      render: (_: unknown, auditoria: Auditoria) => (
        <Space>
          <Button size="small" onClick={() => setAuditoriaAbiertaId(auditoria.id)}>Abrir</Button>
          {auditoria.estado === 'CERRADA' && (
            <Button size="small" icon={<DownloadOutlined />} onClick={() => descargarXlsx(auditoria)}>Excel</Button>
          )}
          {hasPerm('auditorias.delete_auditoria') && (
            <Popconfirm
              title="¿Eliminar esta auditoría?"
              description="Se borran también su plan, cronograma y checklist. Los hallazgos ya generados no se eliminan."
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              onConfirm={() => eliminarMutation.mutate(auditoria.id)}
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
      title="Auditorías"
      extra={
        <Space wrap>
          <Button icon={<FileExcelOutlined />} onClick={descargarPlantillaPlan}>
            Plantilla Plan (FO-860-24)
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={descargarPlantillaInforme}>
            Plantilla Informe (FO-860-22)
          </Button>
          {hasPerm('auditorias.add_auditoria') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalNuevaAbierto(true)}>
              Auditoría extraordinaria
            </Button>
          )}
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">
        Plan de auditoría (FO-860-24), cronograma, lista de verificación (FO-860-25) e
        informe final (FO-860-22) de cada auditoría — ordinarias creadas desde el
        Programa Anual (columna "Origen"), o extraordinarias creadas directamente aquí.
      </Typography.Paragraph>
      <ErrorCarga visible={isError} entidad="las auditorías" />
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={auditorias}
        pagination={false}
        scroll={{ x: 1300 }}
        locale={{ emptyText: <Empty description="Todavía no se ha creado ninguna auditoría." /> }}
      />
      <NuevaAuditoriaExtraordinariaModal
        open={modalNuevaAbierto}
        onClose={() => setModalNuevaAbierto(false)}
        onCreada={(id) => setAuditoriaAbiertaId(id)}
      />
      <AuditoriaDetalleDrawer auditoriaId={auditoriaAbiertaId} onClose={() => setAuditoriaAbiertaId(null)} />
    </Card>
  );
}
