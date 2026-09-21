export interface PorcentajeControlPersonas {
  control_codigo: string;
  control_nombre: string;
  porcentaje: number;
}

export interface RevisionPersonas {
  id: number;
  fecha_revision: string;
  revisor: number;
  revisor_nombre: string;
  responsable_talento_humano: number;
  responsable_talento_humano_nombre: string;
  responsable_tecnologia: number;
  responsable_tecnologia_nombre: string;
  muestra_seleccionada: string;
  finalizada: boolean;
  porcentaje_general: number | null;
  porcentajes_por_control: PorcentajeControlPersonas[];
  creado_en: string;
  actualizado_en: string;
}

export interface RevisionPersonasInput {
  fecha_revision: string;
  revisor: number;
  responsable_talento_humano: number;
  responsable_tecnologia: number;
  muestra_seleccionada: string;
}

export interface PreguntaChecklistPersonas {
  id: number;
  control_codigo: string;
  control_nombre: string;
  numero: number;
  texto: string;
}

export interface RespuestaChecklistPersonas {
  id: number;
  revision: number;
  pregunta: number;
  pregunta_numero: number;
  pregunta_texto: string;
  pregunta_control_codigo: string;
  pregunta_control_nombre: string;
  resultado: string;
  evidencia: string;
  creado_en: string;
  actualizado_en: string;
}

export interface RespuestaChecklistPersonasInput {
  resultado: string;
  evidencia: string;
}

// --- Forma genérica compartida por las 3 categorías nuevas del Anexo A
// (Organizacionales, Físicos, Tecnológicos): a diferencia de Personas, las 3 solo tienen
// un responsable (su etiqueta cambia por categoría, pero el nombre del campo es el
// mismo), así que comparten un único tipo en vez de uno por categoría.

export interface PorcentajeControlAnexoA {
  control_codigo: string;
  control_nombre: string;
  porcentaje: number;
}

export interface RevisionAnexoA {
  id: number;
  fecha_revision: string;
  revisor: number;
  revisor_nombre: string;
  responsable: number;
  responsable_nombre: string;
  muestra_seleccionada: string;
  finalizada: boolean;
  porcentaje_general: number | null;
  porcentajes_por_control: PorcentajeControlAnexoA[];
  creado_en: string;
  actualizado_en: string;
}

export interface RevisionAnexoAInput {
  fecha_revision: string;
  revisor: number;
  responsable: number;
  muestra_seleccionada: string;
}

export interface PreguntaChecklistAnexoA {
  id: number;
  control_codigo: string;
  control_nombre: string;
  numero: number;
  texto: string;
}

export interface RespuestaChecklistAnexoA {
  id: number;
  revision: number;
  pregunta: number;
  pregunta_numero: number;
  pregunta_texto: string;
  pregunta_control_codigo: string;
  pregunta_control_nombre: string;
  resultado: string;
  evidencia: string;
  creado_en: string;
  actualizado_en: string;
}

export interface RespuestaChecklistAnexoAInput {
  resultado: string;
  evidencia: string;
}
