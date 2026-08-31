import { useQuery } from '@tanstack/react-query';
import { Button, Empty, Skeleton } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';
import { fetchHallazgos } from '../../auditorias/api';

// Misma paleta categórica que GraficaObjetivosPorProceso — orden fijo, reasignado de forma
// determinista según el conteo descendente de cada carga (no es un enum fijo de procesos).
const PALETA = [
  { color: '#2a78d6', claro: '#9ec5f4' },
  { color: '#eb6834', claro: '#f6b48f' },
  { color: '#1baf7a', claro: '#8fdec0' },
  { color: '#eda100', claro: '#ffd166' },
  { color: '#e87ba4', claro: '#f5bdd4' },
  { color: '#008300', claro: '#6fd66f' },
  { color: '#4a3aa7', claro: '#a89ce0' },
];

export function GraficaHallazgosPorProceso() {
  const { data, isLoading } = useQuery({ queryKey: ['hallazgos'], queryFn: fetchHallazgos });
  const [vistaTabla, setVistaTabla] = useState(false);

  const filas = useMemo(() => {
    const conteos = new Map<string, number>();
    for (const hallazgo of data?.results ?? []) {
      for (const proceso of hallazgo.procesos_nombres) {
        conteos.set(proceso, (conteos.get(proceso) ?? 0) + 1);
      }
    }
    return [...conteos.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([proceso, total], indice) => ({ proceso, total, estilo: PALETA[indice % PALETA.length] }));
  }, [data]);

  const total = filas.reduce((suma, fila) => suma + fila.total, 0);
  const ordenAscendente = [...filas].reverse();

  const opcionGrafica = useMemo(
    () => ({
      animationDuration: 900,
      animationEasing: 'elasticOut' as const,
      grid: { left: 16, right: 40, top: 8, bottom: 8, containLabel: true },
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
        data: ordenAscendente.map((f) => f.proceso),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#52514e', fontSize: 12, fontWeight: 500 },
      },
      series: [
        {
          name: 'Hallazgos por proceso',
          type: 'bar' as const,
          barWidth: '55%',
          label: { show: true, position: 'right' as const, fontWeight: 700, fontSize: 13, color: '#0b0b0b' },
          itemStyle: { borderRadius: [0, 8, 8, 0], shadowBlur: 10, shadowColor: 'rgba(11,11,11,0.14)' },
          emphasis: { itemStyle: { shadowBlur: 18, shadowColor: 'rgba(11,11,11,0.30)' } },
          data: ordenAscendente.map((f) => ({
            value: f.total,
            itemStyle: {
              color: {
                type: 'linear' as const,
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: f.estilo.claro },
                  { offset: 1, color: f.estilo.color },
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
          style: { text: `${total} vínculos`, fontSize: 12, fill: '#898781' },
        },
      ],
    }),
    [ordenAscendente, total],
  );

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  if (total === 0) {
    return <Empty description="Todavía no hay hallazgos con procesos asociados" />;
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
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Proceso</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Hallazgos</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.proceso} style={{ borderBottom: '1px solid #f0efec' }}>
                <td style={{ padding: '6px 8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: fila.estilo.color,
                      marginRight: 8,
                    }}
                  />
                  {fila.proceso}
                </td>
                <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums' }}>{fila.total}</td>
                <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums' }}>
                  {total ? Math.round((fila.total / total) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ReactECharts
          option={opcionGrafica}
          style={{ height: 260, width: '100%' }}
          aria-label={`Hallazgos por proceso: ${filas.map((f) => `${f.proceso} ${f.total}`).join(', ')}`}
        />
      )}
    </div>
  );
}
