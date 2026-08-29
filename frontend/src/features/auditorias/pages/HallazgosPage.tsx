import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { GestionarSeguimientoModal } from '../components/GestionarSeguimientoModal';
import { HallazgoFormModal } from '../components/HallazgoFormModal';
import { eliminarHallazgo, fetchHallazgos } from '../api';
import { COLOR_ESTADO_HALLAZGO, NOMBRE_ESTADO_HALLAZGO, TEXTO_ESTADO_HALLAZGO } from '../estadoHallazgo';
import { NOMBRE_TIPO_HALLAZGO } from '../tipoHallazgo';
import type { Hallazgo } from '../types';

// Mismo patrón que Objetivos/Indicadores: recorta el texto a N líneas y muestra el
// contenido completo en un tooltip al pasar el mouse, en vez de romper el layout de la
// tabla con celdas de alto variable o forzar scroll horizontal excesivo.
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

export function HallazgosPage() {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['hallazgos'], queryFn: fetchHallazgos });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [hallazgoEditando, setHallazgoEditando] = useState<Hallazgo | null>(null);
  const [seguimientoModalAbierto, setSeguimientoModalAbierto] = useState(false);
  const [hallazgoParaSeguimiento, setHallazgoParaSeguimiento] = useState<Hallazgo | null>(null);

  const eliminarMutation = useMutation({
    mutationFn: eliminarHallazgo,
    onSuccess: () => {
      message.success('Hallazgo eliminado.');
      queryClient.invalidateQueries({ queryKey: ['hallazgos'] });
    },
    onError: () => message.error('No se pudo eliminar el hallazgo.'),
  });

  function abrirCrear() {
    setHallazgoEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(hallazgo: Hallazgo) {
    setHallazgoEditando(hallazgo);
    setModalAbierto(true);
  }

  function abrirSeguimiento(hallazgo: Hallazgo) {
    setHallazgoParaSeguimiento(hallazgo);
    setSeguimientoModalAbierto(true);
  }

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 90,
      sorter: (a: Hallazgo, b: Hallazgo) => a.codigo.localeCompare(b.codigo),
      render: (codigo: string) => <strong>{codigo}</strong>,
    },
    {
      title: 'Fecha detección',
      dataIndex: 'fecha_deteccion',
      key: 'fecha_deteccion',
      width: 110,
      sorter: (a: Hallazgo, b: Hallazgo) => a.fecha_deteccion.localeCompare(b.fecha_deteccion),
    },
    {
      title: 'Proceso',
      dataIndex: 'procesos_nombres',
      key: 'procesos_nombres',
      width: 180,
      render: (nombres: string[]) => (
        <Space size={[4, 4]} wrap>
          {nombres.map((n) => (
            <Tag key={n}>{n}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Tipo',
      key: 'tipos',
      width: 130,
      render: (_: unknown, hallazgo: Hallazgo) => (
        <Space size={[4, 4]} wrap>
          {hallazgo.tipos_codigos.map((codigo, i) => (
            <Tag key={codigo}>{NOMBRE_TIPO_HALLAZGO[codigo] ?? hallazgo.tipos_nombres[i]}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      width: 260,
      render: (texto: string) => textoCompacto(texto, 3, 260),
    },
    {
      title: 'Evidencia asociada',
      dataIndex: 'evidencia_asociada',
      key: 'evidencia_asociada',
      width: 180,
      render: (texto: string) => textoCompacto(texto, 3, 180),
    },
    {
      title: 'Requisito incumplido',
      key: 'requisito_incumplido',
      width: 220,
      render: (_: unknown, hallazgo: Hallazgo) =>
        hallazgo.controles_codigos.length || hallazgo.numerales_codigos.length ? (
          <Space size={[4, 4]} wrap>
            {hallazgo.controles_codigos.map((c) => (
              <Tag key={`c-${c}`}>{c}</Tag>
            ))}
            {hallazgo.numerales_codigos.map((n) => (
              <Tag key={`n-${n}`} color="blue">
                N.{n}
              </Tag>
            ))}
          </Space>
        ) : (
          '—'
        ),
    },
    {
      title: 'Análisis de causa',
      dataIndex: 'analisis_causa',
      key: 'analisis_causa',
      width: 260,
      render: (texto: string) => textoCompacto(texto, 3, 260),
    },
    {
      title: 'Seguimiento',
      key: 'seguimiento',
      width: 170,
      render: (_: unknown, hallazgo: Hallazgo) => (
        <Button size="small" onClick={() => abrirSeguimiento(hallazgo)}>
          {hallazgo.seguimientos.length > 0
            ? `Gestionar (${hallazgo.seguimientos.length})`
            : 'Agregar seguimiento'}
        </Button>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 110,
      render: (estado: Hallazgo['estado']) => (
        <Tag color={COLOR_ESTADO_HALLAZGO[estado]} style={{ color: TEXTO_ESTADO_HALLAZGO[estado], borderColor: 'transparent' }}>
          {NOMBRE_ESTADO_HALLAZGO[estado]}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 140,
      render: (_: unknown, hallazgo: Hallazgo) => (
        <Space>
          {hasPerm('auditorias.change_hallazgo') && (
            <Button size="small" onClick={() => abrirEditar(hallazgo)}>Editar</Button>
          )}
          {hasPerm('auditorias.delete_hallazgo') && (
            <Popconfirm
              title="¿Eliminar este hallazgo?"
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              onConfirm={() => eliminarMutation.mutate(hallazgo.id)}
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
      title="Hallazgos de auditoría"
      extra={
        hasPerm('auditorias.add_hallazgo') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Nuevo hallazgo</Button>
        )
      }
    >
      <ErrorCarga visible={isError} entidad="los hallazgos" />
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.results ?? []}
        pagination={false}
        scroll={{ x: 1850 }}
      />
      <HallazgoFormModal open={modalAbierto} hallazgo={hallazgoEditando} onClose={() => setModalAbierto(false)} />
      <GestionarSeguimientoModal
        open={seguimientoModalAbierto}
        hallazgo={hallazgoParaSeguimiento}
        onClose={() => setSeguimientoModalAbierto(false)}
      />
    </Card>
  );
}
