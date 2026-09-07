import { Card, Empty, Typography } from 'antd';
import type { CategoriaControl } from '../../controles/types';
import { TablaCriteriosResultado } from '../components/TablaCriteriosResultado';

interface Props {
  categoria: CategoriaControl;
  titulo: string;
}

// Página aún sin estructura de datos propia: cada categoría del Anexo A tendrá su
// propio esquema de seguimiento definido más adelante — este componente es el
// contenedor de navegación listo para recibir esa estructura cuando se defina.
// La escala de calificación (C/CP/NC/NE) ya es común a las 4 categorías, así que se
// muestra desde ya como referencia aunque el checklist propio todavía no exista.
export function SeguimientoCategoriaPage({ categoria, titulo }: Props) {
  void categoria;

  return (
    <Card title={`Seguimiento Anexo A — ${titulo}`}>
      <TablaCriteriosResultado />
      <Empty
        style={{ marginTop: 28 }}
        description={
          <Typography.Text type="secondary">
            Todavía no se ha definido el checklist de revisión para esta categoría.
          </Typography.Text>
        }
      />
    </Card>
  );
}
