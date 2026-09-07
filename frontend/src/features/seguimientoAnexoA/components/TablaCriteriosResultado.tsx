import { Typography } from 'antd';
import { BRAND } from '../../../shared/theme/brand';
import { CRITERIO_RESULTADO_CHECKLIST, NOMBRE_RESULTADO_CHECKLIST, ORDEN_RESULTADO_CHECKLIST } from '../resultadoChecklist';

// Tabla de referencia de la escala C/CP/NC/NE, compartida por las 4 categorías del
// Anexo A (Organizacionales, Personas, Físicos, Tecnológicos) — misma escala para todas.
export function TablaCriteriosResultado() {
  return (
    <>
      <Typography.Title level={4} style={{ color: BRAND.tealDark, marginTop: 28, marginBottom: 12 }}>
        Criterios para calificar el resultado
      </Typography.Title>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th
                style={{
                  background: BRAND.tealDark,
                  color: '#fff',
                  textAlign: 'left',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  width: 200,
                }}
              >
                Resultado
              </th>
              <th
                style={{
                  background: BRAND.tealDark,
                  color: '#fff',
                  textAlign: 'left',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                }}
              >
                Criterio de uso
              </th>
            </tr>
          </thead>
          <tbody>
            {ORDEN_RESULTADO_CHECKLIST.map((clave) => (
              <tr key={clave}>
                <td style={{ padding: '8px 12px', border: '1px solid #d9d9d9', fontWeight: 600 }}>
                  {NOMBRE_RESULTADO_CHECKLIST[clave]}
                </td>
                <td style={{ padding: '8px 12px', border: '1px solid #d9d9d9' }}>
                  {CRITERIO_RESULTADO_CHECKLIST[clave]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
