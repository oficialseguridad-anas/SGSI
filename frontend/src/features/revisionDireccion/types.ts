export interface ResumenRiesgos {
  total: number;
  por_nivel: { BAJO: number; MEDIO: number; ALTO: number; CRITICO: number };
  tratamientos_pendientes: number;
  tratamientos_vencidos: number;
}

export interface ResumenHallazgos {
  total: number;
  por_estado: { ABIERTA: number; EN_PROCESO: number; CERRADA: number };
}

export interface ResumenObjetivos {
  total: number;
  actividades_por_estado: { PENDIENTE: number; VENCIDA: number; COMPLETADA: number };
}

export interface ResumenIndicadores {
  total: number;
  al_dia: number;
  cumple: number;
}

export interface CompromisoResumenAnterior {
  id: number;
  descripcion: string;
  responsable_nombre: string;
  estado: string;
  fecha_limite: string | null;
}

export interface ResumenDatosRevisionDireccion {
  riesgos: ResumenRiesgos;
  hallazgos: ResumenHallazgos;
  objetivos: ResumenObjetivos;
  indicadores: ResumenIndicadores;
  incidentes: { total: number };
  revision_anterior_periodo: string | null;
  revision_anterior_fecha: string | null;
  revision_anterior_conclusiones: string;
  compromisos_revision_anterior: CompromisoResumenAnterior[];
}

export type EstadoCompromiso = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';

export interface CompromisoRevisionDireccion {
  id: number;
  revision: number;
  revision_periodo: string;
  descripcion: string;
  responsable: number;
  responsable_nombre: string;
  fecha_limite: string | null;
  estado: EstadoCompromiso;
  esta_vencido: boolean;
  observaciones_cierre: string;
  creado_en: string;
  actualizado_en: string;
}

export interface CompromisoRevisionDireccionInput {
  revision: number;
  descripcion: string;
  responsable: number;
  fecha_limite: string | null;
  estado: EstadoCompromiso;
  observaciones_cierre?: string;
}

export interface RevisionDireccion {
  id: number;
  periodo: string;
  fecha_revision: string;
  preside: number;
  preside_nombre: string;
  asistentes: number[];
  asistentes_nombres: string[];
  lugar_modalidad: string;
  estado_acciones_previas: string;
  cambios_cuestiones_externas_internas: string;
  cambios_partes_interesadas: string;
  desempeno_no_conformidades: string;
  desempeno_seguimiento_medicion: string;
  desempeno_auditorias: string;
  desempeno_objetivos: string;
  retroalimentacion_partes_interesadas: string;
  resultados_riesgos: string;
  oportunidades_mejora: string;
  conclusiones_generales: string;
  finalizada: boolean;
  compromisos: CompromisoRevisionDireccion[];
  compromisos_pendientes_anteriores: CompromisoRevisionDireccion[];
  resumen_datos: ResumenDatosRevisionDireccion;
  creado_en: string;
  actualizado_en: string;
}

export interface RevisionDireccionInput {
  periodo: string;
  fecha_revision: string;
  preside: number;
  asistentes: number[];
  lugar_modalidad: string;
  estado_acciones_previas: string;
  cambios_cuestiones_externas_internas: string;
  cambios_partes_interesadas: string;
  desempeno_no_conformidades: string;
  desempeno_seguimiento_medicion: string;
  desempeno_auditorias: string;
  desempeno_objetivos: string;
  retroalimentacion_partes_interesadas: string;
  resultados_riesgos: string;
  oportunidades_mejora: string;
  conclusiones_generales: string;
}
