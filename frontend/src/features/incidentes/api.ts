import { apiClient } from '../../shared/api/client';
import type { ArchivoAdjuntoIncidente, Incidente, IncidenteInput } from './types';

export async function fetchIncidentes() {
  const { data } = await apiClient.get<{ results: Incidente[]; count: number }>('/incidentes/');
  return data;
}

export async function crearIncidente(payload: IncidenteInput) {
  const { data } = await apiClient.post<Incidente>('/incidentes/', payload);
  return data;
}

export async function actualizarIncidente(id: number, payload: IncidenteInput) {
  const { data } = await apiClient.put<Incidente>(`/incidentes/${id}/`, payload);
  return data;
}

export async function eliminarIncidente(id: number) {
  await apiClient.delete(`/incidentes/${id}/`);
}

export async function subirArchivoIncidente(incidenteId: number, archivo: File) {
  const formData = new FormData();
  formData.append('incidente', String(incidenteId));
  formData.append('archivo', archivo);
  const { data } = await apiClient.post<ArchivoAdjuntoIncidente>('/archivos-adjuntos-incidente/', formData);
  return data;
}

export async function eliminarArchivoIncidente(id: number) {
  await apiClient.delete(`/archivos-adjuntos-incidente/${id}/`);
}
