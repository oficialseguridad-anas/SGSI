import { apiClient } from '../../shared/api/client';
import type { Indicador, IndicadorInput, SeguimientoIndicador, SeguimientoIndicadorInput } from './types';

export async function fetchIndicadores() {
  const { data } = await apiClient.get<{ results: Indicador[]; count: number }>('/indicadores/');
  return data;
}

export async function crearIndicador(payload: IndicadorInput) {
  const { data } = await apiClient.post<Indicador>('/indicadores/', payload);
  return data;
}

export async function actualizarIndicador(id: number, payload: IndicadorInput) {
  const { data } = await apiClient.put<Indicador>(`/indicadores/${id}/`, payload);
  return data;
}

export async function eliminarIndicador(id: number) {
  await apiClient.delete(`/indicadores/${id}/`);
}

export async function fetchSeguimientos(indicadorId: number) {
  const { data } = await apiClient.get<{ results: SeguimientoIndicador[]; count: number }>(
    '/seguimientos-indicador/',
    { params: { indicador: indicadorId } },
  );
  return data;
}

function construirFormData(payload: SeguimientoIndicadorInput) {
  const formData = new FormData();
  Object.entries(payload).forEach(([clave, valor]) => {
    if (valor === null || valor === undefined) return;
    formData.append(clave, valor instanceof File ? valor : String(valor));
  });
  return formData;
}

export async function crearSeguimiento(payload: SeguimientoIndicadorInput) {
  const { data } = await apiClient.post<SeguimientoIndicador>('/seguimientos-indicador/', construirFormData(payload));
  return data;
}

export async function actualizarSeguimiento(id: number, payload: SeguimientoIndicadorInput) {
  const { data } = await apiClient.put<SeguimientoIndicador>(
    `/seguimientos-indicador/${id}/`,
    construirFormData(payload),
  );
  return data;
}

export async function eliminarSeguimiento(id: number) {
  await apiClient.delete(`/seguimientos-indicador/${id}/`);
}
