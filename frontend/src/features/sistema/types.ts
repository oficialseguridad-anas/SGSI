export interface InfoBackup {
  nombre: string;
  tamano_mb: number;
  fecha: number;
  total_backups: number;
}

export interface CategoriasBackups {
  base_datos: InfoBackup | null;
  media: InfoBackup | null;
  aplicacion: InfoBackup | null;
}

export interface EstadoBackups {
  backups: CategoriasBackups;
}

export interface ResultadoBackup {
  exito: boolean;
  salida: string;
  correo: string;
  backups: CategoriasBackups;
  error?: string;
}
