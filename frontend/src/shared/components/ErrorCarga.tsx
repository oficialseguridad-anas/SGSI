import { Alert } from 'antd';

interface Props {
  /** true cuando la petición falló (isError de useQuery) — si no falló, no renderiza nada. */
  visible: boolean;
  /** Nombre de lo que se intentó cargar, en minúscula y con artículo: "los riesgos", "el indicador". */
  entidad: string;
}

/**
 * Sin esto, una petición fallida (sesión vencida, red caída, error del servidor) deja
 * la tabla vacía sin ningún aviso — se ve idéntico a "no hay datos todavía", lo que
 * hace parecer que un permiso no funciona cuando en realidad la petición nunca llegó
 * a responder con datos.
 */
export function ErrorCarga({ visible, entidad }: Props) {
  if (!visible) return null;
  return (
    <Alert
      type="error"
      showIcon
      message={`No se pudieron cargar ${entidad}`}
      description="Puede ser un problema de conexión o que tu sesión haya vencido. Recarga la página o vuelve a iniciar sesión; si el problema sigue, contacta al administrador."
      style={{ marginBottom: 16 }}
    />
  );
}
