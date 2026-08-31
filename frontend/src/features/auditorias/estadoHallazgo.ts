import type { EstadoHallazgo } from './types';

export const NOMBRE_ESTADO_HALLAZGO: Record<EstadoHallazgo, string> = {
  ABIERTA: 'Abierta',
  EN_PROCESO: 'En proceso',
  CERRADA: 'Cerrada',
};

// Mismo criterio de color que estadoTratamiento.ts (riesgos): rojo/gris/verde separados
// para no quedar adyacentes en la percepción de daltonismo.
export const COLOR_ESTADO_HALLAZGO: Record<EstadoHallazgo, string> = {
  ABIERTA: '#e34948',
  EN_PROCESO: '#898781',
  CERRADA: '#008300',
};

export const TEXTO_ESTADO_HALLAZGO: Record<EstadoHallazgo, string> = {
  ABIERTA: '#1a1a1a',
  EN_PROCESO: '#1a1a1a',
  CERRADA: '#ffffff',
};

// Mismos tonos claros que CLARO_ESTADO_TRATAMIENTO (riesgos) para los mismos colores base.
export const CLARO_ESTADO_HALLAZGO: Record<EstadoHallazgo, string> = {
  ABIERTA: '#f3a5a4',
  EN_PROCESO: '#c3c2b7',
  CERRADA: '#6fd66f',
};
