export type CategoriaControl = 'ORGANIZACIONAL' | 'PERSONAS' | 'FISICO' | 'TECNOLOGICO';
export type EstadoImplementacion = 'NO_IMPLEMENTADO' | 'PARCIAL' | 'IMPLEMENTADO' | 'NO_APLICA';

export interface Control {
  id: number;
  codigo: string;
  nombre: string;
  categoria: CategoriaControl;
  descripcion: string;
}

export interface AplicabilidadControl {
  id: number;
  control: number;
  control_codigo: string;
  control_nombre: string;
  control_categoria: CategoriaControl;
  aplica: boolean;
  justificacion: string;
  estado_implementacion: EstadoImplementacion;
  evidencia: string;
  responsable: number | null;
  responsable_nombre: string | null;
  fecha_ultima_revision: string | null;
}

export interface AplicabilidadInput {
  control: number;
  aplica: boolean;
  justificacion: string;
  estado_implementacion: EstadoImplementacion;
  evidencia: string;
  responsable: number | null;
  fecha_ultima_revision: string | null;
}
