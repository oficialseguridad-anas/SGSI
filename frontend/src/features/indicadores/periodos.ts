import type { FrecuenciaIndicador } from './types';

export interface OpcionPeriodo {
  value: string;
  label: string;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Etiqueta del selector de sub-periodo, según la frecuencia del indicador. */
export function etiquetaSubperiodo(frecuencia: FrecuenciaIndicador): string {
  switch (frecuencia) {
    case 'MENSUAL':
      return 'Mes';
    case 'TRIMESTRAL':
      return 'Trimestre';
    case 'SEMESTRAL':
      return 'Semestre';
    case 'ANUAL':
      return '';
  }
}

/** Opciones de sub-periodo dentro de un año, según la frecuencia del indicador. Vacío para Anual. */
export function opcionesSubperiodo(frecuencia: FrecuenciaIndicador): OpcionPeriodo[] {
  switch (frecuencia) {
    case 'MENSUAL':
      return MESES.map((mes, i) => ({ value: String(i + 1).padStart(2, '0'), label: mes }));
    case 'TRIMESTRAL':
      return [
        { value: 'T1', label: 'Trimestre 1 (Ene - Mar)' },
        { value: 'T2', label: 'Trimestre 2 (Abr - Jun)' },
        { value: 'T3', label: 'Trimestre 3 (Jul - Sep)' },
        { value: 'T4', label: 'Trimestre 4 (Oct - Dic)' },
      ];
    case 'SEMESTRAL':
      return [
        { value: 'S1', label: 'Semestre 1 (Ene - Jun)' },
        { value: 'S2', label: 'Semestre 2 (Jul - Dic)' },
      ];
    case 'ANUAL':
      return [];
  }
}

/** Construye el texto de periodo guardado (ej. "2026-S1", "2026-T3", "2026-04", "2026"). */
export function construirPeriodo(frecuencia: FrecuenciaIndicador, anio: number, subperiodo: string | null): string {
  if (frecuencia === 'ANUAL' || !subperiodo) return String(anio);
  return `${anio}-${subperiodo}`;
}

/** Descompone un texto de periodo guardado en año + sub-periodo, según la frecuencia. */
export function parsearPeriodo(
  frecuencia: FrecuenciaIndicador,
  periodo: string,
  anioPorDefecto: number,
): { anio: number; subperiodo: string | null } {
  if (frecuencia === 'ANUAL' || !periodo.includes('-')) {
    const anio = Number(periodo);
    return { anio: Number.isFinite(anio) && anio > 0 ? anio : anioPorDefecto, subperiodo: null };
  }
  const [anioTexto, subperiodo] = periodo.split('-');
  const anio = Number(anioTexto);
  return { anio: Number.isFinite(anio) && anio > 0 ? anio : anioPorDefecto, subperiodo: subperiodo ?? null };
}
