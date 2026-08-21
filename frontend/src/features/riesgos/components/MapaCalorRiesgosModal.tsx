import { Modal, Typography } from 'antd';
import { Fragment } from 'react';
import { ESCALA_IMPACTO, ESCALA_PROBABILIDAD } from '../escalasRiesgo';
import {
  calcularNivelDeRiesgo,
  COLOR_NIVEL_RIESGO,
  NOMBRE_NIVEL_RIESGO,
  TEXTO_NIVEL_RIESGO,
  type NivelDeRiesgo,
} from '../nivelRiesgo';

const NIVELES: NivelDeRiesgo[] = ['BAJO', 'MEDIO', 'ALTO', 'CRITICO'];

const RANGO: Record<NivelDeRiesgo, string> = {
  BAJO: '1 - 15',
  MEDIO: '16 - 30',
  ALTO: '31 - 75',
  CRITICO: '76 - 100',
};

const ACCION_REQUERIDA: Record<NivelDeRiesgo, string> = {
  BAJO: 'Riesgo aceptable; solo monitoreo.',
  MEDIO: 'Riesgo tolerable; requiere controles preventivos.',
  ALTO: 'Riesgo significativo; requiere plan de tratamiento urgente.',
  CRITICO: 'Riesgo inaceptable; detener operación o mitigar de inmediato.',
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MapaCalorRiesgosModal({ open, onClose }: Props) {
  const probabilidades = ESCALA_PROBABILIDAD.slice().reverse();

  return (
    <Modal title="Mapa de calor de riesgo inherente" open={open} onCancel={onClose} footer={null} width={780}>
      <Typography.Paragraph type="secondary">
        Riesgo inherente = Probabilidad × Impacto. Tabla de consulta para valorar el nivel de riesgo, según la
        matriz de referencia de la entidad (ISO/IEC 27005).
      </Typography.Paragraph>

      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `160px repeat(${ESCALA_IMPACTO.length}, 1fr)`,
            gap: 2,
            minWidth: 640,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#52514e',
              display: 'flex',
              alignItems: 'flex-end',
            }}
          >
            Probabilidad \ Impacto
          </div>
          {ESCALA_IMPACTO.map((i) => (
            <div key={`i-${i.valor}`} style={{ textAlign: 'center', fontWeight: 600, fontSize: 12 }}>
              {i.valor} ({i.nombre})
            </div>
          ))}

          {probabilidades.map((p) => (
            <Fragment key={p.valor}>
              <div style={{ fontWeight: 600, fontSize: 13, alignSelf: 'center' }}>
                {p.valor} ({p.nombre})
              </div>
              {ESCALA_IMPACTO.map((i) => {
                const valor = p.valor * i.valor;
                const nivel = calcularNivelDeRiesgo(p.valor, i.valor);
                return (
                  <div
                    key={`${p.valor}-${i.valor}`}
                    title={`Probabilidad ${p.nombre} × Impacto ${i.nombre} = ${valor} (${NOMBRE_NIVEL_RIESGO[nivel]})`}
                    style={{
                      background: COLOR_NIVEL_RIESGO[nivel],
                      color: TEXTO_NIVEL_RIESGO[nivel],
                      textAlign: 'center',
                      padding: '10px 0',
                      fontSize: 14,
                      fontWeight: 700,
                      borderRadius: 2,
                    }}
                  >
                    {valor}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#52514e', borderBottom: '1px solid #e1e0d9' }}>
            <th style={{ padding: '6px 8px', fontWeight: 500 }}>Resultado (P × I)</th>
            <th style={{ padding: '6px 8px', fontWeight: 500 }}>Nivel de riesgo</th>
            <th style={{ padding: '6px 8px', fontWeight: 500 }}>Acción requerida</th>
          </tr>
        </thead>
        <tbody>
          {NIVELES.map((nivel) => (
            <tr key={nivel} style={{ borderBottom: '1px solid #f0efec' }}>
              <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums' }}>{RANGO[nivel]}</td>
              <td style={{ padding: '6px 8px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: COLOR_NIVEL_RIESGO[nivel],
                    marginRight: 8,
                  }}
                />
                {NOMBRE_NIVEL_RIESGO[nivel]}
              </td>
              <td style={{ padding: '6px 8px' }}>{ACCION_REQUERIDA[nivel]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
