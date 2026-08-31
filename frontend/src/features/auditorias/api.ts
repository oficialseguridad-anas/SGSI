import { apiClient } from '../../shared/api/client';
import type {
  ArchivoAdjuntoSeguimiento,
  Hallazgo,
  HallazgoInput,
  SeguimientoHallazgo,
  SeguimientoHallazgoInput,
  TipoHallazgo,
} from './types';

export async function fetchHallazgos() {
  const { data } = await apiClient.get<{ results: Hallazgo[]; count: number }>('/hallazgos/');
  return data;
}

export async function crearHallazgo(payload: HallazgoInput) {
  const { data } = await apiClient.post<Hallazgo>('/hallazgos/', payload);
  return data;
}

export async function actualizarHallazgo(id: number, payload: HallazgoInput) {
  const { data } = await apiClient.put<Hallazgo>(`/hallazgos/${id}/`, payload);
  return data;
}

export async function eliminarHallazgo(id: number) {
  await apiClient.delete(`/hallazgos/${id}/`);
}

export async function fetchTiposHallazgo() {
  const { data } = await apiClient.get<{ results: TipoHallazgo[]; count: number }>('/tipos-hallazgo/');
  return data;
}

export async function fetchSeguimientos(hallazgoId: number) {
  const { data } = await apiClient.get<{ results: SeguimientoHallazgo[]; count: number }>('/seguimientos-hallazgo/', {
    params: { hallazgo: hallazgoId },
  });
  return data;
}

export async function crearSeguimiento(payload: SeguimientoHallazgoInput) {
  const { data } = await apiClient.post<SeguimientoHallazgo>('/seguimientos-hallazgo/', payload);
  return data;
}

export async function actualizarSeguimiento(id: number, payload: SeguimientoHallazgoInput) {
  const { data } = await apiClient.put<SeguimientoHallazgo>(`/seguimientos-hallazgo/${id}/`, payload);
  return data;
}

export async function eliminarSeguimiento(id: number) {
  await apiClient.delete(`/seguimientos-hallazgo/${id}/`);
}

export async function subirArchivoSeguimiento(seguimientoId: number, archivo: File) {
  const formData = new FormData();
  formData.append('seguimiento', String(seguimientoId));
  formData.append('archivo', archivo);
  const { data } = await apiClient.post<ArchivoAdjuntoSeguimiento>('/archivos-adjuntos-seguimiento/', formData);
  return data;
}

export async function eliminarArchivoSeguimiento(id: number) {
  await apiClient.delete(`/archivos-adjuntos-seguimiento/${id}/`);
}
