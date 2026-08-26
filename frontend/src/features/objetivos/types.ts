export type EstadoEjecucionActividad = 'PENDIENTE' | 'VENCIDA' | 'COMPLETADA';
export type PeriodoActividad = 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | '';

export interface ArchivoAdjuntoActividad {
  id: number;
  actividad: number;
  archivo: string;
  subido_en: string;
}

export interface ActividadObjetivo {
  id: number;
  objetivo: number;
  actividad: string;
  responsables: string;
  recursos: string;
  periodo: PeriodoActividad;
  plazo: string | null;
  estado_ejecucion: EstadoEjecucionActividad;
  archivos_adjuntos: ArchivoAdjuntoActividad[];
}

export interface ActividadObjetivoInput {
  objetivo: number;
  actividad: string;
  responsables: string;
  recursos: string;
  periodo: PeriodoActividad;
  plazo: string | null;
}

export interface Objetivo {
  id: number;
  objetivo: string;
  componente_politica: string;
  procesos_asociados: number[];
  procesos_nombres: string[];
  responsables_seguimiento: string;
  indicador_desempeno: string;
  indicadores: number[];
  indicadores_codigos: string[];
  indicadores_nombres: string[];
  meta_indicador: string;
  actividades: ActividadObjetivo[];
}

export interface ObjetivoInput {
  objetivo: string;
  componente_politica: string;
  procesos_asociados: number[];
  responsables_seguimiento: string;
  indicador_desempeno: string;
  indicadores: number[];
  meta_indicador: string;
}
