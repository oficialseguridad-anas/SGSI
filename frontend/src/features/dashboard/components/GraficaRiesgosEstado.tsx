import { useQuery } from '@tanstack/react-query';
import { Button, Empty, Skeleton } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';
import { fetchRiesgos } from '../../riesgos/api';

// Mismos colores que la columna "Activo" de la tabla de Riesgos (Tag verde/gris):
// un riesgo inactivo no es un estado "malo", solo ya no está vigente.
const ESTILO = {
  activos: { color: '#0ca30c', claro: '#6fd66f', etiqueta: 'Activos' },
  inactivos: { color: '#898781', claro: '#c3c2b7', etiqueta: 'Inactivos' },
};
const ORDEN: (keyof typeof ESTILO)[] = ['activos', 'inactivos'];

export function GraficaRiesgosEstado() {
  const { data, isLoading } = useQuery({ queryKey: ['riesgos'], queryFn: fetchRiesgos });
  const [vistaTabla, setVistaTabla] = useState(false);

  const conteos = useMemo(() => {
    const base = { activos: 0, inactivos: 0 };
    for (const riesgo of data?.results ?? []) {
      if (riesgo.esta_activo) base.activos += 1;
      else base.inactivos += 1;
    }
    return base;
  }, [data]);

  const total = conteos.activos + conteos.inactivos;

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
          `<strong>${p.value}</strong> riesgos · ${p.name} (${p.percent}%)`,
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
          name: 'Riesgos por estado',
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
          style: { text: 'riesgos', fontSize: 13, fill: '#898781' },
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
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Estado</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Riesgos</th>
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
          aria-label={`Riesgos por estado: ${ORDEN.map((k) => `${ESTILO[k].etiqueta} ${conteos[k]}`).join(', ')}`}
        />
      )}
    </div>
  );
}
