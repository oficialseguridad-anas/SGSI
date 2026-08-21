import { useQuery } from '@tanstack/react-query';
import { Button, Empty, Skeleton } from 'antd';
import { useId, useMemo, useState } from 'react';
import { fetchActivos } from '../../activos/api';
import type { NivelValoracion } from '../../activos/types';

// Paleta de estado (nunca se tematiza): cada nivel de criticidad tiene un color
// fijo validado contra confusión por daltonismo y contraste, con su etiqueta de
// texto siempre visible al lado — el color nunca es el único portador del dato.
const ESTILO: Record<NivelValoracion, { color: string; etiqueta: string }> = {
  BAJA: { color: '#0ca30c', etiqueta: 'Baja' },
  MEDIA: { color: '#fab219', etiqueta: 'Media' },
  ALTA: { color: '#d03b3b', etiqueta: 'Alta' },
};
const ORDEN: NivelValoracion[] = ['BAJA', 'MEDIA', 'ALTA'];

const ALTO_PLOT = 160;
const ANCHO_BARRA = 64;
const GAP_BARRA = 48;
const PAD_LATERAL = 32;
const ANCHO_SVG = PAD_LATERAL * 2 + ANCHO_BARRA * 3 + GAP_BARRA * 2;
const Y_BASE = ALTO_PLOT + 24;

function rutaBarra(x: number, alturaBarra: number): string {
  const yTop = Y_BASE - alturaBarra;
  const r = Math.min(4, alturaBarra / 2);
  if (alturaBarra <= 0) return '';
  return `M ${x} ${Y_BASE}
    L ${x} ${yTop + r}
    Q ${x} ${yTop} ${x + r} ${yTop}
    L ${x + ANCHO_BARRA - r} ${yTop}
    Q ${x + ANCHO_BARRA} ${yTop} ${x + ANCHO_BARRA} ${yTop + r}
    L ${x + ANCHO_BARRA} ${Y_BASE}
    Z`;
}

export function GraficaActivosPorCriticidad() {
  const { data, isLoading } = useQuery({ queryKey: ['activos'], queryFn: fetchActivos });
  const [vistaTabla, setVistaTabla] = useState(false);
  const [resaltado, setResaltado] = useState<NivelValoracion | null>(null);
  const idBase = useId();

  const conteos = useMemo(() => {
    const base: Record<NivelValoracion, number> = { BAJA: 0, MEDIA: 0, ALTA: 0 };
    for (const activo of data?.results ?? []) {
      base[activo.criticidad] += 1;
    }
    return base;
  }, [data]);

  const total = conteos.BAJA + conteos.MEDIA + conteos.ALTA;
  const maximo = Math.max(1, conteos.BAJA, conteos.MEDIA, conteos.ALTA);

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  if (total === 0) {
    return <Empty description="Todavía no hay activos registrados" />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <Button size="small" type="text" onClick={() => setVistaTabla((v) => !v)}>
          {vistaTabla ? 'Ver gráfica' : 'Ver como tabla'}
        </Button>
      </div>

      {vistaTabla ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#52514e', borderBottom: '1px solid #e1e0d9' }}>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Criticidad</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Activos</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            {ORDEN.map((nivel) => (
              <tr key={nivel} style={{ borderBottom: '1px solid #f0efec' }}>
                <td style={{ padding: '6px 8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: ESTILO[nivel].color,
                      marginRight: 8,
                    }}
                  />
                  {ESTILO[nivel].etiqueta}
                </td>
                <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums' }}>{conteos[nivel]}</td>
                <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums' }}>
                  {total ? Math.round((conteos[nivel] / total) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ position: 'relative' }}>
          <svg
            viewBox={`0 0 ${ANCHO_SVG} ${Y_BASE + 28}`}
            width="100%"
            style={{ maxWidth: 360, display: 'block', margin: '0 auto' }}
            role="img"
            aria-label={`Activos por criticidad: ${ORDEN.map((n) => `${ESTILO[n].etiqueta} ${conteos[n]}`).join(', ')}`}
          >
            {/* línea base */}
            <line x1={PAD_LATERAL - 8} y1={Y_BASE} x2={ANCHO_SVG - PAD_LATERAL + 8} y2={Y_BASE} stroke="#c3c2b7" strokeWidth={1} />

            {ORDEN.map((nivel, i) => {
              const x = PAD_LATERAL + i * (ANCHO_BARRA + GAP_BARRA);
              const conteo = conteos[nivel];
              const alturaBarra = (conteo / maximo) * ALTO_PLOT;
              const activo = resaltado === nivel;
              return (
                <g
                  key={nivel}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setResaltado(nivel)}
                  onMouseLeave={() => setResaltado(null)}
                  onFocus={() => setResaltado(nivel)}
                  onBlur={() => setResaltado(null)}
                  tabIndex={0}
                  role="button"
                  aria-describedby={`${idBase}-tt-${nivel}`}
                >
                  {/* área de impacto ampliada para el hover/foco */}
                  <rect x={x - 4} y={Y_BASE - ALTO_PLOT - 24} width={ANCHO_BARRA + 8} height={ALTO_PLOT + 24} fill="transparent" />
                  <path d={rutaBarra(x, alturaBarra)} fill={ESTILO[nivel].color} opacity={activo ? 1 : 0.9} />
                  <text
                    x={x + ANCHO_BARRA / 2}
                    y={Y_BASE - alturaBarra - 10}
                    textAnchor="middle"
                    fontSize={14}
                    fontWeight={600}
                    fill="#0b0b0b"
                  >
                    {conteo}
                  </text>
                  <text x={x + ANCHO_BARRA / 2} y={Y_BASE + 20} textAnchor="middle" fontSize={13} fill="#52514e">
                    {ESTILO[nivel].etiqueta}
                  </text>
                </g>
              );
            })}
          </svg>

          {resaltado && (
            <div
              id={`${idBase}-tt-${resaltado}`}
              role="tooltip"
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#0b0b0b',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 12,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              <strong>{conteos[resaltado]}</strong> activos · {ESTILO[resaltado].etiqueta} (
              {total ? Math.round((conteos[resaltado] / total) * 100) : 0}%)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
