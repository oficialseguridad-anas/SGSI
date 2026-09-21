import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatePicker, Form, Input, Modal, Select, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { fetchUsuarios } from '../../accounts/api';
import type { ApiRevisionAnexoA } from '../api';
import type { RevisionAnexoA, RevisionAnexoAInput } from '../types';

type FormValues = Omit<RevisionAnexoAInput, 'fecha_revision'> & { fecha_revision: dayjs.Dayjs };

interface Props {
  open: boolean;
  revision: RevisionAnexoA | null;
  onClose: () => void;
  api: ApiRevisionAnexoA;
  responsableLabel: string;
  queryKeyRevisiones: string;
}

export function RevisionAnexoAFormModal({ open, revision, onClose, api, responsableLabel, queryKeyRevisiones }: Props) {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();
  const { data: usuarios } = useQuery({ queryKey: ['usuarios'], queryFn: fetchUsuarios, enabled: open });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (revision) {
      form.setFieldsValue({
        fecha_revision: dayjs(revision.fecha_revision),
        revisor: revision.revisor,
        responsable: revision.responsable,
        muestra_seleccionada: revision.muestra_seleccionada,
      });
    } else {
      form.setFieldsValue({ fecha_revision: dayjs() });
    }
  }, [open, revision, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: RevisionAnexoAInput = {
        ...values,
        fecha_revision: values.fecha_revision.format('YYYY-MM-DD'),
      };
      return revision ? api.actualizarRevision(revision.id, payload) : api.crearRevision(payload);
    },
    onSuccess: () => {
      message.success(revision ? 'Revisión actualizada.' : 'Revisión creada.');
      queryClient.invalidateQueries({ queryKey: [queryKeyRevisiones] });
      onClose();
    },
    onError: () => message.error('No se pudo guardar la revisión. Revisa los datos e intenta de nuevo.'),
  });

  const opcionesUsuarios = usuarios?.results.map((u) => ({ value: u.id, label: `${u.nombre_completo} (${u.email})` }));

  return (
    <Modal
      title={revision ? 'Editar revisión' : 'Nueva revisión'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={560}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item
          name="fecha_revision"
          label="Fecha de revisión"
          rules={[{ required: true, message: 'Selecciona la fecha' }]}
        >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item
          name="revisor"
          label="Revisor / Oficial de Seguridad"
          rules={[{ required: true, message: 'Selecciona el revisor' }]}
        >
          <Select showSearch optionFilterProp="label" options={opcionesUsuarios} />
        </Form.Item>
        <Form.Item
          name="responsable"
          label={responsableLabel}
          rules={[{ required: true, message: 'Selecciona el responsable' }]}
        >
          <Select showSearch optionFilterProp="label" options={opcionesUsuarios} />
        </Form.Item>
        <Form.Item name="muestra_seleccionada" label="Muestra seleccionada">
          <Input placeholder="Ej. 5 de 20 controles / evidencias del último trimestre" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
