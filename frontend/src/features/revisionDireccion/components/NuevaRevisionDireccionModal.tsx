import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatePicker, Form, Input, Modal, Select, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { fetchEmpleados } from '../../accounts/api';
import { crearRevisionDireccion } from '../api';
import type { RevisionDireccionInput } from '../types';

type FormValues = {
  periodo: string;
  fecha_revision: dayjs.Dayjs;
  preside: number;
  asistentes: number[];
  lugar_modalidad: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreada: (id: number) => void;
}

/** "2026-S1" (ene-jun) o "2026-S2" (jul-dic) — mismo criterio que periodoActual() en
 * RevisionesActivosPage, para no inventar otra convención de nombres de periodo. */
function periodoActual(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-S${ahora.getMonth() < 6 ? 1 : 2}`;
}

export function NuevaRevisionDireccionModal({ open, onClose, onCreada }: Props) {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();
  const { data: empleados } = useQuery({ queryKey: ['empleados'], queryFn: fetchEmpleados, enabled: open });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ periodo: periodoActual(), fecha_revision: dayjs(), asistentes: [] });
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: RevisionDireccionInput = {
        periodo: values.periodo,
        fecha_revision: values.fecha_revision.format('YYYY-MM-DD'),
        preside: values.preside,
        asistentes: values.asistentes ?? [],
        lugar_modalidad: values.lugar_modalidad ?? '',
        estado_acciones_previas: '',
        cambios_cuestiones_externas_internas: '',
        cambios_partes_interesadas: '',
        desempeno_no_conformidades: '',
        desempeno_seguimiento_medicion: '',
        desempeno_auditorias: '',
        desempeno_objetivos: '',
        retroalimentacion_partes_interesadas: '',
        resultados_riesgos: '',
        oportunidades_mejora: '',
        conclusiones_generales: '',
      };
      return crearRevisionDireccion(payload);
    },
    onSuccess: (revision) => {
      message.success('Revisión creada. Completa el acta con las entradas de la cláusula 9.3.');
      queryClient.invalidateQueries({ queryKey: ['revisiones-direccion'] });
      onClose();
      onCreada(revision.id);
    },
    onError: () => message.error('No se pudo crear la revisión. Revisa los datos e intenta de nuevo.'),
  });

  const opcionesEmpleados = empleados?.results.map((e) => ({
    value: e.id,
    label: e.cargo ? `${e.nombre_completo} (${e.cargo})` : e.nombre_completo,
  }));

  return (
    <Modal
      title="Nueva revisión por la dirección"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={560}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item name="periodo" label="Periodo" rules={[{ required: true, message: 'Ingresa un periodo' }]}>
          <Input placeholder="2026-S2" />
        </Form.Item>
        <Form.Item
          name="fecha_revision"
          label="Fecha de revisión"
          rules={[{ required: true, message: 'Selecciona la fecha' }]}
        >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item
          name="preside"
          label="Preside la revisión (Alta Dirección)"
          rules={[{ required: true, message: 'Selecciona quién preside' }]}
        >
          <Select showSearch optionFilterProp="label" options={opcionesEmpleados} />
        </Form.Item>
        <Form.Item name="asistentes" label="Asistentes">
          <Select mode="multiple" showSearch optionFilterProp="label" options={opcionesEmpleados} />
        </Form.Item>
        <Form.Item name="lugar_modalidad" label="Lugar / modalidad">
          <Input placeholder="Ej. Sala de juntas / Virtual - Teams" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
