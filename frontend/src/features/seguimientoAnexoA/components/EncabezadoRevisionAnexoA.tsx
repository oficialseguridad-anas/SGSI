import { Typography } from 'antd';
import { BRAND } from '../../../shared/theme/brand';

interface Props {
  titulo: string;
  rangoControles: string;
}

// Encabezado común a las 4 categorías del Anexo A (Organizacionales, Personas,
// Físicos, Tecnológicos) — mismo formato, solo cambian el título y el rango de
// controles de cada una.
export function EncabezadoRevisionAnexoA({ titulo, rangoControles }: Props) {
  return (
    <>
      <div style={{ borderLeft: `4px solid ${BRAND.teal}`, paddingLeft: 16 }}>
        <Typography.Title level={3} style={{ color: BRAND.tealDark, marginBottom: 4 }}>
          {titulo}
        </Typography.Title>
        <Typography.Text strong style={{ fontSize: 15 }}>
          Controles {rangoControles} — ISO/IEC 27001:2022
        </Typography.Text>
      </div>
      <Typography.Title level={5} style={{ textAlign: 'center', color: BRAND.teal, marginTop: 20 }}>
        ANAS WAYUU EPSI
      </Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 20 }}>
        Uso: guía de campo / checklist / registro de evidencia
      </Typography.Text>
      <div style={{ background: BRAND.bg, border: `1px solid ${BRAND.tealLight}33`, borderRadius: 6, padding: 16 }}>
        <Typography.Text strong style={{ color: BRAND.tealDark, display: 'block', marginBottom: 6 }}>
          Propósito del documento
        </Typography.Text>
        <Typography.Text>
          Servir como instrumento práctico para realizar una primera revisión de la implementación y eficacia de
          los controles {rangoControles} mediante muestreo, entrevistas, revisión documental y verificación de
          evidencias reales. No sustituye una auditoría formal del SGSI.
        </Typography.Text>
      </div>
    </>
  );
}
