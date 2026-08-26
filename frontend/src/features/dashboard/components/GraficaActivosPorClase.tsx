import { useQuery } from '@tanstack/react-query';
import { Button, Empty, Skeleton } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';
import { fetchActivos } from '../../activos/api';
import type { ClaseActivo } from '../../activos/types';

const ORDEN: ClaseActivo[] = [
  'SISTEMAS_INFORMACION',
  'SOFTWARE',
  'HARDWARE',
  'INFORMACION',
  'RED',
  'PERSONAL',
  'ESTRUCTURA_ORGANIZACION',
];

const NOMBRE: Record<ClaseActivo, string> = {
  SISTEMAS_INFORMACION: 'Sistemas de información',
  SOFTWARE: 'Software',
  HARDWARE: 'Hardware',
  INFORMACION: 'Información',
  RED: 'Red',
  PERSONAL: 'Personal',
  ESTRUCTURA_ORGANIZACION: 'Estructura organizacional',
};

// Paleta categórica validada (orden fijo, ΔE de daltonismo y contraste verificados
// con el validador del skill de dataviz) — nunca se reordena ni se cicla.
const COLOR: Record<ClaseActivo, string> = {
  SISTEMAS_INFORMACION: '#2a78d6',
  SOFTWARE: '#eb6834',
  HARDWARE: '#1baf7a',
  INFORMACION: '#eda100',
  RED: '#e87ba4',
  PERSONAL: '#008300',
  ESTRUCTURA_ORGANIZACION: '#4a3aa7',
};
const CLARO: Record<ClaseActivo, string> = {
  SISTEMAS_INFORMACION: '#9ec5f4',
  SOFTWARE: '#f6b48f',
  HARDWARE: '#8fdec0',
  INFORMACION: '#ffd166',
  RED: '#f5bdd4',
  PERSONAL: '#6fd66f',
  ESTRUCTURA_ORGANIZACION: '#a89ce0',
};

export function GraficaActivosPorClase() {
  const { data, isLoading } = useQuery({ queryKey: ['activos'], queryFn: fetchActivos });
  const [vistaTabla, setVistaTabla] = useState(false);

  const conteos = useMemo(() => {
    const base = Object.fromEntries(ORDEN.map((clase) => [clase, 0])) as Record<ClaseActivo, number>;
    for (const activo of data?.results ?? []) {
      base[activo.clase_activo] += 1;
    }
    return base;
  }, [data]);

  const total = ORDEN.reduce((suma, clase) => suma + conteos[clase], 0);
  const ordenConDatos = ORDEN.filter((clase) => conteos[clase] > 0);

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
          return `<strong>${p.value}</strong> activos · ${p.name} (${porcentaje}%)`;
        },
      },
      xAxis: { type: 'value' as const, show: false },
      yAxis: {
        type: 'category' as const,
        data: ordenConDatos.map((clase) => NOMBRE[clase]),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#52514e', fontSize: 12, fontWeight: 500 },
      },
      series: [
        {
          name: 'Activos por clase',
          type: 'bar' as const,
          barWidth: '55%',
          label: { show: true, position: 'right' as const, fontWeight: 700, fontSize: 13, color: '#0b0b0b' },
          itemStyle: { borderRadius: [0, 8, 8, 0], shadowBlur: 10, shadowColor: 'rgba(11,11,11,0.14)' },
          emphasis: { itemStyle: { shadowBlur: 18, shadowColor: 'rgba(11,11,11,0.30)' } },
          data: ordenConDatos.map((clase) => ({
            value: conteos[clase],
            itemStyle: {
              color: {
                type: 'linear' as const,
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: CLARO[clase] },
                  { offset: 1, color: COLOR[clase] },
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
          style: { text: `${total} activos`, fontSize: 12, fill: '#898781' },
        },
      ],
    }),
    [conteos, total, ordenConDatos],
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
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Clase</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Activos</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            {ORDEN.map((clase) => (
              <tr key={clase} style={{ borderBottom: '1px solid #f0efec' }}>
                <td style={{ padding: '6px 8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: COLOR[clase],
                      marginRight: 8,
                    }}
                  />
                  {NOMBRE[clase]}
                </td>
                <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums' }}>{conteos[clase]}</td>
                <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums' }}>
                  {total ? Math.round((conteos[clase] / total) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ReactECharts
          option={opcionGrafica}
          style={{ height: 260, width: '100%' }}
          aria-label={`Activos por clase: ${ordenConDatos.map((c) => `${NOMBRE[c]} ${conteos[c]}`).join(', ')}`}
        />
      )}
    </div>
  );
}
