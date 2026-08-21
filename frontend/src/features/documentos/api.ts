import { apiClient } from '../../shared/api/client';
import type { Documento, DocumentoInput } from './types';

export async function fetchDocumentos() {
  const { data } = await apiClient.get<{ results: Documento[]; count: number }>('/documentos/');
  return data;
}

function construirFormData(payload: DocumentoInput) {
  const formData = new FormData();
  Object.entries(payload).forEach(([clave, valor]) => {
    if (valor === null || valor === undefined) return;
    formData.append(clave, valor instanceof File ? valor : String(valor));
  });
  return formData;
}

export async function crearDocumento(payload: DocumentoInput) {
  const { data } = await apiClient.post<Documento>('/documentos/', construirFormData(payload));
  return data;
}

export async function actualizarDocumento(id: number, payload: DocumentoInput) {
  const { data } = await apiClient.put<Documento>(`/documentos/${id}/`, construirFormData(payload));
  return data;
}

export async function eliminarDocumento(id: number) {
  await apiClient.delete(`/documentos/${id}/`);
}
