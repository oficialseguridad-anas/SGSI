import { apiClient } from '../../shared/api/client';
import { descargarArchivo } from '../../shared/api/descargarArchivo';
import type {
  Auditoria,
  AuditoriaInput,
  ItemVerificacionAuditoria,
  MatrizPriorizacionAuditoria,
  MatrizPriorizacionAuditoriaInput,
  OportunidadPlanAuditoria,
  ProgramaAuditoria,
  ProgramaAuditoriaInput,
  RiesgoPlanAuditoria,
  SesionAuditoria,
} from './types';

// --- Matriz de Priorización ---

export async function fetchMatrizPriorizacion(anio?: number) {
  const { data } = await apiClient.get<{ results: MatrizPriorizacionAuditoria[]; count: number }>(
    '/matriz-priorizacion-auditoria/',
    { params: anio ? { anio } : undefined },
  );
  return data;
}

export async function crearMatrizPriorizacion(payload: MatrizPriorizacionAuditoriaInput) {
  const { data } = await apiClient.post<MatrizPriorizacionAuditoria>('/matriz-priorizacion-auditoria/', payload);
  return data;
}

export async function actualizarMatrizPriorizacion(id: number, payload: Partial<MatrizPriorizacionAuditoriaInput>) {
  const { data } = await apiClient.patch<MatrizPriorizacionAuditoria>(`/matriz-priorizacion-auditoria/${id}/`, payload);
  return data;
}

export async function eliminarMatrizPriorizacion(id: number) {
  await apiClient.delete(`/matriz-priorizacion-auditoria/${id}/`);
}

// --- Programa anual ---

export async function fetchProgramaAuditoria(anio?: number) {
  const { data } = await apiClient.get<{ results: ProgramaAuditoria[]; count: number }>('/programa-auditoria/', {
    params: anio ? { anio } : undefined,
  });
  return data;
}

export async function crearProgramaAuditoria(payload: ProgramaAuditoriaInput) {
  const { data } = await apiClient.post<ProgramaAuditoria>('/programa-auditoria/', payload);
  return data;
}

export async function actualizarProgramaAuditoria(id: number, payload: Partial<ProgramaAuditoriaInput>) {
  const { data } = await apiClient.patch<ProgramaAuditoria>(`/programa-auditoria/${id}/`, payload);
  return data;
}

export async function eliminarProgramaAuditoria(id: number) {
  await apiClient.delete(`/programa-auditoria/${id}/`);
}

export async function crearAuditoriaDesdePrograma(programaId: number) {
  const { data } = await apiClient.post<Auditoria>(`/programa-auditoria/${programaId}/crear-auditoria/`);
  return data;
}

// --- Auditorías ---

export async function fetchAuditorias(params?: Record<string, string | number>) {
  const { data } = await apiClient.get<{ results: Auditoria[]; count: number }>('/auditorias/', { params });
  return data;
}

export async function fetchAuditoria(id: number) {
  const { data } = await apiClient.get<Auditoria>(`/auditorias/${id}/`);
  return data;
}

export async function actualizarAuditoria(id: number, payload: AuditoriaInput) {
  const { data } = await apiClient.patch<Auditoria>(`/auditorias/${id}/`, payload);
  return data;
}

export async function crearAuditoriaExtraordinaria(payload: AuditoriaInput) {
  const { data } = await apiClient.post<Auditoria>('/auditorias/', { ...payload, tipo: 'EXTRAORDINARIA' });
  return data;
}

export async function eliminarAuditoria(id: number) {
  await apiClient.delete(`/auditorias/${id}/`);
}

export async function descargarInformeAuditoriaXlsx(id: number, codigo: string) {
  await descargarArchivo(`/auditorias/${id}/xlsx/`, `FO-860-22_informe_auditoria_${codigo}.xlsx`);
}

export async function descargarPlantillaPlanAuditoria() {
  await descargarArchivo('/auditorias-plantillas/plan/', 'FO-860-24_Plan_de_auditoria.xlsx');
}

