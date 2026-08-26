import type { EstadoCumplimiento } from './types';

export interface FormulaRatio {
  etiquetaNumerador: string;
  etiquetaDenominador: string;
}

// Reconoce fórmulas del tipo "(numerador / denominador)*100" (con "\" o "×" como
// variantes de escritura vistas en los datos reales). Debe seguir la misma forma
// que `Indicador.formula_ratio` en backend/apps/indicadores/models.py.
const REGEX_FORMULA_RATIO = /^\(\s*(.+?)\s*[/\\]\s*(.+?)\s*\)\s*[*×xX]\s*100\s*$/;

export function parsearFormulaRatio(formula: string): FormulaRatio | null {
  const coincidencia = REGEX_FORMULA_RATIO.exec((formula ?? '').trim());
  if (!coincidencia) return null;
  return {
    etiquetaNumerador: coincidencia[1].trim(),
    etiquetaDenominador: coincidencia[2].trim(),
  };
}

export function calcularResultadoRatio(numerador: number | null, denominador: number | null): number | null {
  if (numerador === null || denominador === null || !denominador) return null;
  return Math.round((numerador / denominador) * 100 * 100) / 100;
}

export function extraerMetaNumerica(meta: string): number | null {
  const coincidencia = /(\d+(?:[.,]\d+)?)/.exec(meta ?? '');
  if (!coincidencia) return null;
  return parseFloat(coincidencia[1].replace(',', '.'));
}

export function calcularEstadoCumplimiento(resultado: number | null, meta: string): EstadoCumplimiento | null {
  const metaNumerica = extraerMetaNumerica(meta);
  if (resultado === null || metaNumerica === null) return null;
  if (resultado === metaNumerica) return 'CUMPLE';
  return resultado > metaNumerica ? 'POR_ENCIMA' : 'POR_DEBAJO';
}

export const COLOR_CUMPLIMIENTO: Record<EstadoCumplimiento, string> = {
  CUMPLE: 'green',
  POR_ENCIMA: 'blue',
  POR_DEBAJO: 'red',
};

export const NOMBRE_CUMPLIMIENTO: Record<EstadoCumplimiento, string> = {
  CUMPLE: 'Cumple',
  POR_ENCIMA: 'Por encima',
  POR_DEBAJO: 'Por debajo',
};
