export type TipoActivo = 'PRIMARIO' | 'SECUNDARIO';
export type ClaseActivo =
  | 'SISTEMAS_INFORMACION'
  | 'PERSONAL'
  | 'SOFTWARE'
  | 'HARDWARE'
  | 'INFORMACION'
  | 'ESTRUCTURA_ORGANIZACION'
  | 'RED';
export type NaturalezaActivo = 'FISICO' | 'DIGITAL' | 'SAAS' | 'IAAS' | 'PAAS';
export type EtiquetadoActivo = 'PUBLICO' | 'PRIVADO' | 'CONFIDENCIAL';
export type NivelValoracion = 'ALTA' | 'MEDIA' | 'BAJA';
export type EstadoActivo = 'ACTIVO' | 'EN_MANTENIMIENTO' | 'RETIRADO';

export interface Proceso {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface Direccion {
  id: number;
  codigo: string;
  proceso: number | null;
  proceso_nombre: string | null;
  nombre: string;
  descripcion: string;
}

export interface Activo {
  id: number;
  codigo: string;
  proceso_nombre: string | null;
  direccion: number;
  direccion_nombre: string;
  nombre: string;
  descripcion: string;
  tipo_activo: TipoActivo;
  clase_activo: ClaseActivo;
  naturaleza: NaturalezaActivo;
  propietario: string;
  custodio: string;
  etiquetado: EtiquetadoActivo;
  contiene_datos_personales: boolean;
  valor_confidencialidad: NivelValoracion;
  valor_integridad: NivelValoracion;
  valor_disponibilidad: NivelValoracion;
  puntaje_valoracion: number;
  criticidad: NivelValoracion;
  estado: EstadoActivo;
  fecha_baja: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface ActivoInput {
  direccion: number;
  nombre: string;
  descripcion: string;
  tipo_activo: TipoActivo;
  clase_activo: ClaseActivo;
  naturaleza: NaturalezaActivo;
  propietario: string;
  custodio: string;
  etiquetado: EtiquetadoActivo;
  contiene_datos_personales: boolean;
  valor_confidencialidad: NivelValoracion;
  valor_integridad: NivelValoracion;
  valor_disponibilidad: NivelValoracion;
  estado: EstadoActivo;
  fecha_baja: string | null;
}

export interface ProcesoInput {
  nombre: string;
  descripcion: string;
}

export interface DireccionInput {
  codigo?: string;
  proceso: number | null;
  nombre: string;
  descripcion: string;
}
