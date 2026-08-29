export type CategoriaControl = 'ORGANIZACIONAL' | 'PERSONAS' | 'FISICO' | 'TECNOLOGICO';
export type EstadoImplementacion = 'NO_IMPLEMENTADO' | 'PARCIAL' | 'IMPLEMENTADO';

export interface Control {
  id: number;
  codigo: string;
  nombre: string;
  categoria: CategoriaControl;
  descripcion: string;
}

export interface NumeralNorma {
  id: number;
  codigo: string;
  nombre: string;
  capitulo: string;
}

export interface AplicabilidadControl {
  id: number;
  control: number;
  control_codigo: string;
  control_nombre: string;
  control_descripcion: string;
  control_categoria: CategoriaControl;
  aplica: boolean;
  justificacion: string;
  estado_implementacion: EstadoImplementacion;
  referencia_documento: string;
  observaciones: string;
}

export interface AplicabilidadInput {
  control: number;
  aplica: boolean;
  justificacion: string;
  estado_implementacion: EstadoImplementacion;
  referencia_documento: string;
  observaciones: string;
}
