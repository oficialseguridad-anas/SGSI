import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Empty, InputNumber, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { eliminarMatrizPriorizacion, fetchMatrizPriorizacion } from '../api';
import { MatrizPriorizacionFormModal } from '../components/MatrizPriorizacionFormModal';
import type { MatrizPriorizacionAuditoria } from '../types';

const COLOR_PRIORIDAD: Record<string, string> = { ALTA: 'red', MEDIA: 'gold', BAJA: 'green' };

export function MatrizPriorizacionPage() {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  // Sin filtro de año en el servidor: se trae todo y se decide qué año mostrar aquí —
  // así, si el año actual del calendario no tiene datos todavía (ej. la matriz real
  // que cargó el usuario es de 2025 y ya estamos en 2026), la página no se ve vacía
  // por defecto: cae automáticamente al año más reciente que sí tiene información.
  const [anio, setAnio] = useState<number | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filaEditando, setFilaEditando] = useState<MatrizPriorizacionAuditoria | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['matriz-priorizacion'],
    queryFn: () => fetchMatrizPriorizacion(),
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
    mutationFn: eliminarMatrizPriorizacion,
    onSuccess: () => {
      message.success('Fila eliminada.');
      queryClient.invalidateQueries({ queryKey: ['matriz-priorizacion'] });
    },
    onError: () => message.error('No se pudo eliminar.'),
  });

  const filas = useMemo(() => todasLasFilas.filter((f) => f.anio === anio), [todasLasFilas, anio]);

  function abrirCrear() {
    setFilaEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(fila: MatrizPriorizacionAuditoria) {
    setFilaEditando(fila);
    setModalAbierto(true);
  }

  const columns = [
    { title: 'Proceso / Área', dataIndex: 'proceso_nombre', key: 'proceso_nombre' },
    { title: 'Criticidad', dataIndex: 'criticidad', key: 'criticidad', width: 90 },
    { title: 'Aud. previas', dataIndex: 'auditorias_previas', key: 'auditorias_previas', width: 90 },
    { title: 'Cambios', dataIndex: 'cambios', key: 'cambios', width: 90 },
    { title: 'Incidentes', dataIndex: 'incidentes', key: 'incidentes', width: 90 },
    { title: 'Legales', dataIndex: 'legales', key: 'legales', width: 90 },
    { title: 'Relevancia', dataIndex: 'relevancia', key: 'relevancia', width: 90 },
    { title: 'Riesgo residual', dataIndex: 'riesgo_residual', key: 'riesgo_residual', width: 110 },
    {
      title: 'Puntaje',
      dataIndex: 'puntaje_final',
      key: 'puntaje_final',
      width: 90,
      sorter: (a: MatrizPriorizacionAuditoria, b: MatrizPriorizacionAuditoria) => a.puntaje_final - b.puntaje_final,
      defaultSortOrder: 'descend' as const,
      render: (v: number) => <strong>{v}</strong>,
    },
    {
      title: 'Prioridad',
      dataIndex: 'prioridad',
      key: 'prioridad',
      width: 100,
      render: (p: string) => <Tag color={COLOR_PRIORIDAD[p]}>{p}</Tag>,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 160,
      render: (_: unknown, fila: MatrizPriorizacionAuditoria) => (
        <Space>
          {hasPerm('auditorias.change_matrizpriorizacionauditoria') && (
            <Button size="small" onClick={() => abrirEditar(fila)}>Editar</Button>
          )}
          {hasPerm('auditorias.delete_matrizpriorizacionauditoria') && (
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
      title="Matriz de Priorización de Auditorías"
      extra={
        <Space>
          <Typography.Text type="secondary">Año:</Typography.Text>
          <InputNumber min={2020} max={2100} value={anio ?? new Date().getFullYear()} onChange={(v) => setAnio(v ?? new Date().getFullYear())} />
          {hasPerm('auditorias.add_matrizpriorizacionauditoria') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Calificar proceso</Button>
          )}
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">
        Calificación de 1 a 5 de cada proceso frente a 7 criterios (MT-860-05), con la
        fórmula ponderada institucional (20% criticidad, 15% auditorías previas, 15%
        cambios, 20% incidentes, 10% legales, 10% relevancia, 10% riesgo residual) para
        decidir qué procesos auditar primero en el programa anual.
      </Typography.Paragraph>
      <ErrorCarga visible={isError} entidad="la matriz de priorización" />
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={filas}
        pagination={false}
        scroll={{ x: 1100 }}
        locale={{ emptyText: <Empty description={`Sin calificaciones registradas para ${anio}.`} /> }}
      />
      <MatrizPriorizacionFormModal open={modalAbierto} fila={filaEditando} anio={anio ?? new Date().getFullYear()} onClose={() => setModalAbierto(false)} />
    </Card>
  );
}
