import { apiClient } from '../../shared/api/client';
import type {
  Activo,
  ActivoInput,
  Direccion,
  DireccionInput,
  Proceso,
  ProcesoInput,
  RevisionSemestralActivos,
  RevisionSemestralActivosInput,
  SnapshotActivo,
} from './types';

export async function fetchActivos() {
  const { data } = await apiClient.get<{ results: Activo[]; count: number }>('/activos/');
  return data;
}

export async function crearActivo(payload: ActivoInput) {
  const { data } = await apiClient.post<Activo>('/activos/', payload);
  return data;
}

export async function actualizarActivo(id: number, payload: ActivoInput) {
  const { data } = await apiClient.put<Activo>(`/activos/${id}/`, payload);
  return data;
}

export async function eliminarActivo(id: number) {
  await apiClient.delete(`/activos/${id}/`);
}

export async function fetchProcesos() {
  const { data } = await apiClient.get<{ results: Proceso[]; count: number }>('/procesos/');
  return data;
}

export async function crearProceso(payload: ProcesoInput) {
  const { data } = await apiClient.post<Proceso>('/procesos/', payload);
  return data;
}

export async function fetchDirecciones(proceso?: number) {
  const { data } = await apiClient.get<{ results: Direccion[]; count: number }>('/direcciones/', {
    params: proceso ? { proceso } : undefined,
  });
  return data;
}

export async function crearDireccion(payload: DireccionInput) {
  const { data } = await apiClient.post<Direccion>('/direcciones/', payload);
  return data;
}

export async function fetchRevisionesActivos() {
  const { data } = await apiClient.get<{ results: RevisionSemestralActivos[]; count: number }>(
    '/revisiones-activos/',
  );
  return data;
}

export async function crearRevisionActivos(payload: RevisionSemestralActivosInput) {
  const { data } = await apiClient.post<RevisionSemestralActivos>('/revisiones-activos/', payload);
  return data;
}

export async function eliminarRevisionActivos(id: number) {
  await apiClient.delete(`/revisiones-activos/${id}/`);
}

export async function fetchSnapshotsActivo(revisionId: number) {
  const { data } = await apiClient.get<{ results: SnapshotActivo[]; count: number }>('/snapshots-activo/', {
    params: { revision: revisionId },
  });
  return data;
}
