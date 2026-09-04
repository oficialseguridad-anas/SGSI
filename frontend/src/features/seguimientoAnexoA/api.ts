import { apiClient } from '../../shared/api/client';
import type {
  RespuestaChecklistPersonas,
  RespuestaChecklistPersonasInput,
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
