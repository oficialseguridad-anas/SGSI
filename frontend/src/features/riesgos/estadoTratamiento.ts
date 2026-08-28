export type EstadoTratamientoConSinTratar = 'SIN_TRATAMIENTO' | 'COMPLETADO' | 'PENDIENTE' | 'VENCIDO';

export const NOMBRE_ESTADO_TRATAMIENTO: Record<EstadoTratamientoConSinTratar, string> = {
  SIN_TRATAMIENTO: 'Sin tratamiento',
  COMPLETADO: 'Completado',
  PENDIENTE: 'Pendiente',
  VENCIDO: 'Vencido',
};

// Mismos colores que la gráfica "Estado del tratamiento" del Dashboard — orden fijo
// validado con el skill de dataviz (separa rojo/verde para que no queden adyacentes,
// ΔE 8.7, por encima del umbral de daltonismo).
export const COLOR_ESTADO_TRATAMIENTO: Record<EstadoTratamientoConSinTratar, string> = {
  SIN_TRATAMIENTO: '#52514e',
  COMPLETADO: '#008300',
  PENDIENTE: '#898781',
  VENCIDO: '#e34948',
};
export const CLARO_ESTADO_TRATAMIENTO: Record<EstadoTratamientoConSinTratar, string> = {
  SIN_TRATAMIENTO: '#c3c2b7',
  COMPLETADO: '#6fd66f',
  PENDIENTE: '#dedcd4',
  VENCIDO: '#f3a5a4',
};

// Color de texto con mejor contraste sobre cada relleno (medido con la fórmula WCAG,
// no supuesto — mismo criterio que TEXTO_NIVEL_RIESGO en nivelRiesgo.ts).
export const TEXTO_ESTADO_TRATAMIENTO: Record<EstadoTratamientoConSinTratar, string> = {
  SIN_TRATAMIENTO: '#ffffff',
  COMPLETADO: '#ffffff',
  PENDIENTE: '#1a1a1a',
  VENCIDO: '#1a1a1a',
};
