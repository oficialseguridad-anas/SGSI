import { apiClient } from '../../shared/api/client';
import type { AplicabilidadControl, AplicabilidadInput, Control } from './types';

export async function fetchSoa() {
  const { data } = await apiClient.get<{ results: AplicabilidadControl[]; count: number }>('/soa/');
  return data;
}

export async function fetchControlesCatalogo() {
  const { data } = await apiClient.get<{ results: Control[]; count: number }>('/controles/');
  return data;
}

export async function actualizarAplicabilidad(id: number, payload: AplicabilidadInput) {
  const { data } = await apiClient.put<AplicabilidadControl>(`/soa/${id}/`, payload);
  return data;
}
