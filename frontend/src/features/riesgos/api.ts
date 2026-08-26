import { apiClient } from '../../shared/api/client';
import type {
  ArchivoAdjuntoTratamiento,
  Amenaza,
  AmenazaInput,
  Riesgo,
  RiesgoInput,
  TratamientoRiesgo,
  TratamientoRiesgoInput,
} from './types';

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

export async function fetchTratamientos(riesgoId: number) {
  const { data } = await apiClient.get<{ results: TratamientoRiesgo[]; count: number }>('/tratamientos-riesgo/', {
    params: { riesgo: riesgoId },
  });
  return data;
}

export async function crearTratamiento(payload: TratamientoRiesgoInput) {
  const { data } = await apiClient.post<TratamientoRiesgo>('/tratamientos-riesgo/', payload);
  return data;
}

export async function actualizarTratamiento(id: number, payload: TratamientoRiesgoInput) {
  const { data } = await apiClient.put<TratamientoRiesgo>(`/tratamientos-riesgo/${id}/`, payload);
  return data;
}

export async function eliminarTratamiento(id: number) {
  await apiClient.delete(`/tratamientos-riesgo/${id}/`);
}

export async function subirArchivoTratamiento(tratamientoId: number, archivo: File) {
  const formData = new FormData();
  formData.append('tratamiento', String(tratamientoId));
  formData.append('archivo', archivo);
  const { data } = await apiClient.post<ArchivoAdjuntoTratamiento>('/archivos-adjuntos-tratamiento/', formData);
  return data;
}

export async function eliminarArchivoTratamiento(id: number) {
  await apiClient.delete(`/archivos-adjuntos-tratamiento/${id}/`);
}
