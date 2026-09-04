import type { TipoIncidente } from './types';

export const NOMBRE_TIPO_INCIDENTE: Record<TipoIncidente, string> = {
  EVENTO: 'Evento',
  INCIDENTE: 'Incidente',
};

// Un incidente es más grave que un evento (un evento es solo una ocurrencia observada;
// un incidente ya comprometió la seguridad de la información) — por eso el color de
// mayor alerta va en INCIDENTE, no en EVENTO.
export const COLOR_TIPO_INCIDENTE: Record<TipoIncidente, string> = {
  EVENTO: 'gold',
  INCIDENTE: 'red',
};
