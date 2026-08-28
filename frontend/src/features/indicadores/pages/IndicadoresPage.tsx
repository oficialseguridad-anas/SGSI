import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { GestionarSeguimientoModal } from '../components/GestionarSeguimientoModal';
import { IndicadorFormModal } from '../components/IndicadorFormModal';
import { eliminarIndicador, fetchIndicadores } from '../api';
import { COLOR_CUMPLIMIENTO, NOMBRE_CUMPLIMIENTO } from '../formula';
import type { FrecuenciaIndicador, Indicador, TipoIndicador } from '../types';

const NOMBRE_TIPO: Record<TipoIndicador, string> = {
  EFICACIA: 'Eficacia',
  CULTURA_RESULTADO: 'Cultura / Resultado',
  PREVENTIVO_OPERATIVO: 'Preventivo / Operativo',
  CONTINUIDAD_OPERATIVO: 'Continuidad / Operativo',
};

const COLOR_TIPO: Record<TipoIndicador, string> = {
  EFICACIA: 'blue',
  CULTURA_RESULTADO: 'purple',
  PREVENTIVO_OPERATIVO: 'gold',
  CONTINUIDAD_OPERATIVO: 'green',
};

const NOMBRE_FRECUENCIA: Record<FrecuenciaIndicador, string> = {
  MENSUAL: 'Mensual',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

export function IndicadoresPage() {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['indicadores'], queryFn: fetchIndicadores });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [indicadorEditando, setIndicadorEditando] = useState<Indicador | null>(null);
  const [seguimientoModalAbierto, setSeguimientoModalAbierto] = useState(false);
  const [indicadorParaSeguimiento, setIndicadorParaSeguimiento] = useState<Indicador | null>(null);

  const eliminarMutation = useMutation({
    mutationFn: eliminarIndicador,
    onSuccess: () => {
      message.success('Indicador eliminado.');
      queryClient.invalidateQueries({ queryKey: ['indicadores'] });
    },
    onError: () => message.error('No se pudo eliminar el indicador.'),
  });

  function abrirCrear() {
    setIndicadorEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(indicador: Indicador) {
    setIndicadorEditando(indicador);
    setModalAbierto(true);
  }

  function abrirSeguimiento(indicador: Indicador) {
    setIndicadorParaSeguimiento(indicador);
    setSeguimientoModalAbierto(true);
  }

  // Recorta texto largo a un par de líneas (en vez de una sola línea muy ancha) y
  // muestra el texto completo en un tooltip al pasar el mouse — aprovecha mejor el
  // espacio vertical de la fila en vez de forzar scroll horizontal en la tabla.
  function textoCompacto(texto: string, filas = 2) {
    if (!texto) return '—';
    return (
      <Typography.Paragraph ellipsis={{ rows: filas, tooltip: { title: texto, placement: 'topLeft' } }} style={{ marginBottom: 0 }}>
        {texto}
      </Typography.Paragraph>
    );
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 60,
      sorter: (a: Indicador, b: Indicador) => a.codigo.localeCompare(b.codigo),
      defaultSortOrder: 'ascend' as const,
      render: (codigo: string) => <strong>{codigo}</strong>,
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 170,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 140,
      filters: Object.entries(NOMBRE_TIPO).map(([value, text]) => ({ text, value })),
      onFilter: (value: unknown, record: Indicador) => record.tipo === value,
      render: (tipo: TipoIndicador) => <Tag color={COLOR_TIPO[tipo]}>{NOMBRE_TIPO[tipo]}</Tag>,
    },
    {
      title: 'Frecuencia',
      dataIndex: 'frecuencia',
      key: 'frecuencia',
      width: 90,
      render: (frecuencia: FrecuenciaIndicador) => NOMBRE_FRECUENCIA[frecuencia],
    },
    {
      title: 'Meta',
      dataIndex: 'meta',
      key: 'meta',
      width: 70,
    },
    {
      title: 'Fórmula',
      dataIndex: 'formula',
      key: 'formula',
      width: 190,
      render: (texto: string) => textoCompacto(texto),
    },
    {
      title: 'Responsable de la medición',
      dataIndex: 'responsable_medicion',
      key: 'responsable_medicion',
      width: 160,
      render: (texto: string) => textoCompacto(texto),
    },
    {
      title: 'Objetivo',
      dataIndex: 'objetivo',
      key: 'objetivo',
      width: 200,
      render: (texto: string) => textoCompacto(texto),
    },
    {
      title: 'Seguimiento',
      key: 'seguimiento',
      width: 140,
      render: (_: unknown, indicador: Indicador) => (
        <Button size="small" onClick={() => abrirSeguimiento(indicador)}>
          {indicador.seguimientos_count > 0
            ? `Gestionar (${indicador.seguimientos_count})`
            : 'Agregar seguimiento'}
        </Button>
      ),
    },
    {
      title: 'Estado de seguimiento',
      key: 'seguimiento_al_dia',
      width: 140,
      filters: [
        { text: 'Seguimiento al día', value: true },
        { text: 'Seguimiento pendiente', value: false },
      ],
      onFilter: (value: unknown, record: Indicador) => record.seguimiento_al_dia === value,
      render: (_: unknown, indicador: Indicador) =>
        indicador.seguimiento_al_dia ? (
          <Tag color="green">Seguimiento al día</Tag>
        ) : (
          <Tag color="red">Seguimiento pendiente</Tag>
        ),
    },
    {
      title: 'Cumplimiento',
      key: 'cumplimiento_actual',
      width: 120,
      filters: [
        { text: 'Cumple', value: 'CUMPLE' },
        { text: 'Por encima', value: 'POR_ENCIMA' },
        { text: 'Por debajo', value: 'POR_DEBAJO' },
      ],
      onFilter: (value: unknown, record: Indicador) => record.cumplimiento_actual === value,
      render: (_: unknown, indicador: Indicador) =>
        indicador.cumplimiento_actual ? (
          <Tag color={COLOR_CUMPLIMIENTO[indicador.cumplimiento_actual]}>
            {NOMBRE_CUMPLIMIENTO[indicador.cumplimiento_actual]}
          </Tag>
        ) : (
          '—'
        ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      render: (_: unknown, indicador: Indicador) => (
        <Space>
          {hasPerm('indicadores.change_indicador') && (
            <Button size="small" onClick={() => abrirEditar(indicador)}>Editar</Button>
          )}
          {hasPerm('indicadores.delete_indicador') && (
            <Popconfirm
              title="¿Eliminar este indicador?"
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              onConfirm={() => eliminarMutation.mutate(indicador.id)}
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
      title="Indicadores del SGSI"
      extra={
        hasPerm('indicadores.add_indicador') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>
            Nuevo indicador
          </Button>
        )
      }
    >
      <ErrorCarga visible={isError} entidad="los indicadores" />
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.results ?? []}
        pagination={false}
        scroll={{ x: 1600 }}
      />
      <IndicadorFormModal open={modalAbierto} indicador={indicadorEditando} onClose={() => setModalAbierto(false)} />
      <GestionarSeguimientoModal
        open={seguimientoModalAbierto}
        indicador={indicadorParaSeguimiento}
        onClose={() => setSeguimientoModalAbierto(false)}
      />
    </Card>
  );
}
