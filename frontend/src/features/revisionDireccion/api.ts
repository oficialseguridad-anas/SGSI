import { apiClient } from '../../shared/api/client';
import { descargarArchivo } from '../../shared/api/descargarArchivo';
import type {
  CompromisoRevisionDireccion,
  CompromisoRevisionDireccionInput,
  RevisionDireccion,
  RevisionDireccionInput,
} from './types';

export async function fetchRevisionesDireccion() {
  const { data } = await apiClient.get<{ results: RevisionDireccion[]; count: number }>('/revisiones-direccion/');
  return data;
}

export async function fetchRevisionDireccion(id: number) {
  const { data } = await apiClient.get<RevisionDireccion>(`/revisiones-direccion/${id}/`);
  return data;
}

export async function crearRevisionDireccion(payload: RevisionDireccionInput) {
  const { data } = await apiClient.post<RevisionDireccion>('/revisiones-direccion/', payload);
  return data;
}

export async function actualizarRevisionDireccion(id: number, payload: Partial<RevisionDireccionInput>) {
  const { data } = await apiClient.patch<RevisionDireccion>(`/revisiones-direccion/${id}/`, payload);
  return data;
}

export async function finalizarRevisionDireccion(id: number, finalizada: boolean) {
  const { data } = await apiClient.patch<RevisionDireccion>(`/revisiones-direccion/${id}/`, { finalizada });
  return data;
}

export async function eliminarRevisionDireccion(id: number) {
  await apiClient.delete(`/revisiones-direccion/${id}/`);
}

export async function descargarActaDocx(id: number, periodo: string) {
  await descargarArchivo(`/revisiones-direccion/${id}/docx/`, `acta_revision_direccion_${periodo}.docx`);
}

export async function crearCompromiso(payload: CompromisoRevisionDireccionInput) {
  const { data } = await apiClient.post<CompromisoRevisionDireccion>('/compromisos-revision-direccion/', payload);
  return data;
}

export async function actualizarCompromiso(id: number, payload: Partial<CompromisoRevisionDireccionInput>) {
  const { data } = await apiClient.patch<CompromisoRevisionDireccion>(
    `/compromisos-revision-direccion/${id}/`,
    payload,
  );
  return data;
}

export async function eliminarCompromiso(id: number) {
  await apiClient.delete(`/compromisos-revision-direccion/${id}/`);
}
