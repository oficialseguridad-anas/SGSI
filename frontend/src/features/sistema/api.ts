import { apiClient } from '../../shared/api/client';
import type { EstadoBackups, ResultadoBackup } from './types';

export async function fetchEstadoBackups() {
  const { data } = await apiClient.get<EstadoBackups>('/sistema/backups/');
  return data;
}

export async function ejecutarBackup() {
  // Corre BACKUP DATABASE + zip de media + zip de la aplicación + envío del correo
  // de resumen: puede tardar cerca de un minuto, sin límite de tiempo propio aquí
  // (el backend sí cancela a los 10 minutos si algo se cuelga).
  const { data } = await apiClient.post<ResultadoBackup>('/sistema/backups/ejecutar/');
  return data;
}
