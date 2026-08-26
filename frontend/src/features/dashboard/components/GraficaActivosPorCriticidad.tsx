import { useQuery } from '@tanstack/react-query';
import { Button, Empty, Skeleton } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';
import { fetchActivos } from '../../activos/api';
import type { NivelValoracion } from '../../activos/types';

// Paleta de estado (nunca se tematiza): cada nivel de criticidad tiene un color
// fijo validado contra confusión por daltonismo y contraste, con su etiqueta de
// texto siempre visible al lado — el color nunca es el único portador del dato.
const ESTILO: Record<NivelValoracion, { color: string; claro: string; etiqueta: string }> = {
  BAJA: { color: '#0ca30c', claro: '#6fd66f', etiqueta: 'Baja' },
  MEDIA: { color: '#e0a300', claro: '#ffd666', etiqueta: 'Media' },
  ALTA: { color: '#d03b3b', claro: '#f18b8b', etiqueta: 'Alta' },
};
const ORDEN: NivelValoracion[] = ['BAJA', 'MEDIA', 'ALTA'];

export function GraficaActivosPorCriticidad() {
  const { data, isLoading } = useQuery({ queryKey: ['activos'], queryFn: fetchActivos });
  const [vistaTabla, setVistaTabla] = useState(false);

  const conteos = useMemo(() => {
    const base: Record<NivelValoracion, number> = { BAJA: 0, MEDIA: 0, ALTA: 0 };
    for (const activo of data?.results ?? []) {
      base[activo.criticidad] += 1;
    }
    return base;
  }, [data]);

  const total = conteos.BAJA + conteos.MEDIA + conteos.ALTA;

  const opcionGrafica = useMemo(
    () => ({
      animationDuration: 900,
      animationEasing: 'elasticOut' as const,
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: 'rgba(17,17,17,0.92)',
        borderWidth: 0,
        padding: [8, 12],
        textStyle: { color: '#fff', fontSize: 13 },
        formatter: (p: { name: string; value: number; percent: number }) =>
          `<strong>${p.value}</strong> activos · ${p.name} (${p.percent}%)`,
      },
      legend: {
        bottom: 2,
        icon: 'circle' as const,
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 18,
        textStyle: { color: '#52514e', fontSize: 12 },
        formatter: (name: string) => {
          const nivel = ORDEN.find((n) => ESTILO[n].etiqueta === name);
          return nivel ? `${name}  ${conteos[nivel]}` : name;
        },
      },
      series: [
        {
          name: 'Activos por criticidad',
          type: 'pie' as const,
          radius: ['56%', '80%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: true,
          label: { show: false },
          labelLine: { show: false },
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 3,
            shadowBlur: 14,
            shadowColor: 'rgba(11,11,11,0.16)',
          },
          emphasis: {
            scale: true,
            scaleSize: 6,
            itemStyle: { shadowBlur: 22, shadowColor: 'rgba(11,11,11,0.32)' },
          },
          data: ORDEN.map((nivel) => ({
            name: ESTILO[nivel].etiqueta,
            value: conteos[nivel],
            itemStyle: {
              color: {
                type: 'radial' as const,
                x: 0.5,
                y: 0.5,
                r: 0.9,
                colorStops: [
                  { offset: 0, color: ESTILO[nivel].claro },
                  { offset: 1, color: ESTILO[nivel].color },
                ],
              },
            },
          })),
        },
      ],
      graphic: [
        {
          type: 'text' as const,
          left: 'center' as const,
          top: '36%',
          style: { text: String(total), fontSize: 34, fontWeight: 700, fill: '#0b0b0b' },
        },
        {
          type: 'text' as const,
          left: 'center' as const,
          top: '46%',
          style: { text: 'activos', fontSize: 13, fill: '#898781' },
        },
      ],
    }),
    [conteos, total],
  );

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
        <ReactECharts
          option={opcionGrafica}
          style={{ height: 260, width: '100%' }}
          aria-label={`Activos por criticidad: ${ORDEN.map((n) => `${ESTILO[n].etiqueta} ${conteos[n]}`).join(', ')}`}
        />
      )}
    </div>
  );
}
