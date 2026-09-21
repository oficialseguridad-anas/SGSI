import { LockOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Popconfirm, Space, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { ChecklistAnexoAModal } from '../components/ChecklistAnexoAModal';
import { EncabezadoRevisionAnexoA } from '../components/EncabezadoRevisionAnexoA';
import { RevisionAnexoAFormModal } from '../components/RevisionAnexoAFormModal';
import { TablaCriteriosResultado } from '../components/TablaCriteriosResultado';
import type { ConfiguracionCategoriaAnexoA } from '../configCategorias';
import type { RevisionAnexoA } from '../types';

interface Props {
  config: ConfiguracionCategoriaAnexoA;
}

// Página genérica de seguimiento/checklist para las 3 categorías nuevas del Anexo A
// (Organizacionales, Físicos, Tecnológicos) — mismo flujo que SeguimientoPersonasPage,
// parametrizado por `config` (título, rango de controles, etiqueta del responsable y
// funciones de API) en vez de triplicar el componente.
export function SeguimientoCategoriaPage({ config }: Props) {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: [config.queryKeyRevisiones],
    queryFn: config.api.fetchRevisiones,
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [revisionEditando, setRevisionEditando] = useState<RevisionAnexoA | null>(null);
  const [checklistAbierto, setChecklistAbierto] = useState(false);
  const [revisionParaChecklist, setRevisionParaChecklist] = useState<RevisionAnexoA | null>(null);

  const eliminarMutation = useMutation({
    mutationFn: config.api.eliminarRevision,
    onSuccess: () => {
      message.success('Revisión eliminada.');
      queryClient.invalidateQueries({ queryKey: [config.queryKeyRevisiones] });
    },
    onError: () => message.error('No se pudo eliminar la revisión.'),
  });

  function abrirCrear() {
    setRevisionEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(revision: RevisionAnexoA) {
    setRevisionEditando(revision);
    setModalAbierto(true);
  }

  function abrirChecklist(revision: RevisionAnexoA) {
    setRevisionParaChecklist(revision);
    setChecklistAbierto(true);
  }

  const columns = [
    { title: 'Fecha de revisión', dataIndex: 'fecha_revision', key: 'fecha_revision', width: 130 },
    { title: 'Revisor / Oficial de Seguridad', dataIndex: 'revisor_nombre', key: 'revisor_nombre', width: 200 },
    { title: config.responsableLabel, dataIndex: 'responsable_nombre', key: 'responsable_nombre', width: 200 },
    {
      title: 'Muestra seleccionada',
      dataIndex: 'muestra_seleccionada',
      key: 'muestra_seleccionada',
      render: (t: string) => t || '—',
    },
    {
      title: '% Cumplimiento',
      dataIndex: 'porcentaje_general',
      key: 'porcentaje_general',
      width: 130,
      render: (porcentaje: number | null) =>
        porcentaje === null ? (
          '—'
        ) : (
          <Tag color={porcentaje >= 80 ? 'green' : porcentaje >= 50 ? 'gold' : 'red'}>{porcentaje}%</Tag>
        ),
    },
    {
      title: 'Checklist',
      key: 'checklist',
      width: 170,
      render: (_: unknown, revision: RevisionAnexoA) => (
        <Space>
          <Button size="small" onClick={() => abrirChecklist(revision)}>
            Abrir
          </Button>
          {revision.finalizada && (
            <Tag icon={<LockOutlined />} color="gold">
              Finalizado
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 140,
      render: (_: unknown, revision: RevisionAnexoA) => (
        <Space>
          {hasPerm(`revisiones.change_${config.permisoModelo}`) && (
            <Button size="small" onClick={() => abrirEditar(revision)}>Editar</Button>
          )}
          {hasPerm(`revisiones.delete_${config.permisoModelo}`) && (
            <Popconfirm
              title="¿Eliminar esta revisión?"
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
    <div>
      <Card style={{ marginBottom: 16 }}>
        <EncabezadoRevisionAnexoA titulo={config.titulo} rangoControles={config.rangoControles} />
        <TablaCriteriosResultado />
      </Card>

      <Card
        title="Revisiones registradas"
        extra={
          hasPerm(`revisiones.add_${config.permisoModelo}`) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>
              Nueva revisión
            </Button>
          )
        }
      >
        <ErrorCarga visible={isError} entidad="las revisiones" />
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.results ?? []}
          pagination={false}
          scroll={{ x: 1000 }}
          locale={{ emptyText: 'Todavía no se ha registrado ninguna revisión.' }}
        />
      </Card>
      <RevisionAnexoAFormModal
        open={modalAbierto}
        revision={revisionEditando}
        onClose={() => setModalAbierto(false)}
        api={config.api}
        responsableLabel={config.responsableLabel}
        queryKeyRevisiones={config.queryKeyRevisiones}
      />
      <ChecklistAnexoAModal
        open={checklistAbierto}
        revision={revisionParaChecklist}
        onClose={() => setChecklistAbierto(false)}
        api={config.api}
        queryKeyRevisiones={config.queryKeyRevisiones}
        queryKeyRespuestas={config.queryKeyRespuestas}
      />
    </div>
  );
}
