import { useQuery } from '@tanstack/react-query';
import { Button, Card, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { AplicabilidadFormModal } from '../components/AplicabilidadFormModal';
import { fetchSoa } from '../api';
import type { AplicabilidadControl, CategoriaControl, EstadoImplementacion } from '../types';

const ENCABEZADO_CATEGORIA: Record<CategoriaControl, string> = {
  ORGANIZACIONAL: '5. CONTROLES ORGANIZACIONALES',
  PERSONAS: '6. CONTROLES DE PERSONAS',
  FISICO: '7. CONTROLES FÍSICOS',
  TECNOLOGICO: '8. CONTROLES TECNOLÓGICOS',
};

const COLOR_ESTADO: Record<EstadoImplementacion, string> = {
  NO_IMPLEMENTADO: 'red',
  PARCIAL: 'orange',
  IMPLEMENTADO: 'green',
};

const NOMBRE_ESTADO: Record<EstadoImplementacion, string> = {
  NO_IMPLEMENTADO: 'Sin Iniciar',
  PARCIAL: 'En Proceso',
  IMPLEMENTADO: 'Implementado',
};

const CANTIDAD_COLUMNAS = 9;

function partesCodigo(codigo: string): [number, number] {
  const [mayor, menor] = codigo.split('.').map(Number);
  return [mayor || 0, menor || 0];
}

function compararPorCodigo(a: AplicabilidadControl, b: AplicabilidadControl) {
  const [mayorA, menorA] = partesCodigo(a.control_codigo);
  const [mayorB, menorB] = partesCodigo(b.control_codigo);
  return mayorA - mayorB || menorA - menorB;
}

type FilaCategoria = { esEncabezadoCategoria: true; categoria: CategoriaControl; id: string };
type FilaTabla = AplicabilidadControl | FilaCategoria;

function esEncabezado(fila: FilaTabla): fila is FilaCategoria {
  return 'esEncabezadoCategoria' in fila;
}

export function ControlesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['soa'], queryFn: fetchSoa });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [aplicabilidadEditando, setAplicabilidadEditando] = useState<AplicabilidadControl | null>(null);

  function abrirEditar(aplicabilidad: AplicabilidadControl) {
    setAplicabilidadEditando(aplicabilidad);
    setModalAbierto(true);
  }

  const filas = useMemo<FilaTabla[]>(() => {
    const ordenados = [...(data?.results ?? [])].sort(compararPorCodigo);
    const resultado: FilaTabla[] = [];
    let categoriaAnterior: CategoriaControl | null = null;
    for (const item of ordenados) {
      if (item.control_categoria !== categoriaAnterior) {
        resultado.push({ esEncabezadoCategoria: true, categoria: item.control_categoria, id: `cat-${item.control_categoria}` });
        categoriaAnterior = item.control_categoria;
      }
      resultado.push(item);
    }
    return resultado;
  }, [data]);

  function celdaTexto(texto: string, ancho: number) {
    return texto ? (
      <Typography.Text ellipsis={{ tooltip: texto }} style={{ maxWidth: ancho, display: 'inline-block' }}>
        {texto}
      </Typography.Text>
    ) : (
      '—'
    );
  }

  function columnaConEncabezado<T>(
    dataIndex: string,
    render: (valor: T, aplicabilidad: AplicabilidadControl) => React.ReactNode,
    indiceColumna: number,
  ) {
    return {
      dataIndex,
      render: (valor: T, fila: FilaTabla) => {
        if (esEncabezado(fila)) {
          if (indiceColumna === 0) {
            return {
              children: (
                <Typography.Text strong style={{ display: 'block', textAlign: 'center' }}>
                  {ENCABEZADO_CATEGORIA[fila.categoria]}
                </Typography.Text>
              ),
              props: { colSpan: CANTIDAD_COLUMNAS },
            };
          }
          return { props: { colSpan: 0 } };
        }
        return render(valor, fila);
      },
    };
  }

  const columns = [
    {
      title: 'No.',
      key: 'control_codigo',
      width: 70,
      ...columnaConEncabezado('control_codigo', (codigo: string) => <strong>{codigo}</strong>, 0),
    },
    {
      title: 'Nombre del control',
      key: 'control_nombre',
      width: 170,
      ...columnaConEncabezado('control_nombre', (nombre: string) => nombre, 1),
    },
    {
      title: 'Descripción',
      key: 'control_descripcion',
      width: 260,
      ...columnaConEncabezado('control_descripcion', (texto: string) => celdaTexto(texto, 260), 2),
    },
    {
      title: 'Aplica el Control (SI/NO)',
      key: 'aplica',
      width: 90,
      align: 'center' as const,
      ...columnaConEncabezado('aplica', (aplica: boolean) =>
        aplica ? <Tag color="green">Sí</Tag> : <Tag color="default">No</Tag>, 3),
    },
    {
      title: 'Estado',
      key: 'estado_implementacion',
      width: 130,
      ...columnaConEncabezado('estado_implementacion', (estado: EstadoImplementacion) => (
        <Tag color={COLOR_ESTADO[estado]}>{NOMBRE_ESTADO[estado]}</Tag>
      ), 4),
    },
    {
      title: 'Justificación del Control',
      key: 'justificacion',
      width: 220,
      ...columnaConEncabezado('justificacion', (texto: string) => celdaTexto(texto, 220), 5),
    },
    {
      title: 'Referencia / Nombre Documento',
      key: 'referencia_documento',
      width: 220,
      ...columnaConEncabezado('referencia_documento', (texto: string) => celdaTexto(texto, 220), 6),
    },
    {
      title: 'Observaciones',
      key: 'observaciones',
      width: 220,
      ...columnaConEncabezado('observaciones', (texto: string) => celdaTexto(texto, 220), 7),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 90,
      ...columnaConEncabezado('id', (_: unknown, aplicabilidad: AplicabilidadControl) => (
        <Button size="small" onClick={() => abrirEditar(aplicabilidad)}>Editar</Button>
      ), 8),
    },
  ];

  return (
    <Card title="Controles Anexo A — Declaración de Aplicabilidad (SoA)">
      <Table
        rowKey={(fila: FilaTabla) => String(fila.id)}
        loading={isLoading}
        columns={columns}
        dataSource={filas}
        pagination={false}
        scroll={{ x: 1450 }}
      />
      <AplicabilidadFormModal
        open={modalAbierto}
        aplicabilidad={aplicabilidadEditando}
        onClose={() => setModalAbierto(false)}
      />
    </Card>
  );
}
