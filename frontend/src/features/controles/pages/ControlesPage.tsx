import { useQuery } from '@tanstack/react-query';
import { Button, Card, Table, Tag } from 'antd';
import { useState } from 'react';
import { AplicabilidadFormModal } from '../components/AplicabilidadFormModal';
import { fetchSoa } from '../api';
import type { AplicabilidadControl, CategoriaControl, EstadoImplementacion } from '../types';

const NOMBRE_CATEGORIA: Record<CategoriaControl, string> = {
  ORGANIZACIONAL: 'Organizacional',
  PERSONAS: 'Personas',
  FISICO: 'Físico',
  TECNOLOGICO: 'Tecnológico',
};

const COLOR_ESTADO: Record<EstadoImplementacion, string> = {
  NO_IMPLEMENTADO: 'red',
  PARCIAL: 'orange',
  IMPLEMENTADO: 'green',
  NO_APLICA: 'default',
};

const NOMBRE_ESTADO: Record<EstadoImplementacion, string> = {
  NO_IMPLEMENTADO: 'No implementado',
  PARCIAL: 'Parcial',
  IMPLEMENTADO: 'Implementado',
  NO_APLICA: 'No aplica',
};

export function ControlesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['soa'], queryFn: fetchSoa });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [aplicabilidadEditando, setAplicabilidadEditando] = useState<AplicabilidadControl | null>(null);

  function abrirEditar(aplicabilidad: AplicabilidadControl) {
    setAplicabilidadEditando(aplicabilidad);
    setModalAbierto(true);
  }

  const columns = [
    { title: 'Código', dataIndex: 'control_codigo', key: 'control_codigo', width: 90 },
    { title: 'Control', dataIndex: 'control_nombre', key: 'control_nombre' },
    {
      title: 'Categoría',
      dataIndex: 'control_categoria',
      key: 'control_categoria',
      filters: Object.entries(NOMBRE_CATEGORIA).map(([value, text]) => ({ text, value })),
      onFilter: (value: unknown, record: { control_categoria: string }) => record.control_categoria === value,
      render: (categoria: CategoriaControl) => NOMBRE_CATEGORIA[categoria],
    },
    {
      title: 'Aplica',
      dataIndex: 'aplica',
      key: 'aplica',
      render: (aplica: boolean) => (aplica ? <Tag color="green">Sí</Tag> : <Tag color="default">No</Tag>),
    },
    {
      title: 'Estado de implementación',
      dataIndex: 'estado_implementacion',
      key: 'estado_implementacion',
      render: (estado: EstadoImplementacion) => <Tag color={COLOR_ESTADO[estado]}>{NOMBRE_ESTADO[estado]}</Tag>,
    },
    { title: 'Responsable', dataIndex: 'responsable_nombre', key: 'responsable_nombre' },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_: unknown, aplicabilidad: AplicabilidadControl) => (
        <Button size="small" onClick={() => abrirEditar(aplicabilidad)}>Editar</Button>
      ),
    },
  ];

  return (
    <Card title="Controles Anexo A — Declaración de Aplicabilidad (SoA)">
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.results ?? []}
        pagination={{ pageSize: 20 }}
      />
      <AplicabilidadFormModal
        open={modalAbierto}
        aplicabilidad={aplicabilidadEditando}
        onClose={() => setModalAbierto(false)}
      />
    </Card>
  );
}
