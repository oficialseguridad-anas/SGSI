export type TipoIncidente = 'EVENTO' | 'INCIDENTE';

export interface ArchivoAdjuntoIncidente {
  id: number;
  incidente: number;
  archivo: string;
  subido_en: string;
}

export interface Incidente {
  id: number;
  codigo: string;
  fecha: string;
  hora: string;
  nombre_evento: string;
  descripcion: string;
  tipo: TipoIncidente;
  fuente: string;
  responsable: number;
  responsable_nombre: string;
  registrado_por: number;
  registrado_por_nombre: string;
  archivos_adjuntos: ArchivoAdjuntoIncidente[];
  creado_en: string;
  actualizado_en: string;
}

export interface IncidenteInput {
  fecha: string;
  hora: string;
  nombre_evento: string;
  descripcion: string;
  tipo: TipoIncidente;
  fuente: string;
  responsable: number;
  registrado_por: number;
}
