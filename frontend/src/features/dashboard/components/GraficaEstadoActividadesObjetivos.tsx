import { useQuery } from '@tanstack/react-query';
import { Button, Empty, Skeleton } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';
import { fetchObjetivos } from '../../objetivos/api';
import type { EstadoEjecucionActividad } from '../../objetivos/types';

// Mismos colores reutilizados en la gráfica "Avance de actividades por objetivo": verde/gris/rojo
// re-escalonados (slots de la paleta categórica validada) para separar el rojo y el verde por
// encima del umbral de daltonismo (ΔE 7.2, banda legal con etiquetas directas como mitigación).
const ESTILO: Record<EstadoEjecucionActividad, { color: string; claro: string; etiqueta: string }> = {
  COMPLETADA: { color: '#008300', claro: '#6fd66f', etiqueta: 'Completada' },
  PENDIENTE: { color: '#898781', claro: '#dedcd4', etiqueta: 'Pendiente' },
  VENCIDA: { color: '#e34948', claro: '#f3a5a4', etiqueta: 'Vencida' },
};
const ORDEN: EstadoEjecucionActividad[] = ['COMPLETADA', 'PENDIENTE', 'VENCIDA'];

export function GraficaEstadoActividadesObjetivos() {
  const { data, isLoading } = useQuery({ queryKey: ['objetivos'], queryFn: fetchObjetivos });
  const [vistaTabla, setVistaTabla] = useState(false);

  const conteos = useMemo(() => {
    const base = { COMPLETADA: 0, PENDIENTE: 0, VENCIDA: 0 } as Record<EstadoEjecucionActividad, number>;
    for (const objetivo of data?.results ?? []) {
      for (const actividad of objetivo.actividades) {
        base[actividad.estado_ejecucion] += 1;
      }
    }
    return base;
  }, [data]);

  const total = ORDEN.reduce((suma, clave) => suma + conteos[clave], 0);

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
          `<strong>${p.value}</strong> actividades · ${p.name} (${p.percent}%)`,
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
          name: 'Estado de las actividades',
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
          style: { text: 'actividades', fontSize: 13, fill: '#898781' },
        },
      ],
    }),
    [conteos, total],
  );

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  if (total === 0) {
    return <Empty description="Todavía no hay actividades de objetivos registradas" />;
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
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Actividades</th>
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
          aria-label={`Estado de las actividades: ${ORDEN.map((k) => `${ESTILO[k].etiqueta} ${conteos[k]}`).join(', ')}`}
        />
      )}
    </div>
  );
}
