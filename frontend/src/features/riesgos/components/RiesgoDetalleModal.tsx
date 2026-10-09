import { Descriptions, Modal, Space, Table, Tag, Typography } from 'antd';
import { COLOR_NIVEL_RIESGO, NOMBRE_NIVEL_RIESGO, TEXTO_NIVEL_RIESGO } from '../nivelRiesgo';
import type { Riesgo, TratamientoRiesgo } from '../types';

const NOMBRE_OPCION: Record<TratamientoRiesgo['opcion'], string> = {
  MITIGAR: 'Mitigar',
  TRANSFERIR: 'Transferir',
  EVITAR: 'Evitar',
  ACEPTAR: 'Aceptar',
};

const COLOR_ESTADO_TRAT: Record<TratamientoRiesgo['estado'], string> = {
  PENDIENTE: 'default',
  VENCIDO: 'red',
  COMPLETADO: 'green',
};

const NOMBRE_ESTADO_TRAT: Record<TratamientoRiesgo['estado'], string> = {
  PENDIENTE: 'Pendiente',
  VENCIDO: 'Vencido',
  COMPLETADO: 'Completado',
};

interface Props {
  open: boolean;
  riesgo: Riesgo | null;
  onClose: () => void;
}

/** Vista de solo lectura con la misma información del módulo de Riesgos — se abre al
 * hacer clic en el código de un riesgo desde otros módulos (ej. la columna "Riesgo
 * asociado" de Activos), para no tener que ir a buscarlo en Riesgos. */
export function RiesgoDetalleModal({ open, riesgo, onClose }: Props) {
  return (
    <Modal
      title={riesgo ? `${riesgo.codigo} — ${riesgo.amenaza_nombre}` : 'Riesgo'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
      destroyOnHidden
    >
      {riesgo && (
        <>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Código">{riesgo.codigo}</Descriptions.Item>
            <Descriptions.Item label="Activo">
              {riesgo.esta_activo ? <Tag color="green">Sí</Tag> : <Tag color="default">No</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Activos relacionados" span={2}>
              {riesgo.activos_nombres.length ? (
                <Space size={[4, 4]} wrap>
                  {riesgo.activos_nombres.map((n) => (
                    <Tag key={n}>{n}</Tag>
                  ))}
                </Space>
              ) : (
                '—'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Amenaza" span={2}>
              <strong>{riesgo.amenaza_nombre}</strong>
              {riesgo.amenaza_descripcion && (
                <>
                  <br />
                  <Typography.Text type="secondary">{riesgo.amenaza_descripcion}</Typography.Text>
                </>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Descripción del riesgo" span={2}>{riesgo.descripcion || '—'}</Descriptions.Item>
            <Descriptions.Item label="Probabilidad">{riesgo.probabilidad}</Descriptions.Item>
            <Descriptions.Item label="Impacto">{riesgo.impacto}</Descriptions.Item>
            <Descriptions.Item label="Riesgo inherente">{riesgo.riesgo_inherente}</Descriptions.Item>
            <Descriptions.Item label="Nivel de riesgo">
              <Tag color={COLOR_NIVEL_RIESGO[riesgo.nivel_de_riesgo]} style={{ color: TEXTO_NIVEL_RIESGO[riesgo.nivel_de_riesgo], borderColor: 'transparent' }}>
                {NOMBRE_NIVEL_RIESGO[riesgo.nivel_de_riesgo]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Propietarios" span={2}>
              {riesgo.propietarios_nombres.length ? (
                <Space size={[4, 4]} wrap>
                  {riesgo.propietarios_nombres.map((n) => (
                    <Tag key={n}>{n}</Tag>
                  ))}
                </Space>
              ) : (
                'Sin asignar'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Fecha de identificación">{riesgo.fecha_identificacion}</Descriptions.Item>
          </Descriptions>

          <Typography.Text strong style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>
            Tratamiento(s) ({riesgo.tratamientos.length})
          </Typography.Text>
          <Table
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={riesgo.tratamientos}
            locale={{ emptyText: 'Sin tratamiento registrado.' }}
            columns={[
              { title: 'Opción', dataIndex: 'opcion', key: 'opcion', render: (o: TratamientoRiesgo['opcion']) => NOMBRE_OPCION[o] },
              {
                title: 'Estado', dataIndex: 'estado', key: 'estado',
                render: (e: TratamientoRiesgo['estado']) => <Tag color={COLOR_ESTADO_TRAT[e]}>{NOMBRE_ESTADO_TRAT[e]}</Tag>,
              },
              {
                title: 'Nivel residual', dataIndex: 'nivel_de_riesgo_residual', key: 'nivel_de_riesgo_residual',
                render: (n: TratamientoRiesgo['nivel_de_riesgo_residual']) =>
                  n ? (
                    <Tag color={COLOR_NIVEL_RIESGO[n]} style={{ color: TEXTO_NIVEL_RIESGO[n], borderColor: 'transparent' }}>
                      {NOMBRE_NIVEL_RIESGO[n]}
                    </Tag>
                  ) : '—',
              },
              { title: 'Fecha límite', dataIndex: 'fecha_limite', key: 'fecha_limite', render: (v: string | null) => v ?? '—' },
              { title: 'Fecha cierre', dataIndex: 'fecha_cierre', key: 'fecha_cierre', render: (v: string | null) => v ?? '—' },
            ]}
          />
        </>
      )}
    </Modal>
  );
}
