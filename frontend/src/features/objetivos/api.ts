import { apiClient } from '../../shared/api/client';
import type {
  ActividadObjetivo,
  ActividadObjetivoInput,
  ArchivoAdjuntoActividad,
  Objetivo,
  ObjetivoInput,
} from './types';

export async function fetchObjetivos() {
  const { data } = await apiClient.get<{ results: Objetivo[]; count: number }>('/objetivos/');
  return data;
}

export async function crearObjetivo(payload: ObjetivoInput) {
  const { data } = await apiClient.post<Objetivo>('/objetivos/', payload);
  return data;
}

export async function actualizarObjetivo(id: number, payload: ObjetivoInput) {
  const { data } = await apiClient.put<Objetivo>(`/objetivos/${id}/`, payload);
  return data;
}

export async function eliminarObjetivo(id: number) {
  await apiClient.delete(`/objetivos/${id}/`);
}

export async function fetchActividades(objetivoId: number) {
  const { data } = await apiClient.get<{ results: ActividadObjetivo[]; count: number }>('/actividades-objetivo/', {
    params: { objetivo: objetivoId },
  });
  return data;
}

export async function crearActividad(payload: ActividadObjetivoInput) {
  const { data } = await apiClient.post<ActividadObjetivo>('/actividades-objetivo/', payload);
  return data;
}

export async function actualizarActividad(id: number, payload: ActividadObjetivoInput) {
  const { data } = await apiClient.put<ActividadObjetivo>(`/actividades-objetivo/${id}/`, payload);
  return data;
}

export async function eliminarActividad(id: number) {
  await apiClient.delete(`/actividades-objetivo/${id}/`);
}

export async function subirArchivoActividad(actividadId: number, archivo: File) {
  const formData = new FormData();
  formData.append('actividad', String(actividadId));
  formData.append('archivo', archivo);
  const { data } = await apiClient.post<ArchivoAdjuntoActividad>('/archivos-adjuntos-actividad/', formData);
  return data;
}

export async function eliminarArchivoActividad(id: number) {
  await apiClient.delete(`/archivos-adjuntos-actividad/${id}/`);
}
