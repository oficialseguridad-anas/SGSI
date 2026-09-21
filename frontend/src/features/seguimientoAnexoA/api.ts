import { apiClient } from '../../shared/api/client';
import type {
  RespuestaChecklistAnexoA,
  RespuestaChecklistAnexoAInput,
  RespuestaChecklistPersonas,
  RespuestaChecklistPersonasInput,
  RevisionAnexoA,
  RevisionAnexoAInput,
  RevisionPersonas,
  RevisionPersonasInput,
} from './types';

export async function fetchRevisionesPersonas() {
  const { data } = await apiClient.get<{ results: RevisionPersonas[]; count: number }>('/revisiones-personas/');
  return data;
}

export async function crearRevisionPersonas(payload: RevisionPersonasInput) {
  const { data } = await apiClient.post<RevisionPersonas>('/revisiones-personas/', payload);
  return data;
}

export async function actualizarRevisionPersonas(id: number, payload: RevisionPersonasInput) {
  const { data } = await apiClient.put<RevisionPersonas>(`/revisiones-personas/${id}/`, payload);
  return data;
}

export async function eliminarRevisionPersonas(id: number) {
  await apiClient.delete(`/revisiones-personas/${id}/`);
}

export async function finalizarRevisionPersonas(id: number, finalizada: boolean) {
  const { data } = await apiClient.patch<RevisionPersonas>(`/revisiones-personas/${id}/`, { finalizada });
  return data;
}

export async function fetchRespuestasChecklistPersonas(revisionId: number) {
  const { data } = await apiClient.get<{ results: RespuestaChecklistPersonas[]; count: number }>(
    '/respuestas-checklist-personas/',
    { params: { revision: revisionId } },
  );
  return data;
}

export async function actualizarRespuestaChecklistPersonas(id: number, payload: RespuestaChecklistPersonasInput) {
  const { data } = await apiClient.patch<RespuestaChecklistPersonas>(
    `/respuestas-checklist-personas/${id}/`,
    payload,
  );
  return data;
}

// --- Fábrica de API para las 3 categorías nuevas del Anexo A (Organizacionales,
// Físicos, Tecnológicos): comparten exactamente la misma forma de endpoints
// (revisiones-<categoria>, preguntas-checklist-<categoria>,
// respuestas-checklist-<categoria>), así que en vez de repetir estas 6 funciones 3
// veces se generan a partir del prefijo de la categoría.
export interface ApiRevisionAnexoA {
  fetchRevisiones: () => Promise<{ results: RevisionAnexoA[]; count: number }>;
  crearRevision: (payload: RevisionAnexoAInput) => Promise<RevisionAnexoA>;
  actualizarRevision: (id: number, payload: RevisionAnexoAInput) => Promise<RevisionAnexoA>;
  eliminarRevision: (id: number) => Promise<void>;
  finalizarRevision: (id: number, finalizada: boolean) => Promise<RevisionAnexoA>;
  fetchRespuestasChecklist: (revisionId: number) => Promise<{ results: RespuestaChecklistAnexoA[]; count: number }>;
  actualizarRespuestaChecklist: (
    id: number,
    payload: RespuestaChecklistAnexoAInput,
  ) => Promise<RespuestaChecklistAnexoA>;
}

function crearApiRevisionAnexoA(prefijoCategoria: string): ApiRevisionAnexoA {
  const rutaRevisiones = `/revisiones-${prefijoCategoria}/`;
  const rutaRespuestas = `/respuestas-checklist-${prefijoCategoria}/`;
  return {
    async fetchRevisiones() {
      const { data } = await apiClient.get<{ results: RevisionAnexoA[]; count: number }>(rutaRevisiones);
      return data;
    },
    async crearRevision(payload) {
      const { data } = await apiClient.post<RevisionAnexoA>(rutaRevisiones, payload);
      return data;
    },
    async actualizarRevision(id, payload) {
      const { data } = await apiClient.put<RevisionAnexoA>(`${rutaRevisiones}${id}/`, payload);
      return data;
    },
    async eliminarRevision(id) {
      await apiClient.delete(`${rutaRevisiones}${id}/`);
    },
    async finalizarRevision(id, finalizada) {
      const { data } = await apiClient.patch<RevisionAnexoA>(`${rutaRevisiones}${id}/`, { finalizada });
      return data;
    },
    async fetchRespuestasChecklist(revisionId) {
      const { data } = await apiClient.get<{ results: RespuestaChecklistAnexoA[]; count: number }>(rutaRespuestas, {
        params: { revision: revisionId },
      });
      return data;
    },
    async actualizarRespuestaChecklist(id, payload) {
      const { data } = await apiClient.patch<RespuestaChecklistAnexoA>(`${rutaRespuestas}${id}/`, payload);
      return data;
    },
  };
}

export const apiOrganizacionales = crearApiRevisionAnexoA('organizacionales');
export const apiFisicos = crearApiRevisionAnexoA('fisicos');
export const apiTecnologicos = crearApiRevisionAnexoA('tecnologicos');
