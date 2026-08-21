import { apiClient } from '../../shared/api/client';
import type { Amenaza, AmenazaInput, Riesgo, RiesgoInput } from './types';

export async function fetchRiesgos() {
  const { data } = await apiClient.get<{ results: Riesgo[]; count: number }>('/riesgos/');
  return data;
}

export async function crearRiesgo(payload: RiesgoInput) {
  const { data } = await apiClient.post<Riesgo>('/riesgos/', payload);
  return data;
}

export async function actualizarRiesgo(id: number, payload: RiesgoInput) {
  const { data } = await apiClient.put<Riesgo>(`/riesgos/${id}/`, payload);
  return data;
}

export async function eliminarRiesgo(id: number) {
  await apiClient.delete(`/riesgos/${id}/`);
}

export async function fetchAmenazas() {
  const { data } = await apiClient.get<{ results: Amenaza[]; count: number }>('/amenazas/');
  return data;
}

export async function crearAmenaza(payload: AmenazaInput) {
  const { data } = await apiClient.post<Amenaza>('/amenazas/', payload);
  return data;
}
