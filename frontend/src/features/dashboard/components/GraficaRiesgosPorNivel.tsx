import { useQuery } from '@tanstack/react-query';
import { Button, Empty, Skeleton } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';
import { fetchRiesgos } from '../../riesgos/api';
import { COLOR_NIVEL_RIESGO, NOMBRE_NIVEL_RIESGO, type NivelDeRiesgo } from '../../riesgos/nivelRiesgo';

const ORDEN: NivelDeRiesgo[] = ['BAJO', 'MEDIO', 'ALTO', 'CRITICO'];

// Tinte claro de cada color de severidad (para el degradado de la barra); el color
// base sigue siendo el mismo `COLOR_NIVEL_RIESGO` validado y usado en toda la app
// (Riesgos, mapa de calor, tratamientos), así que nunca se desincroniza de esa paleta.
const CLARO: Record<NivelDeRiesgo, string> = {
  BAJO: '#6cd4c8',
  MEDIO: '#ffe680',
  ALTO: '#ffb066',
  CRITICO: '#e88a8a',
};

export function GraficaRiesgosPorNivel() {
  const { data, isLoading } = useQuery({ queryKey: ['riesgos'], queryFn: fetchRiesgos });
  const [vistaTabla, setVistaTabla] = useState(false);

  const conteos = useMemo(() => {
    const base: Record<NivelDeRiesgo, number> = { BAJO: 0, MEDIO: 0, ALTO: 0, CRITICO: 0 };
    for (const riesgo of data?.results ?? []) {
      base[riesgo.nivel_de_riesgo] += 1;
    }
    return base;
  }, [data]);

  const total = ORDEN.reduce((suma, nivel) => suma + conteos[nivel], 0);

  const opcionGrafica = useMemo(
    () => ({
      animationDuration: 900,
      animationEasing: 'elasticOut' as const,
      grid: { left: 16, right: 36, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        backgroundColor: 'rgba(17,17,17,0.92)',
        borderWidth: 0,
        padding: [8, 12],
        textStyle: { color: '#fff', fontSize: 13 },
        formatter: (params: Array<{ name: string; value: number }>) => {
          const p = params[0];
          const porcentaje = total ? Math.round((p.value / total) * 100) : 0;
          return `<strong>${p.value}</strong> riesgos · ${p.name} (${porcentaje}%)`;
        },
      },
      xAxis: { type: 'value' as const, show: false },
      yAxis: {
        type: 'category' as const,
        data: ORDEN.map((nivel) => NOMBRE_NIVEL_RIESGO[nivel]),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#52514e', fontSize: 13, fontWeight: 500 },
      },
      series: [
        {
          name: 'Riesgos por nivel',
          type: 'bar' as const,
          barWidth: '52%',
          label: {
            show: true,
            position: 'right' as const,
            fontWeight: 700,
            fontSize: 13,
            color: '#0b0b0b',
          },
          itemStyle: {
            borderRadius: [0, 8, 8, 0],
            shadowBlur: 10,
            shadowColor: 'rgba(11,11,11,0.14)',
          },
          emphasis: {
            itemStyle: { shadowBlur: 18, shadowColor: 'rgba(11,11,11,0.30)' },
          },
          data: ORDEN.map((nivel) => ({
            value: conteos[nivel],
            itemStyle: {
              color: {
                type: 'linear' as const,
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: CLARO[nivel] },
                  { offset: 1, color: COLOR_NIVEL_RIESGO[nivel] },
                ],
              },
            },
          })),
        },
      ],
      graphic: [
        {
          type: 'text' as const,
          right: 8,
          top: 0,
          style: { text: `${total} riesgos`, fontSize: 12, fill: '#898781' },
        },
      ],
    }),
    [conteos, total],
  );

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  if (total === 0) {
    return <Empty description="Todavía no hay riesgos registrados" />;
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
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Nivel</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Riesgos</th>
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
                      background: COLOR_NIVEL_RIESGO[nivel],
                      marginRight: 8,
                    }}
                  />
                  {NOMBRE_NIVEL_RIESGO[nivel]}
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
          aria-label={`Riesgos por nivel: ${ORDEN.map((n) => `${NOMBRE_NIVEL_RIESGO[n]} ${conteos[n]}`).join(', ')}`}
        />
      )}
    </div>
  );
}
