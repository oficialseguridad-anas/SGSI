import { DownloadOutlined } from '@ant-design/icons';
import { Button, Modal, Select, Space, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import type { Activo, ClaseActivo, EstadoActivo, EtiquetadoActivo, NivelValoracion, TipoActivo } from '../types';

interface Props {
  open: boolean;
  activos: Activo[];
  onClose: () => void;
}

const NOMBRE_TIPO_ACTIVO: Record<TipoActivo, string> = {
  PRIMARIO: 'Primario',
  SECUNDARIO: 'Secundario',
};

const NOMBRE_CLASE: Record<ClaseActivo, string> = {
  SISTEMAS_INFORMACION: 'Sistemas de Información',
  PERSONAL: 'Personal',
  SOFTWARE: 'Software',
  HARDWARE: 'Hardware',
  INFORMACION: 'Información',
  ESTRUCTURA_ORGANIZACION: 'Estructura de la organización',
  RED: 'Red',
};

const NOMBRE_NATURALEZA: Record<Activo['naturaleza'], string> = {
  FISICO: 'Físico',
  DIGITAL: 'Digital',
  SAAS: 'SaaS',
  IAAS: 'IaaS',
  PAAS: 'PaaS',
};

const NOMBRE_ETIQUETADO: Record<EtiquetadoActivo, string> = {
  PUBLICO: 'Público',
  PRIVADO: 'Privado',
  CONFIDENCIAL: 'Confidencial',
};

const NOMBRE_CRITICIDAD: Record<NivelValoracion, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
};

const NOMBRE_ESTADO: Record<EstadoActivo, string> = {
  ACTIVO: 'Activo',
  EN_MANTENIMIENTO: 'En mantenimiento',
  RETIRADO: 'Retirado',
};

function unicos(valores: (string | null)[]): string[] {
  return [...new Set(valores.filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b));
}

export function ExportarActivosModal({ open, activos, onClose }: Props) {
  const [procesos, setProcesos] = useState<string[]>([]);
  const [direcciones, setDirecciones] = useState<string[]>([]);
  const [criticidades, setCriticidades] = useState<NivelValoracion[]>([]);
  const [estados, setEstados] = useState<EstadoActivo[]>([]);

  const opcionesProceso = useMemo(() => unicos(activos.map((a) => a.proceso_nombre)), [activos]);
  const opcionesDireccion = useMemo(() => {
    // Si ya se eligió proceso, la lista de direcciones se acota a esos procesos.
    const base = procesos.length ? activos.filter((a) => a.proceso_nombre && procesos.includes(a.proceso_nombre)) : activos;
    return unicos(base.map((a) => a.direccion_nombre));
  }, [activos, procesos]);

  const activosFiltrados = useMemo(() => {
    return activos.filter((a) => {
      if (procesos.length && !(a.proceso_nombre && procesos.includes(a.proceso_nombre))) return false;
      if (direcciones.length && !direcciones.includes(a.direccion_nombre)) return false;
      if (criticidades.length && !criticidades.includes(a.criticidad)) return false;
      if (estados.length && !estados.includes(a.estado)) return false;
      return true;
    });
  }, [activos, procesos, direcciones, criticidades, estados]);

  function limpiarFiltros() {
    setProcesos([]);
    setDirecciones([]);
    setCriticidades([]);
    setEstados([]);
  }

  function descargar() {
    if (!activosFiltrados.length) {
      message.warning('Ningún activo coincide con los criterios seleccionados.');
      return;
    }
    const filas = activosFiltrados.map((a) => ({
      Código: a.codigo,
      Nombre: a.nombre,
      Proceso: a.proceso_nombre ?? '',
      Dirección: a.direccion_nombre,
      Tipo: NOMBRE_TIPO_ACTIVO[a.tipo_activo],
      Clase: NOMBRE_CLASE[a.clase_activo],
      Naturaleza: NOMBRE_NATURALEZA[a.naturaleza],
      Propietario: a.propietario,
      Custodio: a.custodio,
      Etiquetado: NOMBRE_ETIQUETADO[a.etiquetado],
      '¿Datos personales?': a.contiene_datos_personales ? 'Sí' : 'No',
      Confidencialidad: NOMBRE_CRITICIDAD[a.valor_confidencialidad],
      Integridad: NOMBRE_CRITICIDAD[a.valor_integridad],
      Disponibilidad: NOMBRE_CRITICIDAD[a.valor_disponibilidad],
      Puntaje: a.puntaje_valoracion,
      Criticidad: NOMBRE_CRITICIDAD[a.criticidad],
      Estado: NOMBRE_ESTADO[a.estado],
      'Fecha de baja': a.fecha_baja ?? '',
    }));

    const hoja = XLSX.utils.json_to_sheet(filas);
    hoja['!cols'] = Object.keys(filas[0]).map((clave) => ({
      wch: Math.max(clave.length, ...filas.map((f) => String(f[clave as keyof typeof f] ?? '').length)) + 2,
    }));
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Activos');

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(libro, `activos_${fecha}.xlsx`);
    message.success(`Se descargaron ${activosFiltrados.length} activos.`);
    onClose();
  }

  return (
    <Modal
      title="Descargar reporte de activos en Excel"
      open={open}
      onCancel={onClose}
      destroyOnHidden
      footer={
        <Space>
          <Button onClick={limpiarFiltros}>Limpiar filtros</Button>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={descargar}>
            Descargar ({activosFiltrados.length})
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">
        Elige los criterios que quieras (puedes dejar alguno vacío para no filtrar por ese
        criterio). El archivo se genera solo con los activos que cumplan con todos los
        criterios elegidos.
      </Typography.Paragraph>
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <div>
          <Typography.Text strong>Proceso</Typography.Text>
          <Select
            mode="multiple"
            allowClear
            style={{ width: '100%', marginTop: 4 }}
            placeholder="Todos los procesos"
            options={opcionesProceso.map((p) => ({ value: p, label: p }))}
            value={procesos}
            onChange={setProcesos}
          />
        </div>
        <div>
          <Typography.Text strong>Dirección</Typography.Text>
          <Select
            mode="multiple"
            allowClear
            style={{ width: '100%', marginTop: 4 }}
            placeholder="Todas las direcciones"
            options={opcionesDireccion.map((d) => ({ value: d, label: d }))}
            value={direcciones}
            onChange={setDirecciones}
          />
        </div>
        <div>
          <Typography.Text strong>Criticidad</Typography.Text>
          <Select
            mode="multiple"
            allowClear
            style={{ width: '100%', marginTop: 4 }}
            placeholder="Todas las criticidades"
            options={(['ALTA', 'MEDIA', 'BAJA'] as NivelValoracion[]).map((c) => ({
              value: c,
              label: NOMBRE_CRITICIDAD[c],
            }))}
            value={criticidades}
            onChange={setCriticidades}
          />
        </div>
        <div>
          <Typography.Text strong>Estado</Typography.Text>
          <Select
            mode="multiple"
            allowClear
            style={{ width: '100%', marginTop: 4 }}
            placeholder="Todos los estados"
            options={(['ACTIVO', 'EN_MANTENIMIENTO', 'RETIRADO'] as EstadoActivo[]).map((e) => ({
              value: e,
              label: NOMBRE_ESTADO[e],
            }))}
            value={estados}
            onChange={setEstados}
          />
        </div>
      </Space>
      <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
        <strong>{activosFiltrados.length}</strong> de {activos.length} activos coinciden con
        estos criterios.
      </Typography.Paragraph>
    </Modal>
  );
}
