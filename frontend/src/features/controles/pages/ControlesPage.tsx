import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Empty, Input, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { ErrorCarga } from '../../../shared/components/ErrorCarga';
import { normalizarTexto } from '../../../shared/utils/normalizarTexto';
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
  const { hasPerm } = useAuth();
  const { data, isLoading, isError } = useQuery({ queryKey: ['soa'], queryFn: fetchSoa });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [aplicabilidadEditando, setAplicabilidadEditando] = useState<AplicabilidadControl | null>(null);
  const [busqueda, setBusqueda] = useState('');

  function abrirEditar(aplicabilidad: AplicabilidadControl) {
    setAplicabilidadEditando(aplicabilidad);
    setModalAbierto(true);
  }

  const controles = data?.results ?? [];
  const controlesFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    if (!termino) return controles;
    return controles.filter((c) => {
      const campos = [
        c.control_codigo,
        c.control_nombre,
        c.control_descripcion,
        NOMBRE_ESTADO[c.estado_implementacion],
        c.justificacion,
        c.referencia_documento,
        c.observaciones,
      ];
      return campos.some((campo) => campo && normalizarTexto(campo).includes(termino));
    });
  }, [controles, busqueda]);

  // Filtrar antes de agrupar: así un encabezado de categoría solo aparece si le queda
  // al menos un control que coincida con la búsqueda, en vez de mostrar categorías vacías.
  const filas = useMemo<FilaTabla[]>(() => {
    const ordenados = [...controlesFiltrados].sort(compararPorCodigo);
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
  }, [controlesFiltrados]);

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
      ...columnaConEncabezado('id', (_: unknown, aplicabilidad: AplicabilidadControl) =>
        hasPerm('controles.change_aplicabilidadcontrol') ? (
          <Button size="small" onClick={() => abrirEditar(aplicabilidad)}>Editar</Button>
        ) : (
          '—'
        ), 8),
    },
  ];

  return (
    <Card title="Controles Anexo A — Declaración de Aplicabilidad (SoA)">
      <ErrorCarga visible={isError} entidad="los controles" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#898781' }} />}
          placeholder="Buscar por número, nombre, descripción, estado, justificación u observaciones..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: 480 }}
        />
        {busqueda && (
          <Typography.Text type="secondary">
            {controlesFiltrados.length} de {controles.length} controles
          </Typography.Text>
        )}
      </div>
      <Table
        rowKey={(fila: FilaTabla) => String(fila.id)}
        loading={isLoading}
        columns={columns}
        dataSource={filas}
        pagination={false}
        scroll={{ x: 1450 }}
        locale={{
          emptyText: busqueda ? <Empty description={`Ningún control coincide con "${busqueda}".`} /> : undefined,
        }}
      />
      <AplicabilidadFormModal
        open={modalAbierto}
        aplicabilidad={aplicabilidadEditando}
        onClose={() => setModalAbierto(false)}
      />
    </Card>
  );
}
