import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Popconfirm, Space, Table, Typography, message } from 'antd';
import { useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { BRAND } from '../../../shared/theme/brand';
import { eliminarRevisionPersonas, fetchRevisionesPersonas } from '../api';
import { ChecklistPersonasModal } from '../components/ChecklistPersonasModal';
import { RevisionPersonasFormModal } from '../components/RevisionPersonasFormModal';
import {
  CRITERIO_RESULTADO_CHECKLIST,
  NOMBRE_RESULTADO_CHECKLIST,
  ORDEN_RESULTADO_CHECKLIST,
} from '../resultadoChecklist';
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
      title: 'Checklist',
      key: 'checklist',
      width: 110,
      render: (_: unknown, revision: RevisionPersonas) => (
        <Button size="small" onClick={() => abrirChecklist(revision)}>
          Abrir
        </Button>
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
        <div style={{ borderLeft: `4px solid ${BRAND.teal}`, paddingLeft: 16 }}>
          <Typography.Title level={3} style={{ color: BRAND.tealDark, marginBottom: 4 }}>
            Revisión de los Controles de Seguridad de la Información en Recursos Humanos
          </Typography.Title>
          <Typography.Text strong style={{ fontSize: 15 }}>
            Controles A.6.1 a A.6.8 — ISO/IEC 27001:2022
          </Typography.Text>
        </div>
        <Typography.Title level={5} style={{ textAlign: 'center', color: BRAND.teal, marginTop: 20 }}>
          ANAS WAYUU EPSI
        </Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 20 }}>
          Uso: guía de campo / checklist / registro de evidencia
        </Typography.Text>
        <div style={{ background: BRAND.bg, border: `1px solid ${BRAND.tealLight}33`, borderRadius: 6, padding: 16 }}>
          <Typography.Text strong style={{ color: BRAND.tealDark, display: 'block', marginBottom: 6 }}>
            Propósito del documento
          </Typography.Text>
          <Typography.Text>
            Servir como instrumento práctico para realizar una primera revisión de la implementación y eficacia de
            los controles A.6.1 a A.6.8 mediante muestreo, entrevistas, revisión documental y verificación de
            evidencias reales. No sustituye una auditoría formal del SGSI.
          </Typography.Text>
        </div>

        <Typography.Title level={4} style={{ color: BRAND.tealDark, marginTop: 28, marginBottom: 12 }}>
          Criterios para calificar el resultado
        </Typography.Title>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th
                  style={{
                    background: BRAND.tealDark,
                    color: '#fff',
                    textAlign: 'left',
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    width: 200,
                  }}
                >
                  Resultado
                </th>
                <th
                  style={{
                    background: BRAND.tealDark,
                    color: '#fff',
                    textAlign: 'left',
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                  }}
                >
                  Criterio de uso
                </th>
              </tr>
            </thead>
            <tbody>
              {ORDEN_RESULTADO_CHECKLIST.map((clave) => (
                <tr key={clave}>
                  <td style={{ padding: '8px 12px', border: '1px solid #d9d9d9', fontWeight: 600 }}>
                    {NOMBRE_RESULTADO_CHECKLIST[clave]}
                  </td>
                  <td style={{ padding: '8px 12px', border: '1px solid #d9d9d9' }}>
                    {CRITERIO_RESULTADO_CHECKLIST[clave]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
