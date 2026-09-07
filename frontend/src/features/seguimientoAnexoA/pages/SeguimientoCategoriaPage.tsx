import { Card, Empty, Typography } from 'antd';
import type { CategoriaControl } from '../../controles/types';
import { EncabezadoRevisionAnexoA } from '../components/EncabezadoRevisionAnexoA';
import { TablaCriteriosResultado } from '../components/TablaCriteriosResultado';

interface Props {
  categoria: CategoriaControl;
  titulo: string;
  rangoControles: string;
}

// Página aún sin estructura de datos propia: cada categoría del Anexo A tendrá su
// propio esquema de seguimiento definido más adelante — este componente es el
// contenedor de navegación listo para recibir esa estructura cuando se defina.
// El encabezado y la escala de calificación (C/CP/NC/NE) ya son comunes a las 4
// categorías, así que se muestran desde ya aunque el checklist propio todavía no exista.
export function SeguimientoCategoriaPage({ categoria, titulo, rangoControles }: Props) {
  void categoria;

  return (
    <Card>
      <EncabezadoRevisionAnexoA titulo={titulo} rangoControles={rangoControles} />
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
