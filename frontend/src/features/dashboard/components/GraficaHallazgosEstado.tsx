import { useQuery } from '@tanstack/react-query';
import { Button, Empty, Skeleton } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';
import { fetchHallazgos } from '../../auditorias/api';
import {
  CLARO_ESTADO_HALLAZGO as CLARO,
  COLOR_ESTADO_HALLAZGO as COLOR,
  NOMBRE_ESTADO_HALLAZGO as NOMBRE,
} from '../../auditorias/estadoHallazgo';
import type { EstadoHallazgo } from '../../auditorias/types';

const ORDEN: EstadoHallazgo[] = ['ABIERTA', 'EN_PROCESO', 'CERRADA'];

export function GraficaHallazgosEstado() {
  const { data, isLoading } = useQuery({ queryKey: ['hallazgos'], queryFn: fetchHallazgos });
  const [vistaTabla, setVistaTabla] = useState(false);

  const conteos = useMemo(() => {
    const base = Object.fromEntries(ORDEN.map((clave) => [clave, 0])) as Record<EstadoHallazgo, number>;
    for (const hallazgo of data?.results ?? []) {
      base[hallazgo.estado] += 1;
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
          return `<strong>${p.value}</strong> hallazgos · ${p.name} (${porcentaje}%)`;
        },
      },
      xAxis: { type: 'value' as const, show: false },
      yAxis: {
        type: 'category' as const,
        data: ORDEN.map((clave) => NOMBRE[clave]),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#52514e', fontSize: 12, fontWeight: 500 },
      },
      series: [
        {
          name: 'Hallazgos por estado',
          type: 'bar' as const,
          barWidth: '55%',
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
          style: { text: `${total} hallazgos`, fontSize: 12, fill: '#898781' },
        },
      ],
    }),
    [conteos, total],
  );

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  if (total === 0) {
    return <Empty description="Todavía no hay hallazgos registrados" />;
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
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Estado</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Hallazgos</th>
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
          aria-label={`Hallazgos por estado: ${ORDEN.map((k) => `${NOMBRE[k]} ${conteos[k]}`).join(', ')}`}
        />
      )}
    </div>
  );
}
