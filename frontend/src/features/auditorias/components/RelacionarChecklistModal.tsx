import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal, Select, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { fetchItemsVerificacion, vincularItemAHallazgo } from '../../auditoriaInterna/api';
import { vincularHallazgoAAuditoria } from '../api';
import type { Hallazgo } from '../types';

const ETIQUETA_TIPO_ITEM: Record<string, string> = {
  CONFORMIDAD: 'Conformidad',
  NO_CONFORMIDAD: 'No Conformidad',
  OPORTUNIDAD_MEJORA: 'Oportunidad de Mejora',
  FORTALEZA: 'Fortaleza',
};

interface Props {
  open: boolean;
  hallazgo: Hallazgo | null;
  auditoriaId: number | null;
  auditoriaCodigo: string | null;
  onClose: () => void;
}

/** Relaciona un hallazgo ya existente (de años anteriores o creado manualmente) con
 * el/los item(s) de la Lista de Verificación de la Auditoria del mismo año, para dejar
 * trazabilidad de qué ya quedó cubierto por una auditoría real. Se abre desde la
 * columna "Relacionar" del módulo de Hallazgos. */
export function RelacionarChecklistModal({ open, hallazgo, auditoriaId, auditoriaCodigo, onClose }: Props) {
  const queryClient = useQueryClient();
  const [itemsSeleccionados, setItemsSeleccionados] = useState<number[]>([]);

  const { data: itemsAuditoria } = useQuery({
    queryKey: ['items-verificacion-auditoria', auditoriaId],
    queryFn: () => fetchItemsVerificacion(auditoriaId!),
    enabled: open && auditoriaId !== null,
  });

  useEffect(() => {
    if (!open || !hallazgo) return;
    setItemsSeleccionados(hallazgo.items_checklist_relacionados.map((item) => item.id));
  }, [open, hallazgo]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!hallazgo || !auditoriaId) return;
      const yaVinculados = hallazgo.items_checklist_relacionados.map((item) => item.id);
      const aVincular = itemsSeleccionados.filter((id) => !yaVinculados.includes(id));
      const aDesvincular = yaVinculados.filter((id) => !itemsSeleccionados.includes(id));
      await Promise.all([
        ...aVincular.map((id) => vincularItemAHallazgo(id, hallazgo.id)),
        ...aDesvincular.map((id) => vincularItemAHallazgo(id, null)),
      ]);
      await vincularHallazgoAAuditoria(hallazgo.id, itemsSeleccionados.length > 0 ? auditoriaId : null);
    },
    onSuccess: () => {
      message.success('Relación actualizada.');
      queryClient.invalidateQueries({ queryKey: ['hallazgos'] });
      queryClient.invalidateQueries({ queryKey: ['items-verificacion-auditoria'] });
      onClose();
    },
    onError: () => message.error('No se pudo actualizar la relación. Intenta de nuevo.'),
  });

  return (
    <Modal
      title={hallazgo ? `Relacionar ${hallazgo.codigo} con la auditoría ${auditoriaCodigo ?? ''}` : 'Relacionar hallazgo'}
      open={open}
      onCancel={onClose}
      onOk={() => mutation.mutate()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={640}
    >
      <Typography.Paragraph type="secondary">
        Selecciona el/los elemento(s) de la Lista de Verificación de esta auditoría que corresponden a este hallazgo,
        para dejar trazabilidad de qué ya quedó cubierto y ver de un vistazo qué sigue pendiente.
      </Typography.Paragraph>
      <Select
        mode="multiple"
        showSearch
        style={{ width: '100%' }}
        value={itemsSeleccionados}
        onChange={setItemsSeleccionados}
        placeholder="Sin items relacionados todavía"
        filterOption={(input, option) =>
          `${option?.label ?? ''} ${option?.descripcionHallazgo ?? ''}`.toLowerCase().includes(input.toLowerCase())
        }
        optionRender={(option) => (
          <div>
            <div>{option.data.label}</div>
            {option.data.descripcionHallazgo && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {option.data.descripcionHallazgo}
              </Typography.Text>
            )}
          </div>
        )}
        options={itemsAuditoria?.results
          .filter((item) => item.tipo_hallazgo !== 'FORTALEZA' && item.tipo_hallazgo !== 'CONFORMIDAD')
          .filter((item) => !item.hallazgo_generado || item.hallazgo_generado === hallazgo?.id)
          .map((item) => ({
            value: item.id,
            label: `[${ETIQUETA_TIPO_ITEM[item.tipo_hallazgo] ?? 'Sin tipo'}] ${item.descripcion_elemento}${item.requisito_iso ? ` (${item.requisito_iso})` : ''}`,
            descripcionHallazgo: item.descripcion_hallazgo,
          }))}
      />
    </Modal>
  );
}
