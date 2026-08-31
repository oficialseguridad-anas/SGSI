import { useQuery } from '@tanstack/react-query';
import { Button, Empty, Skeleton } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';
import { fetchHallazgos } from '../../auditorias/api';

const ESTILO = {
  NC: { color: '#eb6834', claro: '#f6b48f', etiqueta: 'No conformidad' },
  AM: { color: '#2a78d6', claro: '#9ec5f4', etiqueta: 'Acción de mejora' },
};
const ORDEN: (keyof typeof ESTILO)[] = ['NC', 'AM'];

export function GraficaHallazgosTipo() {
  const { data, isLoading } = useQuery({ queryKey: ['hallazgos'], queryFn: fetchHallazgos });
  const [vistaTabla, setVistaTabla] = useState(false);

  const { conteos, totalHallazgos } = useMemo(() => {
    const base = { NC: 0, AM: 0 };
    const hallazgos = data?.results ?? [];
    for (const hallazgo of hallazgos) {
      for (const codigo of hallazgo.tipos_codigos) {
        if (codigo === 'NC' || codigo === 'AM') base[codigo] += 1;
      }
    }
    return { conteos: base, totalHallazgos: hallazgos.length };
  }, [data]);

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
          const porcentaje = totalHallazgos ? Math.round((p.value / totalHallazgos) * 100) : 0;
          return `<strong>${p.value}</strong> hallazgos · ${p.name} (${porcentaje}% de los ${totalHallazgos})`;
        },
      },
      xAxis: { type: 'value' as const, show: false },
      yAxis: {
        type: 'category' as const,
        data: ORDEN.map((clave) => ESTILO[clave].etiqueta),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#52514e', fontSize: 12, fontWeight: 500 },
      },
      series: [
        {
          name: 'Hallazgos por tipo',
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
                  { offset: 0, color: ESTILO[clave].claro },
                  { offset: 1, color: ESTILO[clave].color },
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
          style: { text: `de ${totalHallazgos} hallazgos`, fontSize: 12, fill: '#898781' },
        },
      ],
    }),
    [conteos, totalHallazgos],
  );

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  if (totalHallazgos === 0) {
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
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Tipo</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Hallazgos</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>% de los {totalHallazgos}</th>
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
                      background: ESTILO[clave].color,
                      marginRight: 8,
                    }}
                  />
                  {ESTILO[clave].etiqueta}
                </td>
                <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums' }}>{conteos[clave]}</td>
                <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums' }}>
                  {totalHallazgos ? Math.round((conteos[clave] / totalHallazgos) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ReactECharts
          option={opcionGrafica}
          style={{ height: 260, width: '100%' }}
          aria-label={`Hallazgos por tipo, de ${totalHallazgos} hallazgos: ${ORDEN.map((k) => `${ESTILO[k].etiqueta} ${conteos[k]}`).join(', ')}`}
        />
      )}
    </div>
  );
}
