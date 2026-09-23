export type Prioridad = 'ALTA' | 'MEDIA' | 'BAJA';

export interface MatrizPriorizacionAuditoria {
  id: number;
  proceso: number;
  proceso_nombre: string;
  anio: number;
  criticidad: number;
  auditorias_previas: number;
  cambios: number;
  incidentes: number;
  legales: number;
  relevancia: number;
  riesgo_residual: number;
  puntaje_final: number;
  prioridad: Prioridad;
  creado_en: string;
  actualizado_en: string;
}

export interface MatrizPriorizacionAuditoriaInput {
  proceso: number;
  anio: number;
  criticidad: number;
  auditorias_previas: number;
  cambios: number;
  incidentes: number;
  legales: number;
  relevancia: number;
  riesgo_residual: number;
}

export type TipoProgramaAuditoria = 'INTERNA' | 'EXTERNA';

export interface ProgramaAuditoria {
  id: number;
  anio: number;
  tipo: TipoProgramaAuditoria;
  proceso: number | null;
  proceso_nombre: string | null;
  auditado: string;
  procedimiento: string;
  servicio_o_proyecto: string;
  auditor_lider: number | null;
  auditor_lider_nombre: string | null;
  mes_planeado: number | null;
  mes_planeado_display: string | null;
  tiene_auditoria: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface ProgramaAuditoriaInput {
  anio: number;
  tipo: TipoProgramaAuditoria;
  proceso: number | null;
  auditado: string;
  procedimiento: string;
  servicio_o_proyecto: string;
  auditor_lider: number | null;
  mes_planeado: number | null;
}

export type EstadoAuditoria = 'PLANIFICADA' | 'EN_EJECUCION' | 'CERRADA';
export type TipoAuditoria = 'ORDINARIA' | 'EXTRAORDINARIA';

export interface RiesgoPlanAuditoria {
  id: number;
  auditoria: number;
  nombre_riesgo: string;
  accion_control: string;
  // Texto libre, no FK: el FO-860-24 real combina varios roles en una celda (ej.
  // "Auditor líder\nLíder del SGSI"), no una persona puntual del sistema.
  responsable: string;
  evidencia: string;
}

export interface OportunidadPlanAuditoria {
  id: number;
  auditoria: number;
  nombre_oportunidad: string;
  medida_aprovechar: string;
  responsable: string;
  evidencia: string;
}

export interface SesionAuditoria {
  id: number;
  auditoria: number;
  ciudad: string;
  fecha: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  proceso: number | null;
  proceso_nombre: string | null;
  // Cuando el tema auditado no corresponde a un proceso exacto del catálogo (ej.
  // "Gestión de Riesgos de Seguridad de la Información", "Seguridad terceros").
  tema: string;
  procedimiento: string;
  requisitos_a_auditar: string;
  auditado: string;
  auditor: number | null;
  auditor_nombre: string | null;
}

export type EtapaItemVerificacion = 'P' | 'H' | 'V' | 'A';
export type TipoHallazgoChecklist = 'CONFORMIDAD' | 'NO_CONFORMIDAD' | 'OPORTUNIDAD_MEJORA' | 'FORTALEZA' | '';

export interface ItemVerificacionAuditoria {
  id: number;
  auditoria: number;
  sesion: number | null;
  proceso_sesion_nombre: string | null;
  etapa: EtapaItemVerificacion | '';
  descripcion_elemento: string;
  requisito_iso: string;
  otros_requisitos: string;
  tipo_hallazgo: TipoHallazgoChecklist;
  descripcion_hallazgo: string;
  hallazgo_generado: number | null;
  hallazgo_generado_codigo: string | null;
}

export interface Auditoria {
  id: number;
  codigo: string;
  programa: number | null;
  programa_descripcion: string | null;
  tipo: TipoAuditoria;
  estado: EstadoAuditoria;
  objetivo: string;
  alcance: string;
  criterios: string;
  metodologia: string;
  numero_auditados: number | null;
  numero_auditores: number | null;
  auditor_lider: number | null;
  auditor_lider_nombre: string | null;
  equipo_auditor: number[];
  equipo_auditor_nombres: string[];
  ciudad: string;
  fecha_auditoria: string | null;
  fecha_elaboracion_informe: string | null;
  conclusiones_generales: string;
  aprobado_por: number | null;
  aprobado_por_nombre: string | null;
  procesos_auditados_nombres: string[];
  riesgos_plan: RiesgoPlanAuditoria[];
  oportunidades_plan: OportunidadPlanAuditoria[];
  sesiones: SesionAuditoria[];
  items_verificacion: ItemVerificacionAuditoria[];
  total_hallazgos: number;
  creado_en: string;
  actualizado_en: string;
}

export interface AuditoriaInput {
  tipo?: TipoAuditoria;
  estado?: EstadoAuditoria;
  objetivo?: string;
  alcance?: string;
  criterios?: string;
  metodologia?: string;
  numero_auditados?: number | null;
  numero_auditores?: number | null;
  auditor_lider?: number | null;
  equipo_auditor?: number[];
  ciudad?: string;
  fecha_auditoria?: string | null;
  fecha_elaboracion_informe?: string | null;
  conclusiones_generales?: string;
  aprobado_por?: number | null;
}
