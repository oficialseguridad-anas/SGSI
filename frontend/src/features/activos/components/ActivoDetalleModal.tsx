import { Button, Descriptions, Modal, Popconfirm, Tag } from 'antd';
import { useAuth } from '../../../app/AuthContext';
import {
  COLOR_CRITICIDAD,
  COLOR_ESTADO,
  COLOR_ETIQUETADO,
  NOMBRE_CLASE,
  NOMBRE_CRITICIDAD,
  NOMBRE_NATURALEZA,
  NOMBRE_TIPO_ACTIVO,
} from '../etiquetas';
import type { Activo } from '../types';

interface Props {
  open: boolean;
  activo: Activo | null;
  onClose: () => void;
  /** Si se pasan, se muestran los botones de Editar/Eliminar en el pie del modal —
   * se omiten (p.ej. al abrir este modal desde Riesgos) cuando no aplica. */
  onEditar?: (activo: Activo) => void;
  onEliminar?: (activo: Activo) => void;
}

/** Vista de solo lectura con la misma información del módulo de Activos — se abre al
 * hacer clic en la etiqueta/nombre de un activo desde este u otros módulos (ej.
 * Riesgos), para no tener que ir a buscarlo en Activos. Las acciones de
 * Editar/Eliminar (antes en la tabla principal de Activos) viven aquí. */
export function ActivoDetalleModal({ open, activo, onClose, onEditar, onEliminar }: Props) {
  const { hasPerm } = useAuth();
  return (
    <Modal
      title={activo ? `${activo.codigo} — ${activo.nombre}` : 'Activo'}
      open={open}
      onCancel={onClose}
      footer={
        activo && (onEditar || onEliminar)
          ? [
              <Button key="cerrar" onClick={onClose}>Cerrar</Button>,
              onEditar && hasPerm('activos.change_activo') && (
                <Button key="editar" onClick={() => onEditar(activo)}>Editar</Button>
              ),
              onEliminar && hasPerm('activos.delete_activo') && (
                <Popconfirm
                  key="eliminar"
                  title="¿Eliminar este activo?"
                  okText="Eliminar"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => onEliminar(activo)}
                >
                  <Button danger>Eliminar</Button>
                </Popconfirm>
              ),
            ]
          : null
      }
      width={720}
      destroyOnHidden
    >
      {activo && (
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Código">{activo.codigo}</Descriptions.Item>
          <Descriptions.Item label="Nombre">{activo.nombre}</Descriptions.Item>
          <Descriptions.Item label="Proceso">{activo.proceso_nombre ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Dirección">{activo.direccion_nombre}</Descriptions.Item>
          <Descriptions.Item label="Tipo">{NOMBRE_TIPO_ACTIVO[activo.tipo_activo]}</Descriptions.Item>
          <Descriptions.Item label="Clase">{NOMBRE_CLASE[activo.clase_activo]}</Descriptions.Item>
          <Descriptions.Item label="Naturaleza">{NOMBRE_NATURALEZA[activo.naturaleza]}</Descriptions.Item>
          <Descriptions.Item label="Etiquetado">
            <Tag color={COLOR_ETIQUETADO[activo.etiquetado]}>{activo.etiquetado}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Propietario">{activo.propietario}</Descriptions.Item>
          <Descriptions.Item label="Custodio">{activo.custodio}</Descriptions.Item>
          <Descriptions.Item label="Datos personales">{activo.contiene_datos_personales ? 'Sí' : 'No'}</Descriptions.Item>
          <Descriptions.Item label="Estado">
            <Tag color={COLOR_ESTADO[activo.estado]}>{activo.estado}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Confidencialidad">{NOMBRE_CRITICIDAD[activo.valor_confidencialidad]}</Descriptions.Item>
          <Descriptions.Item label="Integridad">{NOMBRE_CRITICIDAD[activo.valor_integridad]}</Descriptions.Item>
          <Descriptions.Item label="Disponibilidad">{NOMBRE_CRITICIDAD[activo.valor_disponibilidad]}</Descriptions.Item>
          <Descriptions.Item label="Criticidad">
            <Tag color={COLOR_CRITICIDAD[activo.criticidad]}>
              {NOMBRE_CRITICIDAD[activo.criticidad]} ({activo.puntaje_valoracion})
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Fecha de baja">{activo.fecha_baja ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Descripción" span={2}>{activo.descripcion || '—'}</Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
