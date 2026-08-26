import { PaperClipOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Popconfirm, Space, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { eliminarSeguimiento, fetchSeguimientos } from '../api';
import { COLOR_CUMPLIMIENTO, NOMBRE_CUMPLIMIENTO } from '../formula';
import type { Indicador, SeguimientoIndicador } from '../types';
import { SeguimientoFormModal } from './SeguimientoFormModal';

interface Props {
  open: boolean;
  indicador: Indicador | null;
  onClose: () => void;
}

export function GestionarSeguimientoModal({ open, indicador, onClose }: Props) {
  const queryClient = useQueryClient();
  const [formAbierto, setFormAbierto] = useState(false);
  const [seguimientoEditando, setSeguimientoEditando] = useState<SeguimientoIndicador | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['seguimientos-indicador', indicador?.id],
    queryFn: () => fetchSeguimientos(indicador!.id),
    enabled: open && !!indicador,
  });

  const eliminarMutation = useMutation({
    mutationFn: eliminarSeguimiento,
    onSuccess: () => {
      message.success('Seguimiento eliminado.');
      queryClient.invalidateQueries({ queryKey: ['seguimientos-indicador', indicador?.id] });
      queryClient.invalidateQueries({ queryKey: ['indicadores'] });
    },
    onError: () => message.error('No se pudo eliminar el seguimiento.'),
  });

  function abrirCrear() {
    setSeguimientoEditando(null);
    setFormAbierto(true);
  }

  function abrirEditar(seguimiento: SeguimientoIndicador) {
    setSeguimientoEditando(seguimiento);
    setFormAbierto(true);
  }

  const columns = [
    { title: 'Periodo', dataIndex: 'periodo', key: 'periodo' },
    { title: 'Fecha de cargue', dataIndex: 'fecha_cargue', key: 'fecha_cargue' },
    {
      title: 'Cumplimiento',
      key: 'cumplimiento',
      render: (_: unknown, seguimiento: SeguimientoIndicador) => {
        if (seguimiento.resultado === null) return '—';
        const resultadoTexto = `${seguimiento.resultado}${seguimiento.indicador_unidad_medida?.startsWith('%') ? '%' : ''}`;
        const desglose =
          seguimiento.numerador !== null && seguimiento.denominador !== null
            ? `${seguimiento.numerador} / ${seguimiento.denominador} = `
            : '';
        return (
          <span>
            {desglose}
            {resultadoTexto}
            <br />
            {seguimiento.estado_cumplimiento && (
              <Tag color={COLOR_CUMPLIMIENTO[seguimiento.estado_cumplimiento]}>
                {NOMBRE_CUMPLIMIENTO[seguimiento.estado_cumplimiento]}
              </Tag>
            )}
            <span style={{ color: '#898781', fontSize: 12, marginLeft: 4 }}>
              (Meta: {seguimiento.indicador_meta || '—'})
            </span>
          </span>
        );
      },
    },
    { title: 'Observaciones', dataIndex: 'observaciones', key: 'observaciones' },
    {
      title: 'Archivo soporte',
      dataIndex: 'archivo_soporte',
      key: 'archivo_soporte',
      render: (archivo: string | null) =>
        archivo ? (
          <a href={archivo} target="_blank" rel="noreferrer">
            <PaperClipOutlined /> Ver archivo
          </a>
        ) : (
          '—'
        ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_: unknown, seguimiento: SeguimientoIndicador) => (
        <Space>
          <Button size="small" onClick={() => abrirEditar(seguimiento)}>Editar</Button>
          <Popconfirm
            title="¿Eliminar este seguimiento?"
            okText="Eliminar"
            okButtonProps={{ danger: true }}
            onConfirm={() => eliminarMutation.mutate(seguimiento.id)}
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
        title={indicador ? `Seguimiento del indicador ${indicador.codigo}` : 'Seguimiento del indicador'}
        open={open}
        onCancel={onClose}
        footer={null}
        width={1100}
        destroyOnHidden
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>
            Agregar seguimiento
          </Button>
        </div>
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.results ?? []}
          pagination={false}
          locale={{ emptyText: 'Este indicador aún no tiene seguimiento registrado.' }}
        />
      </Modal>
      <SeguimientoFormModal
        open={formAbierto}
        indicador={indicador}
        seguimiento={seguimientoEditando}
        onClose={() => setFormAbierto(false)}
      />
    </>
  );
}
