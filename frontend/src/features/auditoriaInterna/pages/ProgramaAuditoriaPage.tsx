import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Empty, InputNumber, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { crearAuditoriaDesdePrograma, eliminarProgramaAuditoria, fetchProgramaAuditoria } from '../api';
import { ProgramaAuditoriaFormModal } from '../components/ProgramaAuditoriaFormModal';
import type { ProgramaAuditoria } from '../types';

export function ProgramaAuditoriaPage() {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // Sin filtro de año en el servidor: se trae todo y se decide qué año mostrar aquí —
  // igual que en la Matriz de Priorización, para no esconder por defecto filas de un
  // año que no coincide con el año actual del calendario.
  const [anio, setAnio] = useState<number | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filaEditando, setFilaEditando] = useState<ProgramaAuditoria | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['programa-auditoria'],
    queryFn: () => fetchProgramaAuditoria(),
  });

  const todasLasFilas = data?.results ?? [];
  const aniosConDatos = useMemo(
    () => Array.from(new Set(todasLasFilas.map((f) => f.anio))).sort((a, b) => b - a),
    [todasLasFilas],
  );

  useEffect(() => {
    if (anio !== null || !data) return;
    setAnio(aniosConDatos[0] ?? new Date().getFullYear());
  }, [anio, data, aniosConDatos]);

  const eliminarMutation = useMutation({
    mutationFn: eliminarProgramaAuditoria,
    onSuccess: () => {
      message.success('Fila eliminada.');
      queryClient.invalidateQueries({ queryKey: ['programa-auditoria'] });
    },
    onError: () => message.error('No se pudo eliminar.'),
  });

  const crearAuditoriaMutation = useMutation({
    mutationFn: crearAuditoriaDesdePrograma,
    onSuccess: (auditoria) => {
      message.success(`Auditoría ${auditoria.codigo} creada.`);
      queryClient.invalidateQueries({ queryKey: ['programa-auditoria'] });
      navigate(`/auditorias?abrir=${auditoria.id}`);
    },
    onError: () => message.error('No se pudo crear la auditoría.'),
  });

  const filas = useMemo(() => todasLasFilas.filter((f) => f.anio === anio), [todasLasFilas, anio]);

  function abrirCrear() {
    setFilaEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(fila: ProgramaAuditoria) {
    setFilaEditando(fila);
    setModalAbierto(true);
  }

  const columns = [
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', width: 90, render: (t: string) => <Tag>{t === 'INTERNA' ? 'Interna' : 'Externa'}</Tag> },
    {
      title: 'Proceso / Auditado',
      key: 'objetivo',
      render: (_: unknown, fila: ProgramaAuditoria) => fila.proceso_nombre ?? fila.auditado ?? '—',
    },
    { title: 'Procedimiento', dataIndex: 'procedimiento', key: 'procedimiento', render: (v: string) => v || '—' },
    { title: 'Auditor líder', dataIndex: 'auditor_lider_nombre', key: 'auditor_lider_nombre', render: (v: string) => v || 'Por definir' },
    { title: 'Mes planeado', dataIndex: 'mes_planeado_display', key: 'mes_planeado_display', render: (v: string) => v || '—' },
    {
      title: 'Auditoría',
      key: 'auditoria',
      width: 160,
      render: (_: unknown, fila: ProgramaAuditoria) =>
        fila.tiene_auditoria ? (
          <Tag color="blue">Ya creada</Tag>
        ) : (
          hasPerm('auditorias.add_auditoria') && (
            <Button size="small" type="primary" loading={crearAuditoriaMutation.isPending} onClick={() => crearAuditoriaMutation.mutate(fila.id)}>
              Crear auditoría
            </Button>
          )
        ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 160,
      render: (_: unknown, fila: ProgramaAuditoria) => (
        <Space>
          {hasPerm('auditorias.change_programaauditoria') && (
            <Button size="small" onClick={() => abrirEditar(fila)}>Editar</Button>
          )}
          {hasPerm('auditorias.delete_programaauditoria') && (
            <Popconfirm title="¿Eliminar esta fila?" okText="Eliminar" okButtonProps={{ danger: true }} onConfirm={() => eliminarMutation.mutate(fila.id)}>
              <Button size="small" danger>Eliminar</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Programa Anual de Auditorías"
      extra={
        <Space>
          <Typography.Text type="secondary">Año:</Typography.Text>
          <InputNumber min={2020} max={2100} value={anio ?? new Date().getFullYear()} onChange={(v) => setAnio(v ?? new Date().getFullYear())} />
          {hasPerm('auditorias.add_programaauditoria') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Nueva fila</Button>
          )}
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">
        Qué proceso se audita, en qué mes y con qué auditor líder (FO-860-23). Cuando
        llegue el momento de ejecutar una fila, usa "Crear auditoría" para generar su
        Plan de Auditoría (FO-860-24) en el módulo de Auditorías.
      </Typography.Paragraph>
      <ErrorCarga visible={isError} entidad="el programa de auditorías" />
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={filas}
        pagination={false}
        scroll={{ x: 1000 }}
        locale={{ emptyText: <Empty description={`Sin filas registradas para ${anio}.`} /> }}
      />
      <ProgramaAuditoriaFormModal open={modalAbierto} fila={filaEditando} anio={anio ?? new Date().getFullYear()} onClose={() => setModalAbierto(false)} />
    </Card>
  );
}