export async function descargarPlantillaInformeAuditoria() {
  await descargarArchivo('/auditorias-plantillas/informe/', 'FO-860-22_Informe_de_auditoria_interna.xlsx');
}

// --- Riesgos / Oportunidades del plan ---

export async function crearRiesgoPlan(payload: Omit<RiesgoPlanAuditoria, 'id'>) {
  const { data } = await apiClient.post<RiesgoPlanAuditoria>('/riesgos-plan-auditoria/', payload);
  return data;
}

export async function eliminarRiesgoPlan(id: number) {
  await apiClient.delete(`/riesgos-plan-auditoria/${id}/`);
}

export async function crearOportunidadPlan(payload: Omit<OportunidadPlanAuditoria, 'id'>) {
  const { data } = await apiClient.post<OportunidadPlanAuditoria>('/oportunidades-plan-auditoria/', payload);
  return data;
}

export async function eliminarOportunidadPlan(id: number) {
  await apiClient.delete(`/oportunidades-plan-auditoria/${id}/`);
}

// --- Cronograma (sesiones) ---

export async function crearSesionAuditoria(payload: Omit<SesionAuditoria, 'id' | 'proceso_nombre' | 'auditor_nombre'>) {
  const { data } = await apiClient.post<SesionAuditoria>('/sesiones-auditoria/', payload);
  return data;
}

export async function actualizarSesionAuditoria(
  id: number,
  payload: Partial<Omit<SesionAuditoria, 'id' | 'proceso_nombre' | 'auditor_nombre'>>,
) {
  const { data } = await apiClient.patch<SesionAuditoria>(`/sesiones-auditoria/${id}/`, payload);
  return data;
}

export async function eliminarSesionAuditoria(id: number) {
  await apiClient.delete(`/sesiones-auditoria/${id}/`);
}

// --- Lista de verificación (checklist) ---

export async function crearItemVerificacion(
  payload: Omit<ItemVerificacionAuditoria, 'id' | 'proceso_sesion_nombre' | 'hallazgo_generado' | 'hallazgo_generado_codigo'>,
) {
  const { data } = await apiClient.post<ItemVerificacionAuditoria>('/items-verificacion-auditoria/', payload);
  return data;
}

export async function actualizarItemVerificacion(
  id: number,
  payload: Partial<Omit<ItemVerificacionAuditoria, 'id' | 'proceso_sesion_nombre' | 'hallazgo_generado' | 'hallazgo_generado_codigo'>>,
) {
  const { data } = await apiClient.patch<ItemVerificacionAuditoria>(`/items-verificacion-auditoria/${id}/`, payload);
  return data;
}

export async function eliminarItemVerificacion(id: number) {
  await apiClient.delete(`/items-verificacion-auditoria/${id}/`);
}

export async function fetchItemsVerificacion(auditoriaId: number) {
  const { data } = await apiClient.get<{ results: ItemVerificacionAuditoria[]; count: number }>(
    '/items-verificacion-auditoria/',
    { params: { auditoria: auditoriaId } },
  );
  return data;
}

/** Vincula (o desvincula, pasando null) un item del checklist a un Hallazgo ya
 * existente — distinto de "Generar hallazgo", que crea uno nuevo. Se usa desde el
 * módulo de Hallazgos para relacionar un hallazgo ya creado con el/los item(s) de la
 * lista de verificación que lo originaron. */
export async function vincularItemAHallazgo(itemId: number, hallazgoId: number | null) {
  const { data } = await apiClient.patch<ItemVerificacionAuditoria>(`/items-verificacion-auditoria/${itemId}/`, {
    hallazgo_generado: hallazgoId,
  });
  return data;
}

export async function generarHallazgoDesdeItem(id: number) {
  const { data } = await apiClient.post<ItemVerificacionAuditoria>(`/items-verificacion-auditoria/${id}/generar-hallazgo/`);
  return data;
}
