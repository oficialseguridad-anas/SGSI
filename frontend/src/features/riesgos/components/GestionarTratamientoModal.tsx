import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { eliminarTratamiento, fetchTratamientos } from '../api';
import { COLOR_NIVEL_RIESGO, NOMBRE_NIVEL_RIESGO, TEXTO_NIVEL_RIESGO } from '../nivelRiesgo';
import type { Riesgo, TratamientoRiesgo } from '../types';
import { TratamientoFormModal } from './TratamientoFormModal';

const NOMBRE_OPCION: Record<TratamientoRiesgo['opcion'], string> = {
  MITIGAR: 'Mitigar',
  TRANSFERIR: 'Transferir',
  EVITAR: 'Evitar',
  ACEPTAR: 'Aceptar',
};

const COLOR_ESTADO: Record<TratamientoRiesgo['estado'], string> = {
  PENDIENTE: 'default',
  EN_PROGRESO: 'blue',
  COMPLETADO: 'green',
  VENCIDO: 'red',
};

const NOMBRE_ESTADO: Record<TratamientoRiesgo['estado'], string> = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En progreso',
  COMPLETADO: 'Completado',
  VENCIDO: 'Vencido',
};

interface Props {
  open: boolean;
  riesgo: Riesgo | null;
  onClose: () => void;
}

export function GestionarTratamientoModal({ open, riesgo, onClose }: Props) {
  const queryClient = useQueryClient();
  const [formAbierto, setFormAbierto] = useState(false);
  const [tratamientoEditando, setTratamientoEditando] = useState<TratamientoRiesgo | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tratamientos', riesgo?.id],
    queryFn: () => fetchTratamientos(riesgo!.id),
    enabled: open && !!riesgo,
  });

  const eliminarMutation = useMutation({
    mutationFn: eliminarTratamiento,
    onSuccess: () => {
      message.success('Tratamiento eliminado.');
      queryClient.invalidateQueries({ queryKey: ['tratamientos', riesgo?.id] });
      queryClient.invalidateQueries({ queryKey: ['riesgos'] });
    },
    onError: () => message.error('No se pudo eliminar el tratamiento.'),
  });

  function abrirCrear() {
    setTratamientoEditando(null);
    setFormAbierto(true);
  }

  function abrirEditar(tratamiento: TratamientoRiesgo) {
    setTratamientoEditando(tratamiento);
    setFormAbierto(true);
  }

  const columns = [
    {
      title: 'Opción',
      dataIndex: 'opcion',
      key: 'opcion',
      width: 100,
      render: (opcion: TratamientoRiesgo['opcion']) => NOMBRE_OPCION[opcion],
    },
    {
      title: 'Acción de mitigación',
      dataIndex: 'accion_mitigacion',
      key: 'accion_mitigacion',
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
    { title: 'Responsable', dataIndex: 'responsable_nombre', key: 'responsable_nombre', width: 160 },
    { title: 'Fecha límite', dataIndex: 'fecha_limite', key: 'fecha_limite', width: 110 },
    {
      title: 'Riesgo residual',
      dataIndex: 'riesgo_residual',
      key: 'riesgo_residual',
      width: 110,
      render: (valor: number | null) => valor ?? '—',
    },
    {
      title: 'Nivel de riesgo residual',
      dataIndex: 'nivel_de_riesgo_residual',
      key: 'nivel_de_riesgo_residual',
      width: 150,
      render: (nivel: TratamientoRiesgo['nivel_de_riesgo_residual']) =>
        nivel ? (
          <Tag color={COLOR_NIVEL_RIESGO[nivel]} style={{ color: TEXTO_NIVEL_RIESGO[nivel], borderColor: 'transparent' }}>
            {NOMBRE_NIVEL_RIESGO[nivel]}
          </Tag>
        ) : (
          '—'
        ),
    },
    {
      title: 'Evidencias esperadas',
      dataIndex: 'evidencias_esperadas',
      key: 'evidencias_esperadas',
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
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 110,
      render: (estado: TratamientoRiesgo['estado']) => <Tag color={COLOR_ESTADO[estado]}>{NOMBRE_ESTADO[estado]}</Tag>,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 140,
      render: (_: unknown, tratamiento: TratamientoRiesgo) => (
        <Space>
          <Button size="small" onClick={() => abrirEditar(tratamiento)}>Editar</Button>
          <Popconfirm
            title="¿Eliminar este tratamiento?"
            okText="Eliminar"
            okButtonProps={{ danger: true }}
            onConfirm={() => eliminarMutation.mutate(tratamiento.id)}
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
        title={riesgo ? `Tratamiento del riesgo ${riesgo.codigo}` : 'Tratamiento del riesgo'}
        open={open}
        onCancel={onClose}
        footer={null}
        width={1300}
        destroyOnHidden
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>
            Agregar tratamiento
          </Button>
        </div>
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.results ?? []}
          pagination={false}
          scroll={{ x: 1350 }}
          locale={{ emptyText: 'Este riesgo aún no tiene tratamiento registrado.' }}
        />
      </Modal>
      <TratamientoFormModal
        open={formAbierto}
        riesgo={riesgo}
        tratamiento={tratamientoEditando}
        onClose={() => setFormAbierto(false)}
      />
    </>
  );
}
