import { apiFisicos, apiOrganizacionales, apiTecnologicos, type ApiRevisionAnexoA } from './api';

// Une todo lo que varía de una categoría a otra del Anexo A (Organizacionales, Físicos,
// Tecnológicos) para que SeguimientoCategoriaPage, RevisionAnexoAFormModal y
// ChecklistAnexoAModal sean un único componente genérico reutilizado por las 3, en vez
// de triplicar cada uno. Personas no usa esta configuración: ya tenía sus propios
// componentes específicos (2 responsables) antes de que existiera este patrón genérico.
export interface ConfiguracionCategoriaAnexoA {
  titulo: string;
  rangoControles: string;
  responsableLabel: string;
  api: ApiRevisionAnexoA;
  queryKeyRevisiones: string;
  queryKeyRespuestas: string;
  permisoModelo: string;
}

export const CONFIG_ORGANIZACIONALES: ConfiguracionCategoriaAnexoA = {
  titulo: 'Revisión de los Controles Organizacionales de Seguridad de la Información',
  rangoControles: 'A.5.1 a A.5.37',
  responsableLabel: 'Responsable de Gestión de Procesos',
  api: apiOrganizacionales,
  queryKeyRevisiones: 'revisiones-organizacionales',
  queryKeyRespuestas: 'respuestas-checklist-organizacionales',
  permisoModelo: 'revisionorganizacionales',
};

export const CONFIG_FISICOS: ConfiguracionCategoriaAnexoA = {
  titulo: 'Revisión de los Controles Físicos de Seguridad de la Información',
  rangoControles: 'A.7.1 a A.7.14',
  responsableLabel: 'Responsable de Infraestructura y Recursos Físicos',
  api: apiFisicos,
  queryKeyRevisiones: 'revisiones-fisicos',
  queryKeyRespuestas: 'respuestas-checklist-fisicos',
  permisoModelo: 'revisionfisicos',
};

export const CONFIG_TECNOLOGICOS: ConfiguracionCategoriaAnexoA = {
  titulo: 'Revisión de los Controles Tecnológicos de Seguridad de la Información',
  rangoControles: 'A.8.1 a A.8.34',
  responsableLabel: 'Responsable de Tecnología',
  api: apiTecnologicos,
  queryKeyRevisiones: 'revisiones-tecnologicos',
  queryKeyRespuestas: 'respuestas-checklist-tecnologicos',
  permisoModelo: 'revisiontecnologicos',
};
