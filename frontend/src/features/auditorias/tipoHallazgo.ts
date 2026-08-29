// Texto fijo por código de TipoHallazgo — se muestra siempre este literal exacto en vez
// de confiar en el campo `nombre` que llega del servidor. Solo existen estos dos tipos en
// el catálogo (/api/v1/tipos-hallazgo/); si el código no está aquí, se usa `nombre` tal cual.
export const NOMBRE_TIPO_HALLAZGO: Record<string, string> = {
  NC: 'No conformidad',
  AM: 'Acción de mejora',
};
