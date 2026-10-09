import type { ClaseActivo, EstadoActivo, EtiquetadoActivo, NaturalezaActivo, NivelValoracion, TipoActivo } from './types';

export const NOMBRE_TIPO_ACTIVO: Record<TipoActivo, string> = {
  PRIMARIO: 'Primario',
  SECUNDARIO: 'Secundario',
};

export const NOMBRE_CLASE: Record<ClaseActivo, string> = {
  SISTEMAS_INFORMACION: 'Sistemas de Información',
  PERSONAL: 'Personal',
  SOFTWARE: 'Software',
  HARDWARE: 'Hardware',
  INFORMACION: 'Información',
  ESTRUCTURA_ORGANIZACION: 'Estructura de la organización',
  RED: 'Red',
};

export const NOMBRE_NATURALEZA: Record<NaturalezaActivo, string> = {
  FISICO: 'Físico',
  DIGITAL: 'Digital',
  SAAS: 'SaaS',
  IAAS: 'IaaS',
  PAAS: 'PaaS',
};

export const COLOR_ETIQUETADO: Record<EtiquetadoActivo, string> = {
  PUBLICO: 'default',
  PRIVADO: 'blue',
  CONFIDENCIAL: 'red',
};

export const COLOR_ESTADO: Record<EstadoActivo, string> = {
  ACTIVO: 'green',
  EN_MANTENIMIENTO: 'orange',
  RETIRADO: 'default',
};

export const COLOR_CRITICIDAD: Record<NivelValoracion, string> = {
  BAJA: 'green',
  MEDIA: 'gold',
  ALTA: 'red',
};

export const NOMBRE_CRITICIDAD: Record<NivelValoracion, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
};
