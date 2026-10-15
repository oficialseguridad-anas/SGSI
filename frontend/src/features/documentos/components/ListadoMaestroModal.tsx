import { DownloadOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Button, Empty, Modal, Table, Tabs, Typography, message } from 'antd';
import { descargarListadoMaestro } from '../api';
import { NOMBRE_TIPO, TIPOS_DOCUMENTO } from '../tipoDocumento';
import type { Documento } from '../types';

interface Props {
  open: boolean;
  documentos: Documento[];
  onClose: () => void;
}

function consecutivoDe(codigo: string) {
  const partes = codigo.split('-');
  return partes.length > 2 ? partes[2] : '—';
}

const COLUMNAS = [
  { title: 'Consecutivo', key: 'consecutivo', width: 100, render: (_: unknown, d: Documento) => consecutivoDe(d.codigo) },
  { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 120, render: (c: string) => <strong>{c}</strong> },
  { title: 'Nombre del documento', dataIndex: 'titulo', key: 'titulo' },
  { title: 'Versión', dataIndex: 'version_actual', key: 'version_actual', width: 90 },
];

/** Vista + descarga del Listado Maestro de Documentos SGSI (FO institucional real,
 * aportado por el usuario) — agrupado por tipo, igual que las pestañas del Excel real
 * (Manual, Política, Procedimiento, Plan, Formato, Guía, Matriz, Programa, Protocolo).
 * El Excel se genera en el momento desde los documentos actuales (ver
 * `apps/documentos/excel_builder_listado.py`), así que un documento nuevo o una nueva
 * versión aparece aquí solo, sin mantener un archivo aparte a mano. */
export function ListadoMaestroModal({ open, documentos, onClose }: Props) {
  const descargarMutation = useMutation({
    mutationFn: descargarListadoMaestro,
    onError: () => message.error('No se pudo descargar el listado.'),
  });

  const ordenados = [...documentos].sort((a, b) => a.codigo.localeCompare(b.codigo));
  const porTipo = TIPOS_DOCUMENTO.map((tipo) => ({
    tipo,
    items: ordenados.filter((d) => d.tipo === tipo),
  }));

  return (
    <Modal
      title="Listado Maestro de Documentos SGSI"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cerrar" onClick={onClose}>Cerrar</Button>,
        <Button
          key="descargar"
          type="primary"
          icon={<DownloadOutlined />}
          loading={descargarMutation.isPending}
          onClick={() => descargarMutation.mutate()}
        >
          Descargar Excel
        </Button>,
      ]}
      width="min(96vw, 1100px)"
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        Todos los documentos cargados en el sistema, agrupados por tipo — igual estructura que el Excel real
        (una pestaña por tipo). Se actualiza solo con lo que haya guardado en cada momento.
      </Typography.Paragraph>
      <Tabs
        items={[
          {
            key: 'todos',
            label: `Todos (${ordenados.length})`,
            children: (
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={ordenados}
                columns={COLUMNAS}
                locale={{ emptyText: <Empty description="Sin documentos registrados." /> }}
              />
            ),
          },
          ...porTipo
            .filter((grupo) => grupo.items.length > 0)
            .map((grupo) => ({
              key: grupo.tipo,
              label: `${NOMBRE_TIPO[grupo.tipo]} (${grupo.items.length})`,
              children: (
                <Table rowKey="id" size="small" pagination={false} dataSource={grupo.items} columns={COLUMNAS} />
              ),
            })),
        ]}
      />
    </Modal>
  );
}
