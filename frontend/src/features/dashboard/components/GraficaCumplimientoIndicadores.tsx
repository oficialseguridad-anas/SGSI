import { useQuery } from '@tanstack/react-query';
import { Button, Empty, Skeleton } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';
import { fetchIndicadores } from '../../indicadores/api';
import type { EstadoCumplimiento } from '../../indicadores/types';

type Clave = EstadoCumplimiento | 'SIN_DATO';
// Orden fijo validado (ver skill de dataviz): separa rojo y verde con gris para que
// no queden adyacentes — juntos, esa pareja no supera el umbral de daltonismo.
const ORDEN: Clave[] = ['POR_ENCIMA', 'CUMPLE', 'SIN_DATO', 'POR_DEBAJO'];

const NOMBRE: Record<Clave, string> = {
  POR_DEBAJO: 'Por debajo',
  CUMPLE: 'Cumple',
  POR_ENCIMA: 'Por encima',
  SIN_DATO: 'Sin dato',
};

// Mismos colores que la columna "Cumplimiento" de la tabla de Indicadores
// (rojo=crítico, verde=cumple, azul=excede la meta), más gris neutro para lo
// que aún no tiene resultado cargado.
const COLOR: Record<Clave, string> = {
  POR_DEBAJO: '#d03b3b',
  CUMPLE: '#0ca30c',
  POR_ENCIMA: '#2a78d6',
  SIN_DATO: '#898781',
};
const CLARO: Record<Clave, string> = {
  POR_DEBAJO: '#f18b8b',
  CUMPLE: '#6fd66f',
  POR_ENCIMA: '#9ec5f4',
  SIN_DATO: '#c3c2b7',
};

export function GraficaCumplimientoIndicadores() {
  const { data, isLoading } = useQuery({ queryKey: ['indicadores'], queryFn: fetchIndicadores });
  const [vistaTabla, setVistaTabla] = useState(false);

  const conteos = useMemo(() => {
    const base = Object.fromEntries(ORDEN.map((clave) => [clave, 0])) as Record<Clave, number>;
    for (const indicador of data?.results ?? []) {
      base[indicador.cumplimiento_actual ?? 'SIN_DATO'] += 1;
    }
    return base;
  }, [data]);

  const total = ORDEN.reduce((suma, clave) => suma + conteos[clave], 0);

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
          return `<strong>${p.value}</strong> indicadores · ${p.name} (${porcentaje}%)`;
        },
      },
      xAxis: { type: 'value' as const, show: false },
      yAxis: {
        type: 'category' as const,
        data: ORDEN.map((clave) => NOMBRE[clave]),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#52514e', fontSize: 13, fontWeight: 500 },
      },
      series: [
        {
          name: 'Cumplimiento de indicadores',
          type: 'bar' as const,
          barWidth: '52%',
          label: { show: true, position: 'right' as const, fontWeight: 700, fontSize: 13, color: '#0b0b0b' },
          itemStyle: { borderRadius: [0, 8, 8, 0], shadowBlur: 10, shadowColor: 'rgba(11,11,11,0.14)' },
          emphasis: { itemStyle: { shadowBlur: 18, shadowColor: 'rgba(11,11,11,0.30)' } },
          data: ORDEN.map((clave) => ({
            value: conteos[clave],
            itemStyle: {
              color: {
                type: 'linear' as const,
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: CLARO[clave] },
                  { offset: 1, color: COLOR[clave] },
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
          style: { text: `${total} indicadores`, fontSize: 12, fill: '#898781' },
        },
      ],
    }),
    [conteos, total],
  );

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  if (total === 0) {
    return <Empty description="Todavía no hay indicadores registrados" />;
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
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Cumplimiento</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Indicadores</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            {ORDEN.map((clave) => (
              <tr key={clave} style={{ borderBottom: '1px solid #f0efec' }}>
                <td style={{ padding: '6px 8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: COLOR[clave],
                      marginRight: 8,
                    }}
                  />
                  {NOMBRE[clave]}
                </td>
                <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums' }}>{conteos[clave]}</td>
                <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums' }}>
                  {total ? Math.round((conteos[clave] / total) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ReactECharts
          option={opcionGrafica}
          style={{ height: 260, width: '100%' }}
          aria-label={`Cumplimiento de indicadores: ${ORDEN.map((k) => `${NOMBRE[k]} ${conteos[k]}`).join(', ')}`}
        />
      )}
    </div>
  );
}
