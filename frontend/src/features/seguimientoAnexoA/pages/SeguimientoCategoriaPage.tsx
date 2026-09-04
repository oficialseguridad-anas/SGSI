import { Card, Empty, Typography } from 'antd';
import type { CategoriaControl } from '../../controles/types';

interface Props {
  categoria: CategoriaControl;
  titulo: string;
}

// Página aún sin estructura de datos propia: cada categoría del Anexo A tendrá su
// propio esquema de seguimiento definido más adelante — este componente es el
// contenedor de navegación listo para recibir esa estructura cuando se defina.
export function SeguimientoCategoriaPage({ categoria, titulo }: Props) {
  void categoria;

  return (
    <Card title={`Seguimiento Anexo A — ${titulo}`}>
      <Empty
        description={
          <Typography.Text type="secondary">
            Todavía no se ha definido la estructura de seguimiento para esta categoría.
          </Typography.Text>
        }
      />
    </Card>
  );
}
