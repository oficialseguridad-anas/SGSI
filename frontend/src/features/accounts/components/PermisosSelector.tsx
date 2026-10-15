import { useQuery } from '@tanstack/react-query';
import { Checkbox, Collapse, Input, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { fetchPermisos } from '../api';
import type { Permiso } from '../types';

// Nombres amigables para los módulos propios del SGSI — los demás (apps internas de
// Django como auth/contenttypes/sessions/admin/token_blacklist) se muestran con su
// app_label tal cual, ya que son casos raros de asignar pero no se ocultan.
const NOMBRE_APP: Record<string, string> = {
  accounts: 'Cuentas, Usuarios y Roles',
  activos: 'Activos',
  auditorias: 'Hallazgos y Auditoría Interna',
  controles: 'Controles (SoA)',
  documentos: 'Documentos',
  incidentes: 'Matriz de Incidentes',
  indicadores: 'Indicadores',
  objetivos: 'Objetivos',
  revisiones: 'Revisión por la Dirección / Seguimiento Anexo A',
  riesgos: 'Riesgos',
  core: 'Sistema',
};

interface Props {
  value: number[];
  onChange: (value: number[]) => void;
}

/** Selector de permisos de Django agrupados por módulo, con checkbox "marcar todo el
 * módulo" en cada encabezado y buscador — se usa tanto para armar un Rol (sus
 * permisos) como para los permisos individuales adicionales de un Usuario. */
export function PermisosSelector({ value, onChange }: Props) {
  const { data } = useQuery({ queryKey: ['permisos'], queryFn: fetchPermisos });
  const [busqueda, setBusqueda] = useState('');

  const permisos = data?.results ?? [];
  const porApp = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    const filtrados = termino
      ? permisos.filter((p) => `${p.name} ${p.codename} ${p.modelo}`.toLowerCase().includes(termino))
      : permisos;
    const mapa = new Map<string, Permiso[]>();
    filtrados.forEach((p) => {
      if (!mapa.has(p.app_label)) mapa.set(p.app_label, []);
      mapa.get(p.app_label)!.push(p);
    });
    return Array.from(mapa.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permisos, busqueda]);

  function alternarGrupo(idsGrupo: number[], marcarTodos: boolean) {
    const sinGrupo = value.filter((id) => !idsGrupo.includes(id));
    onChange(marcarTodos ? [...sinGrupo, ...idsGrupo] : sinGrupo);
  }

  return (
    <div>
      <Input.Search
        allowClear
        placeholder="Buscar permiso por nombre o modelo..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        <Collapse
          size="small"
          items={porApp.map(([app, items]) => {
            const idsGrupo = items.map((p) => p.id);
            const marcadosGrupo = idsGrupo.filter((id) => value.includes(id));
            const todosMarcados = marcadosGrupo.length === idsGrupo.length;
            return {
              key: app,
              label: (
                <Checkbox
                  indeterminate={marcadosGrupo.length > 0 && !todosMarcados}
                  checked={todosMarcados}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => alternarGrupo(idsGrupo, e.target.checked)}
                >
                  <strong>{NOMBRE_APP[app] ?? app}</strong>{' '}
                  <Typography.Text type="secondary">({marcadosGrupo.length}/{idsGrupo.length})</Typography.Text>
                </Checkbox>
              ),
              children: (
                <Checkbox.Group
                  style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                  value={marcadosGrupo}
                  onChange={(seleccionados) => {
                    const sinGrupo = value.filter((id) => !idsGrupo.includes(id));
                    onChange([...sinGrupo, ...(seleccionados as number[])]);
                  }}
                >
                  {items.map((p) => (
                    <Checkbox key={p.id} value={p.id}>
                      {p.name}{' '}
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        ({p.modelo}.{p.codename})
                      </Typography.Text>
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              ),
            };
          })}
        />
      </div>
    </div>
  );
}
