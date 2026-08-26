export type TipoIndicador = 'EFICACIA' | 'CULTURA_RESULTADO' | 'PREVENTIVO_OPERATIVO' | 'CONTINUIDAD_OPERATIVO';
export type FrecuenciaIndicador = 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
export type EstadoCumplimiento = 'CUMPLE' | 'POR_ENCIMA' | 'POR_DEBAJO';

export interface Indicador {
  id: number;
  codigo: string;
  tipo: TipoIndicador;
  nombre: string;
  objetivo: string;
  unidad_medida: string;
  descripcion: string;
  formula: string;
  frecuencia: FrecuenciaIndicador;
  responsable_medicion: string;
  correo_propietario: string;
  meta: string;
  fuente_datos: string;
  responsable_analisis: string;
  analisis: string;
  accion: string;
  seguimientos_count: number;
  seguimiento_al_dia: boolean;
  cumplimiento_actual: EstadoCumplimiento | null;
}

export interface SeguimientoIndicador {
  id: number;
  indicador: number;
  indicador_codigo: string;
  indicador_nombre: string;
  indicador_meta: string;
  indicador_unidad_medida: string;
  periodo: string;
  fecha_cargue: string;
  numerador: number | null;
  denominador: number | null;
  resultado: number | null;
  estado_cumplimiento: EstadoCumplimiento | null;
  observaciones: string;
  archivo_soporte: string | null;
}

export interface SeguimientoIndicadorInput {
  indicador: number;
  periodo: string;
  fecha_cargue: string | null;
  numerador: number | null;
  denominador: number | null;
  resultado: number | null;
  observaciones: string;
  archivo_soporte: File | null;
}

export interface IndicadorInput {
  codigo: string;
  tipo: TipoIndicador;
  nombre: string;
  objetivo: string;
  unidad_medida: string;
  descripcion: string;
  formula: string;
  frecuencia: FrecuenciaIndicador;
  responsable_medicion: string;
  correo_propietario: string;
  meta: string;
  fuente_datos: string;
  responsable_analisis: string;
  analisis: string;
  accion: string;
}
