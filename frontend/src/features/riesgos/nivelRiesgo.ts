export type NivelDeRiesgo = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';

// Paleta de severidad para el mapa de calor: los 4 niveles aparecen dispersos por
// toda una grilla (probabilidad 1-5 x impacto 1-20, no solo adyacentes), así que
// se validó "todos contra todos" (--pairs all) para daltonismo y contraste
// normal — no la paleta de estado genérica, que falla esa validación más
// estricta entre Medio y Alto.
export const COLOR_NIVEL_RIESGO: Record<NivelDeRiesgo, string> = {
  BAJO: '#0f9488',
  MEDIO: '#e8c400',
  ALTO: '#e8720c',
  CRITICO: '#c62828',
};

// Color de texto con mejor contraste sobre cada fondo (medido, no supuesto).
export const TEXTO_NIVEL_RIESGO: Record<NivelDeRiesgo, string> = {
  BAJO: '#1a1a1a',
  MEDIO: '#1a1a1a',
  ALTO: '#1a1a1a',
  CRITICO: '#ffffff',
};

export const NOMBRE_NIVEL_RIESGO: Record<NivelDeRiesgo, string> = {
  BAJO: 'Bajo',
  MEDIO: 'Medio',
  ALTO: 'Alto',
  CRITICO: 'Crítico',
};

// Matriz de riesgo (probabilidad, impacto) -> nivel, igual a la matriz de referencia
// de la entidad. No es un simple umbral sobre el producto: p.ej. (Casi Seguro, Mayor)
// = 5x15 = 75 se clasifica igual como Crítico, no Alto, porque así lo define la
// matriz de referencia (celda marcada en rojo). Debe reflejar exactamente
// `Riesgo._MATRIZ_NIVEL_DE_RIESGO` en el backend.
const MATRIZ_NIVEL_DE_RIESGO: Record<string, NivelDeRiesgo> = {
  '1,1': 'BAJO', '1,5': 'BAJO', '1,10': 'BAJO', '1,15': 'MEDIO', '1,20': 'MEDIO',
  '2,1': 'BAJO', '2,5': 'BAJO', '2,10': 'MEDIO', '2,15': 'MEDIO', '2,20': 'ALTO',
  '3,1': 'BAJO', '3,5': 'BAJO', '3,10': 'MEDIO', '3,15': 'ALTO', '3,20': 'ALTO',
  '4,1': 'BAJO', '4,5': 'MEDIO', '4,10': 'ALTO', '4,15': 'ALTO', '4,20': 'CRITICO',
  '5,1': 'BAJO', '5,5': 'MEDIO', '5,10': 'ALTO', '5,15': 'CRITICO', '5,20': 'CRITICO',
};

/** Nivel de riesgo según la matriz de referencia (probabilidad x impacto). */
export function calcularNivelDeRiesgo(probabilidad: number, impacto: number): NivelDeRiesgo {
  return MATRIZ_NIVEL_DE_RIESGO[`${probabilidad},${impacto}`] ?? 'BAJO';
}
