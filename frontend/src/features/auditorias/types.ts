export type EstadoHallazgo = 'ABIERTA' | 'EN_PROCESO' | 'CERRADA';
export type VerificacionEficacia = 'EFICAZ' | 'PARCIALMENTE_EFICAZ' | 'INEFICAZ' | 'NO_IMPLEMENTADO';

export interface TipoHallazgo {
  id: number;
  codigo: string;
  nombre: string;
}

export interface ArchivoAdjuntoSeguimiento {
  id: number;
  seguimiento: number;
  archivo: string;
  subido_en: string;
}

export interface SeguimientoHallazgo {
  id: number;
  hallazgo: number;
  accion_correctiva: string;
  fecha_compromiso: string | null;
  responsables: number[];
  responsables_nombres: string[];
  fecha_seguimiento: string | null;
  avance_notas: string;
  verificacion_eficacia: VerificacionEficacia;
  archivos_adjuntos: ArchivoAdjuntoSeguimiento[];
  creado_en: string;
  actualizado_en: string;
}

export interface SeguimientoHallazgoInput {
  hallazgo: number;
  accion_correctiva: string;
  fecha_compromiso: string | null;
  responsables: number[];
  fecha_seguimiento: string | null;
  avance_notas: string;
  verificacion_eficacia: VerificacionEficacia;
}

export interface Hallazgo {
  id: number;
  codigo: string;
  fecha_deteccion: string;
  procesos: number[];
  procesos_nombres: string[];
  tipos: number[];
  tipos_nombres: string[];
  tipos_codigos: string[];
  descripcion: string;
  evidencia_asociada: string;
  controles: number[];
  controles_codigos: string[];
  numerales: number[];
  numerales_codigos: string[];
  analisis_causa: string;
  estado: EstadoHallazgo;
  seguimientos: SeguimientoHallazgo[];
  creado_en: string;
  actualizado_en: string;
}

export interface HallazgoInput {
  fecha_deteccion: string;
  procesos: number[];
  tipos: number[];
  descripcion: string;
  evidencia_asociada: string;
  controles: number[];
  numerales: number[];
  analisis_causa: string;
}
