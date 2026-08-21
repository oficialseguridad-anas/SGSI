export interface NivelEscala {
  valor: number;
  nombre: string;
  descripcion: string;
}

export const ESCALA_PROBABILIDAD: NivelEscala[] = [
  { valor: 1, nombre: 'Muy Rara', descripcion: 'Puede ocurrir solo en circunstancias excepcionales (ej. < 1 vez al año).' },
  { valor: 2, nombre: 'Improbable', descripcion: 'Ha ocurrido en el sector, pero no en la empresa (ej. 1 vez al año).' },
  { valor: 3, nombre: 'Posible', descripcion: 'Podría ocurrir en cualquier momento (ej. cada semestre).' },
  { valor: 4, nombre: 'Probable', descripcion: 'Es probable que ocurra en la mayoría de las circunstancias (ej. mensual).' },
  { valor: 5, nombre: 'Casi Seguro', descripcion: 'Se espera que ocurra en la mayoría de las circunstancias (ej. semanal).' },
];

export const ESCALA_IMPACTO: NivelEscala[] = [
  { valor: 1, nombre: 'Insignificante', descripcion: 'Sin impacto en la operación; datos públicos o no críticos.' },
  { valor: 5, nombre: 'Menor', descripcion: 'Afectación mínima; recuperación rápida sin costo externo.' },
  { valor: 10, nombre: 'Moderado', descripcion: 'Interrupción parcial de servicios (ej. Citas); requiere esfuerzo extra.' },
  { valor: 15, nombre: 'Mayor', descripcion: 'Pérdida de integridad en datos médicos o financieros; multas bajas.' },
  { valor: 20, nombre: 'Catastrófico', descripcion: 'Fuga masiva de datos sensibles; multas legales altas (Ley 1581); cierre.' },
];

export function opcionesEscala(escala: NivelEscala[]) {
  return escala.map((n) => ({ value: n.valor, label: `${n.valor} - ${n.nombre}` }));
}

export function descripcionDe(escala: NivelEscala[], valor: number | undefined) {
  return escala.find((n) => n.valor === valor)?.descripcion;
}
