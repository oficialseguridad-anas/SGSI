export type TipoDocumento = 'POLITICA' | 'PROCEDIMIENTO' | 'MANUAL' | 'FORMATO' | 'REGISTRO' | 'INSTRUCTIVO';
export type EstadoDocumento = 'BORRADOR' | 'EN_REVISION' | 'APROBADO' | 'VIGENTE' | 'OBSOLETO';

export interface VersionDocumento {
  id: number;
  documento: number;
  version: string;
  cambios: string;
  archivo: string | null;
  creado_por_nombre: string | null;
  creado_en: string;
}

export interface Documento {
  id: number;
  codigo: string;
  titulo: string;
  tipo: TipoDocumento;
  descripcion: string;
  version_actual: string;
  estado: EstadoDocumento;
  propietario: number;
  propietario_nombre: string;
  aprobado_por: number | null;
  aprobado_por_nombre: string | null;
  archivo: string | null;
  fecha_aprobacion: string | null;
  fecha_proxima_revision: string | null;
  versiones: VersionDocumento[];
}

export interface DocumentoInput {
  codigo: string;
  titulo: string;
  tipo: TipoDocumento;
  descripcion: string;
  version_actual: string;
  estado: EstadoDocumento;
  propietario: number;
  aprobado_por: number | null;
  fecha_aprobacion: string | null;
  fecha_proxima_revision: string | null;
  archivo: File | null;
}
