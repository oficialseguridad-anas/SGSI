import { useQuery } from '@tanstack/react-query';
import { Button, Empty, Skeleton } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';
import { fetchObjetivos } from '../../objetivos/api';
import type { EstadoEjecucionActividad } from '../../objetivos/types';

// Mismos colores que GraficaEstadoActividadesObjetivos. En una barra apilada solo importan
// los pares adyacentes (no el ciclo completo de una dona), así que este orden — verde, gris,
// rojo — separa el rojo del verde con margen de sobra (ΔE 8.7, por encima del objetivo de 8).
const ESTILO: Record<EstadoEjecucionActividad, { color: string; claro: string; etiqueta: string }> = {
  COMPLETADA: { color: '#008300', claro: '#6fd66f', etiqueta: 'Completada' },
  PENDIENTE: { color: '#898781', claro: '#dedcd4', etiqueta: 'Pendiente' },
  VENCIDA: { color: '#e34948', claro: '#f3a5a4', etiqueta: 'Vencida' },
};
const ORDEN: EstadoEjecucionActividad[] = ['COMPLETADA', 'PENDIENTE', 'VENCIDA'];

export function GraficaAvanceActividadesPorObjetivo() {
  const { data, isLoading } = useQuery({ queryKey: ['objetivos'], queryFn: fetchObjetivos });
  const [vistaTabla, setVistaTabla] = useState(false);

  const filas = useMemo(() => {
    const objetivos = data?.results ?? [];
    return objetivos.map((objetivo, indice) => {
      const conteos = { COMPLETADA: 0, PENDIENTE: 0, VENCIDA: 0 } as Record<EstadoEjecucionActividad, number>;
      for (const actividad of objetivo.actividades) {
        conteos[actividad.estado_ejecucion] += 1;
      }
      return {
        etiqueta: `Objetivo ${String(indice + 1).padStart(2, '0')}`,
        conteos,
        total: objetivo.actividades.length,
      };
    });
  }, [data]);

  const totalGeneral = filas.reduce((suma, fila) => suma + fila.total, 0);

  const opcionGrafica = useMemo(
    () => ({
      animationDuration: 900,
      animationEasing: 'elasticOut' as const,
      grid: { left: 16, right: 24, top: 8, bottom: 40, containLabel: true },
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        backgroundColor: 'rgba(17,17,17,0.92)',
        borderWidth: 0,
        padding: [8, 12],
        textStyle: { color: '#fff', fontSize: 13 },
        formatter: (params: Array<{ axisValue: string; seriesName: string; value: number }>) => {
          const fila = filas.find((f) => f.etiqueta === params[0]?.axisValue);
          const lineas = params
            .filter((p) => p.value > 0)
            .map((p) => `${p.seriesName}: <strong>${p.value}</strong>`)
            .join('<br/>');
          return `${params[0]?.axisValue} · ${fila?.total ?? 0} actividades<br/>${lineas}`;
        },
      },
      legend: {
        bottom: 0,
        icon: 'circle' as const,
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 18,
        textStyle: { color: '#52514e', fontSize: 12 },
      },
      xAxis: { type: 'value' as const, show: false },
      yAxis: {
        type: 'category' as const,
        data: filas.map((f) => f.etiqueta),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#52514e', fontSize: 12, fontWeight: 500 },
      },
      series: ORDEN.map((clave, indiceSerie) => ({
        name: ESTILO[clave].etiqueta,
        type: 'bar' as const,
        stack: 'total',
        barWidth: '55%',
        // La etiqueta se ancla al último segmento apilado (extremo real de la barra), pero
        // muestra el TOTAL de la fila, no el valor de ese segmento — si mostrara solo el
        // conteo de "Vencida" se leería como si fuera el total, ya que cae justo en la punta.
        label:
          indiceSerie === ORDEN.length - 1
            ? {
                show: true,
                position: 'right' as const,
                fontWeight: 700,
                fontSize: 12,
                color: '#0b0b0b',
                formatter: (params: { dataIndex: number }) => String(filas[params.dataIndex]?.total ?? 0),
              }
            : { show: false },
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
          borderColor: '#fcfcfb',
          borderWidth: 2,
          borderRadius: indiceSerie === ORDEN.length - 1 ? [0, 6, 6, 0] : 0,
        },
        emphasis: { itemStyle: { shadowBlur: 14, shadowColor: 'rgba(11,11,11,0.24)' } },
        data: filas.map((f) => f.conteos[clave]),
      })),
    }),
    [filas],
  );

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  if (totalGeneral === 0) {
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
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Objetivo</th>
              {ORDEN.map((clave) => (
                <th key={clave} style={{ padding: '6px 8px', fontWeight: 500 }}>
                  {ESTILO[clave].etiqueta}
                </th>
              ))}
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.etiqueta} style={{ borderBottom: '1px solid #f0efec' }}>
                <td style={{ padding: '6px 8px' }}>{fila.etiqueta}</td>
                {ORDEN.map((clave) => (
                  <td key={clave} style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums' }}>
                    {fila.conteos[clave]}
                  </td>
                ))}
                <td style={{ padding: '6px 8px', fontVariantNumeric: 'tabular-nums' }}>{fila.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ReactECharts
          option={opcionGrafica}
          style={{ height: 260, width: '100%' }}
          aria-label={`Avance de actividades por objetivo: ${filas
            .map((f) => `${f.etiqueta}: ${ORDEN.map((k) => `${ESTILO[k].etiqueta} ${f.conteos[k]}`).join(', ')}`)
            .join(' · ')}`}
        />
      )}
    </div>
  );
}
