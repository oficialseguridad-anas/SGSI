import { LockOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Popconfirm, Space, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { eliminarRevisionPersonas, fetchRevisionesPersonas } from '../api';
import { ChecklistPersonasModal } from '../components/ChecklistPersonasModal';
import { EncabezadoRevisionAnexoA } from '../components/EncabezadoRevisionAnexoA';
import { RevisionPersonasFormModal } from '../components/RevisionPersonasFormModal';
import { TablaCriteriosResultado } from '../components/TablaCriteriosResultado';
import type { RevisionPersonas } from '../types';

export function SeguimientoPersonasPage() {
  const { hasPerm } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['revisiones-personas'],
    queryFn: fetchRevisionesPersonas,
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [revisionEditando, setRevisionEditando] = useState<RevisionPersonas | null>(null);
  const [checklistAbierto, setChecklistAbierto] = useState(false);
  const [revisionParaChecklist, setRevisionParaChecklist] = useState<RevisionPersonas | null>(null);

  const eliminarMutation = useMutation({
    mutationFn: eliminarRevisionPersonas,
    onSuccess: () => {
      message.success('Revisión eliminada.');
      queryClient.invalidateQueries({ queryKey: ['revisiones-personas'] });
    },
    onError: () => message.error('No se pudo eliminar la revisión.'),
  });

  function abrirCrear() {
    setRevisionEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(revision: RevisionPersonas) {
    setRevisionEditando(revision);
    setModalAbierto(true);
  }

  function abrirChecklist(revision: RevisionPersonas) {
    setRevisionParaChecklist(revision);
    setChecklistAbierto(true);
  }

  const columns = [
    { title: 'Fecha de revisión', dataIndex: 'fecha_revision', key: 'fecha_revision', width: 130 },
    { title: 'Revisor / Oficial de Seguridad', dataIndex: 'revisor_nombre', key: 'revisor_nombre', width: 200 },
    {
      title: 'Responsable de Talento Humano',
      dataIndex: 'responsable_talento_humano_nombre',
      key: 'responsable_talento_humano_nombre',
      width: 200,
    },
    {
      title: 'Responsable de Tecnología',
      dataIndex: 'responsable_tecnologia_nombre',
      key: 'responsable_tecnologia_nombre',
      width: 200,
    },
    { title: 'Muestra seleccionada', dataIndex: 'muestra_seleccionada', key: 'muestra_seleccionada', render: (t: string) => t || '—' },
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
      render: (_: unknown, revision: RevisionPersonas) => (
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
      render: (_: unknown, revision: RevisionPersonas) => (
        <Space>
          {hasPerm('revisiones.change_revisionpersonas') && (
            <Button size="small" onClick={() => abrirEditar(revision)}>Editar</Button>
          )}
          {hasPerm('revisiones.delete_revisionpersonas') && (
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
        <EncabezadoRevisionAnexoA
          titulo="Revisión de los Controles de Seguridad de la Información en Recursos Humanos"
          rangoControles="A.6.1 a A.6.8"
        />
        <TablaCriteriosResultado />
      </Card>

      <Card
        title="Revisiones registradas"
        extra={
          hasPerm('revisiones.add_revisionpersonas') && (
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
      <RevisionPersonasFormModal open={modalAbierto} revision={revisionEditando} onClose={() => setModalAbierto(false)} />
      <ChecklistPersonasModal
        open={checklistAbierto}
        revision={revisionParaChecklist}
        onClose={() => setChecklistAbierto(false)}
      />
    </div>
  );
}
