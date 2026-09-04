// Escala de calificación del checklist de revisión de controles (Anexo A) — definida
// aquí una sola vez para que, cuando se construya el checklist en sí (fila por
// control), reutilice exactamente estos mismos valores en vez de redefinirlos.
export type ResultadoChecklist = 'C' | 'CP' | 'NC' | 'NE';

export const ORDEN_RESULTADO_CHECKLIST: ResultadoChecklist[] = ['C', 'CP', 'NC', 'NE'];

export const NOMBRE_RESULTADO_CHECKLIST: Record<ResultadoChecklist, string> = {
  C: 'C - Cumple',
  CP: 'CP - Cumple parcialmente',
  NC: 'NC - No cumple',
  NE: 'NE - No evidenciado',
};

export const CRITERIO_RESULTADO_CHECKLIST: Record<ResultadoChecklist, string> = {
  C: 'Existe lineamiento aplicable y evidencia suficiente, vigente y coherente que demuestra su implementación.',
  CP:
    'El control está diseñado o aplicado, pero existen faltantes de evidencia, inconsistencias, cobertura ' +
    'insuficiente o aplicación no uniforme.',
  NC: 'No existe control suficiente o la evidencia demuestra incumplimiento frente al requisito definido.',
  NE: 'Durante la revisión no se obtuvo evidencia suficiente para concluir; requiere validación posterior.',
};

// Semáforo sugerido para cuando el checklist muestre el resultado de cada control.
export const COLOR_RESULTADO_CHECKLIST: Record<ResultadoChecklist, string> = {
  C: 'green',
  CP: 'gold',
  NC: 'red',
  NE: 'default',
};
