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

  const conteos = useMemo(() => {
    const base = { NC: 0, AM: 0 };
    for (const hallazgo of data?.results ?? []) {
      for (const codigo of hallazgo.tipos_codigos) {
        if (codigo === 'NC' || codigo === 'AM') base[codigo] += 1;
      }
    }
    return base;
  }, [data]);

  const total = conteos.NC + conteos.AM;

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
          `<strong>${p.value}</strong> hallazgos · ${p.name} (${p.percent}%)`,
      },
      legend: {
        bottom: 2,
        icon: 'circle' as const,
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 18,
        textStyle: { color: '#52514e', fontSize: 12 },
        formatter: (name: string) => {
          const clave = ORDEN.find((k) => ESTILO[k].etiqueta === name);
          return clave ? `${name}  ${conteos[clave]}` : name;
        },
      },
      series: [
        {
          name: 'Hallazgos por tipo',
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
          data: ORDEN.map((clave) => ({
            name: ESTILO[clave].etiqueta,
            value: conteos[clave],
            itemStyle: {
              color: {
                type: 'radial' as const,
                x: 0.5,
                y: 0.5,
                r: 0.9,
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
          left: 'center' as const,
          top: '36%',
          style: { text: String(total), fontSize: 34, fontWeight: 700, fill: '#0b0b0b' },
        },
        {
          type: 'text' as const,
          left: 'center' as const,
          top: '46%',
          style: { text: 'vínculos', fontSize: 13, fill: '#898781' },
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
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Tipo</th>
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
                      background: ESTILO[clave].color,
                      marginRight: 8,
                    }}
                  />
                  {ESTILO[clave].etiqueta}
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
          aria-label={`Hallazgos por tipo: ${ORDEN.map((k) => `${ESTILO[k].etiqueta} ${conteos[k]}`).join(', ')}`}
        />
      )}
    </div>
  );
}
