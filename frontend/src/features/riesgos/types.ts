import type { NivelDeRiesgo } from './nivelRiesgo';

export type OrigenAmenaza = 'HUMANA_INTENCIONAL' | 'HUMANA_NO_INTENCIONAL' | 'TECNICA' | 'AMBIENTAL';

export interface Amenaza {
  id: number;
  nombre: string;
  descripcion: string;
  origen: OrigenAmenaza;
}

export type OpcionTratamiento = 'MITIGAR' | 'TRANSFERIR' | 'EVITAR' | 'ACEPTAR';
export type EstadoTratamiento = 'PENDIENTE' | 'VENCIDO' | 'COMPLETADO';

export interface ArchivoAdjuntoTratamiento {
  id: number;
  tratamiento: number;
  archivo: string;
  subido_en: string;
}

export interface TratamientoRiesgo {
  id: number;
  riesgo: number;
  opcion: OpcionTratamiento;
  descripcion: string;
  accion_mitigacion: string;
  recursos_necesarios: string;
  responsable: number;
  responsable_nombre: string;
  fecha_limite: string | null;
  fecha_cierre: string | null;
  fecha_proximo_seguimiento: string | null;
  evidencias_esperadas: string;
  archivos_adjuntos: ArchivoAdjuntoTratamiento[];
  estado: EstadoTratamiento;
  probabilidad_residual: number | null;
  impacto_residual: number | null;
  riesgo_residual: number | null;
  nivel_de_riesgo_residual: NivelDeRiesgo | null;
}

export interface TratamientoRiesgoInput {
  riesgo: number;
  opcion: OpcionTratamiento;
  descripcion: string;
  accion_mitigacion: string;
  recursos_necesarios: string;
  responsable: number;
  fecha_limite: string | null;
  fecha_cierre: string | null;
  fecha_proximo_seguimiento: string | null;
  evidencias_esperadas: string;
  probabilidad_residual: number | null;
  impacto_residual: number | null;
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
  propietario_riesgo: number | null;
  propietario_nombre: string | null;
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
