import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Input, Modal, Select, message } from 'antd';
import { useEffect } from 'react';
import { fetchProcesos } from '../../activos/api';
import { fetchIndicadores } from '../../indicadores/api';
import { actualizarObjetivo, crearObjetivo } from '../api';
import type { Objetivo, ObjetivoInput } from '../types';

interface Props {
  open: boolean;
  objetivo: Objetivo | null;
  onClose: () => void;
}

export function ObjetivoFormModal({ open, objetivo, onClose }: Props) {
  const [form] = Form.useForm<ObjetivoInput>();
  const queryClient = useQueryClient();

  const { data: procesos } = useQuery({ queryKey: ['procesos'], queryFn: fetchProcesos, enabled: open });
  const { data: indicadores } = useQuery({ queryKey: ['indicadores'], queryFn: fetchIndicadores, enabled: open });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (objetivo) {
      form.setFieldsValue({
        objetivo: objetivo.objetivo,
        componente_politica: objetivo.componente_politica,
        procesos_asociados: objetivo.procesos_asociados,
        responsables_seguimiento: objetivo.responsables_seguimiento,
        indicador_desempeno: objetivo.indicador_desempeno,
        indicadores: objetivo.indicadores,
        meta_indicador: objetivo.meta_indicador,
      });
    } else {
      form.setFieldsValue({ procesos_asociados: [], indicadores: [] });
    }
  }, [open, objetivo, form]);

  const mutation = useMutation({
    mutationFn: (values: ObjetivoInput) =>
      objetivo ? actualizarObjetivo(objetivo.id, values) : crearObjetivo(values),
    onSuccess: () => {
      message.success(objetivo ? 'Objetivo actualizado.' : 'Objetivo creado.');
      queryClient.invalidateQueries({ queryKey: ['objetivos'] });
      onClose();
    },
    onError: () => message.error('No se pudo guardar el objetivo. Revisa los datos e intenta de nuevo.'),
  });

  return (
    <Modal
      title={objetivo ? 'Editar objetivo' : 'Nuevo objetivo'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={720}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item name="objetivo" label="Objetivo" rules={[{ required: true, message: 'Ingresa el objetivo' }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="componente_politica" label="Componente de la política al cual contribuye">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="procesos_asociados" label="Procesos asociados">
          <Select
            mode="multiple"
            showSearch
            optionFilterProp="label"
            options={procesos?.results.map((p) => ({ value: p.id, label: p.nombre }))}
          />
        </Form.Item>
        <Form.Item name="responsables_seguimiento" label="Responsables de seguimiento">
          <Input.TextArea rows={2} placeholder="Ej. Oficial de seguridad de la información, Jefe de Tecnología" />
        </Form.Item>
        <Form.Item name="indicador_desempeno" label="Indicador de desempeño">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="indicadores" label="Indicadores relacionados">
          <Select
            mode="multiple"
            showSearch
            optionFilterProp="label"
            options={indicadores?.results.map((i) => ({ value: i.id, label: `${i.codigo} - ${i.nombre}` }))}
          />
        </Form.Item>
        <Form.Item name="meta_indicador" label="Meta del indicador">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
