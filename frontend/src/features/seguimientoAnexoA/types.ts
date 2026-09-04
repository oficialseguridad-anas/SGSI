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
