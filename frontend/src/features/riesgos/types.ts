import type { NivelDeRiesgo } from './nivelRiesgo';

export type OrigenAmenaza = 'HUMANA_INTENCIONAL' | 'HUMANA_NO_INTENCIONAL' | 'TECNICA' | 'AMBIENTAL';

export interface Amenaza {
  id: number;
  nombre: string;
  descripcion: string;
  origen: OrigenAmenaza;
}

export interface TratamientoRiesgo {
  id: number;
  riesgo: number;
  opcion: 'MITIGAR' | 'TRANSFERIR' | 'EVITAR' | 'ACEPTAR';
  descripcion: string;
  responsable: number;
  responsable_nombre: string;
  fecha_limite: string | null;
  fecha_cierre: string | null;
  estado: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO' | 'VENCIDO';
  probabilidad_residual: number | null;
  impacto_residual: number | null;
  nivel_riesgo_residual: number | null;
}

export interface Riesgo {
  id: number;
  codigo: string;
  activos: number[];
  activos_nombres: string[];
  amenaza: number;
  amenaza_nombre: string;
  descripcion: string;
  probabilidad: number;
  impacto: number;
  riesgo_inherente: number;
  nivel_de_riesgo: NivelDeRiesgo;
  propietario_riesgo: number;
  propietario_nombre: string;
  controles: number[];
  esta_activo: boolean;
  fecha_identificacion: string;
  tratamientos: TratamientoRiesgo[];
}

export interface RiesgoInput {
  codigo: string;
  activos: number[];
  amenaza: number;
  descripcion: string;
  probabilidad: number;
  impacto: number;
  propietario_riesgo: number;
  controles: number[];
  esta_activo: boolean;
}

export interface AmenazaInput {
  nombre: string;
  descripcion: string;
  origen: OrigenAmenaza;
}
