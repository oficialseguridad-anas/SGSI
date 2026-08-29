import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatePicker, Form, Input, Modal, Select, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { fetchProcesos } from '../../activos/api';
import { fetchControlesCatalogo, fetchNumeralesNorma } from '../../controles/api';
import { crearHallazgo, fetchTiposHallazgo, actualizarHallazgo } from '../api';
import { COLOR_ESTADO_HALLAZGO, NOMBRE_ESTADO_HALLAZGO, TEXTO_ESTADO_HALLAZGO } from '../estadoHallazgo';
import type { Hallazgo, HallazgoInput } from '../types';

// El selector de "Requisito incumplido" combina dos relaciones distintas (controles del
// Anexo A y numerales del cuerpo de la norma) en un solo campo visual. Cada opción se
// codifica con un prefijo ("C-<id>" / "N-<id>") solo para esta UI; al guardar se separan
// de vuelta en los dos campos reales (`controles`, `numerales`) que espera la API.
const PREFIJO_CONTROL = 'C-';
const PREFIJO_NUMERAL = 'N-';

type FormValues = Omit<HallazgoInput, 'fecha_deteccion'> & {
  fecha_deteccion: dayjs.Dayjs;
};

interface Props {
  open: boolean;
  hallazgo: Hallazgo | null;
  onClose: () => void;
}

export function HallazgoFormModal({ open, hallazgo, onClose }: Props) {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();

  const { data: procesos } = useQuery({ queryKey: ['procesos'], queryFn: fetchProcesos, enabled: open });
  const { data: tipos } = useQuery({ queryKey: ['tipos-hallazgo'], queryFn: fetchTiposHallazgo, enabled: open });
  const { data: controles } = useQuery({
    queryKey: ['controles-catalogo'],
    queryFn: fetchControlesCatalogo,
    enabled: open,
  });
  const { data: numerales } = useQuery({
    queryKey: ['numerales-norma'],
    queryFn: fetchNumeralesNorma,
    enabled: open,
  });

  const opcionesRequisito = [
    {
      label: 'Controles Anexo A',
      options: controles?.results.map((c) => ({ value: `${PREFIJO_CONTROL}${c.id}`, label: `${c.codigo} - ${c.nombre}` })) ?? [],
    },
    {
      label: 'Numerales de la norma',
      options: numerales?.results.map((n) => ({ value: `${PREFIJO_NUMERAL}${n.id}`, label: `${n.codigo} - ${n.nombre}` })) ?? [],
    },
  ];

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (hallazgo) {
      form.setFieldsValue({
        fecha_deteccion: dayjs(hallazgo.fecha_deteccion),
        procesos: hallazgo.procesos,
        tipos: hallazgo.tipos,
        descripcion: hallazgo.descripcion,
        evidencia_asociada: hallazgo.evidencia_asociada,
        controles: hallazgo.controles,
        numerales: hallazgo.numerales,
        analisis_causa: hallazgo.analisis_causa,
      });
    } else {
      form.setFieldsValue({
        fecha_deteccion: dayjs(),
        procesos: [],
        tipos: [],
        controles: [],
        numerales: [],
        evidencia_asociada: '',
        analisis_causa: '',
      });
    }
  }, [open, hallazgo, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: HallazgoInput = {
        ...values,
        fecha_deteccion: values.fecha_deteccion.format('YYYY-MM-DD'),
      };
      return hallazgo ? actualizarHallazgo(hallazgo.id, payload) : crearHallazgo(payload);
    },
    onSuccess: () => {
      message.success(hallazgo ? 'Hallazgo actualizado.' : 'Hallazgo creado.');
      queryClient.invalidateQueries({ queryKey: ['hallazgos'] });
      onClose();
    },
    onError: () => message.error('No se pudo guardar el hallazgo. Revisa los datos e intenta de nuevo.'),
  });

  return (
    <Modal
      title={hallazgo ? `Editar hallazgo ${hallazgo.codigo}` : 'Nuevo hallazgo de auditoría'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={720}
    >
      <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <Form.Item
          name="fecha_deteccion"
          label="Fecha de detección"
          rules={[{ required: true, message: 'Selecciona la fecha de detección' }]}
        >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item
          name="procesos"
          label="Proceso"
          rules={[{ required: true, message: 'Selecciona al menos un proceso' }]}
        >
          <Select
            mode="multiple"
            showSearch
            optionFilterProp="label"
            options={procesos?.results.map((p) => ({ value: p.id, label: p.nombre }))}
          />
        </Form.Item>
        <Form.Item name="tipos" label="Tipo" rules={[{ required: true, message: 'Selecciona al menos un tipo' }]}>
          <Select
            mode="multiple"
            options={tipos?.results.map((t) => ({ value: t.id, label: t.nombre }))}
          />
        </Form.Item>
        <Form.Item
          name="descripcion"
          label="Descripción de la no conformidad / hallazgo"
          rules={[{ required: true, message: 'Ingresa la descripción' }]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="evidencia_asociada" label="Evidencia asociada">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item name="controles" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="numerales" hidden>
          <Input />
        </Form.Item>
        <Form.Item label="Requisito incumplido (controles Anexo A y/o numerales de la norma)">
          <Form.Item noStyle shouldUpdate>
            {() => {
              const controlesSel: number[] = form.getFieldValue('controles') ?? [];
              const numeralesSel: number[] = form.getFieldValue('numerales') ?? [];
              const valorCombinado = [
                ...controlesSel.map((id) => `${PREFIJO_CONTROL}${id}`),
                ...numeralesSel.map((id) => `${PREFIJO_NUMERAL}${id}`),
              ];
              return (
                <Select
                  mode="multiple"
                  showSearch
                  optionFilterProp="label"
                  value={valorCombinado}
                  onChange={(valores: string[]) => {
                    form.setFieldsValue({
                      controles: valores
                        .filter((v) => v.startsWith(PREFIJO_CONTROL))
                        .map((v) => Number(v.slice(PREFIJO_CONTROL.length))),
                      numerales: valores
                        .filter((v) => v.startsWith(PREFIJO_NUMERAL))
                        .map((v) => Number(v.slice(PREFIJO_NUMERAL.length))),
                    });
                  }}
                  options={opcionesRequisito}
                />
              );
            }}
          </Form.Item>
        </Form.Item>

        <Form.Item name="analisis_causa" label="Análisis de causa (5 Porqués / Ishikawa)">
          <Input.TextArea rows={3} />
        </Form.Item>
        {hallazgo && (
          <Typography.Text type="secondary">
            Estado (automático, según el seguimiento):{' '}
            <Tag
              color={COLOR_ESTADO_HALLAZGO[hallazgo.estado]}
              style={{ color: TEXTO_ESTADO_HALLAZGO[hallazgo.estado], borderColor: 'transparent' }}
            >
              {NOMBRE_ESTADO_HALLAZGO[hallazgo.estado]}
            </Tag>
          </Typography.Text>
        )}
      </Form>
    </Modal>
  );
}
