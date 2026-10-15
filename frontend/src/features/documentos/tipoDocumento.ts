import type { TipoDocumento } from './types';

export const NOMBRE_TIPO: Record<TipoDocumento, string> = {
  ALCANCE: 'Alcance',
  FORMATO: 'Formato',
  GUIA: 'Guía',
  INSTRUCTIVO: 'Instructivo',
  MANUAL: 'Manual',
  MATRIZ: 'Matriz',
  PLAN: 'Plan',
  POLITICA: 'Política',
  PROCEDIMIENTO: 'Procedimiento',
  PROGRAMA: 'Programa',
  PROTOCOLO: 'Protocolo',
  REGISTRO: 'Registro',
};

export const TIPOS_DOCUMENTO: TipoDocumento[] = [
  'ALCANCE', 'FORMATO', 'GUIA', 'INSTRUCTIVO', 'MANUAL', 'MATRIZ', 'PLAN',
  'POLITICA', 'PROCEDIMIENTO', 'PROGRAMA', 'PROTOCOLO', 'REGISTRO',
];
