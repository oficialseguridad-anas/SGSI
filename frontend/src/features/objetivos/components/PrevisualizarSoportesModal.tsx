import { DownloadOutlined, FileOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Modal, Segmented, Skeleton } from 'antd';
import { useEffect, useState } from 'react';
import { descargarArchivo, nombreDeArchivo, obtenerUrlPrevisualizacion } from '../../../shared/api/descargarArchivo';
import type { ArchivoAdjuntoActividad } from '../types';

interface Props {
  open: boolean;
  titulo: string;
  archivos: ArchivoAdjuntoActividad[];
  onClose: () => void;
}

type Tipo = 'pdf' | 'imagen' | 'texto' | 'otro';

function tipoDeArchivo(nombre: string): Tipo {
  const extension = nombre.split('.').pop()?.toLowerCase() ?? '';
  if (extension === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg'].includes(extension)) return 'imagen';
  if (['txt', 'csv'].includes(extension)) return 'texto';
  return 'otro';
}

export function PrevisualizarSoportesModal({ open, titulo, archivos, onClose }: Props) {
  const [archivoActivo, setArchivoActivo] = useState<ArchivoAdjuntoActividad | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlPrevia, setUrlPrevia] = useState<string | null>(null);
  const [textoPlano, setTextoPlano] = useState<string | null>(null);

  useEffect(() => {
    if (open && archivos.length > 0) {
      setArchivoActivo(archivos[0]);
    }
  }, [open, archivos]);

  useEffect(() => {
    if (!open || !archivoActivo) return;

    let cancelado = false;
    let urlCreada: string | null = null;

    async function cargar() {
      setCargando(true);
      setError(null);
      setUrlPrevia(null);
      setTextoPlano(null);
      try {
        const ruta = `/archivos-adjuntos-actividad/${archivoActivo!.id}/descargar/`;
        const { url, tipo: mime } = await obtenerUrlPrevisualizacion(ruta);
        if (cancelado) {
          URL.revokeObjectURL(url);
          return;
        }
        urlCreada = url;
        const tipo = tipoDeArchivo(archivoActivo!.archivo);
        if (tipo === 'texto') {
          const respuesta = await fetch(url);
          setTextoPlano(await respuesta.text());
        } else {
          setUrlPrevia(url);
        }
        void mime;
      } catch {
        if (!cancelado) setError('No se pudo cargar la vista previa de este archivo.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();

    return () => {
      cancelado = true;
      if (urlCreada) URL.revokeObjectURL(urlCreada);
    };
  }, [open, archivoActivo]);

  function nombreDe(archivo: ArchivoAdjuntoActividad) {
    return nombreDeArchivo(archivo.archivo);
  }

  const tipo = archivoActivo ? tipoDeArchivo(archivoActivo.archivo) : 'otro';

  return (
    <Modal title={titulo} open={open} onCancel={onClose} footer={null} width={800} destroyOnHidden>
      {archivos.length === 0 ? (
        <Empty description="Esta actividad no tiene soportes adjuntos." />
      ) : (
        <>
          {archivos.length > 1 && (
            <Segmented
              style={{ marginBottom: 16 }}
              value={archivoActivo?.id}
              onChange={(id) => setArchivoActivo(archivos.find((a) => a.id === id) ?? null)}
              options={archivos.map((a) => ({ value: a.id, label: nombreDe(a) }))}
            />
          )}

          {cargando && <Skeleton active paragraph={{ rows: 6 }} />}
          {error && <Alert type="error" message={error} showIcon />}

          {!cargando && !error && archivoActivo && (
            <div>
              {tipo === 'pdf' && urlPrevia && (
                <iframe
                  src={urlPrevia}
                  title={nombreDe(archivoActivo)}
                  style={{ width: '100%', height: 560, border: '1px solid #e1e0d9', borderRadius: 4 }}
                />
              )}
              {tipo === 'imagen' && urlPrevia && (
                <img
                  src={urlPrevia}
                  alt={nombreDe(archivoActivo)}
                  style={{ maxWidth: '100%', maxHeight: 560, display: 'block', margin: '0 auto' }}
                />
              )}
              {tipo === 'texto' && textoPlano !== null && (
                <pre
                  style={{
                    maxHeight: 560,
                    overflow: 'auto',
                    background: '#f9f9f7',
                    border: '1px solid #e1e0d9',
                    borderRadius: 4,
                    padding: 12,
                    fontSize: 13,
                  }}
                >
                  {textoPlano}
                </pre>
              )}
              {tipo === 'otro' && (
                <Empty
                  image={<FileOutlined style={{ fontSize: 48, color: '#898781' }} />}
                  description="Este tipo de archivo no se puede previsualizar en el navegador."
                />
              )}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() =>
                    descargarArchivo(
                      `/archivos-adjuntos-actividad/${archivoActivo.id}/descargar/`,
                      nombreDe(archivoActivo),
                    )
                  }
                >
                  Descargar {nombreDe(archivoActivo)}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
