import { DownloadOutlined, FileOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Modal, Skeleton, Tabs } from 'antd';
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { descargarArchivo, nombreDeArchivo, obtenerUrlPrevisualizacion } from '../../../shared/api/descargarArchivo';

interface Props {
  open: boolean;
  titulo: string;
  documentoId: number | null;
  archivo: string | null;
  onClose: () => void;
}

type Tipo = 'pdf' | 'imagen' | 'excel' | 'texto' | 'otro';

interface HojaExcel {
  nombre: string;
  html: string;
}

function tipoDeArchivo(nombre: string): Tipo {
  const extension = nombre.split('.').pop()?.toLowerCase() ?? '';
  if (extension === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg'].includes(extension)) return 'imagen';
  if (['xlsx', 'xls', 'xlsm'].includes(extension)) return 'excel';
  if (['txt', 'csv'].includes(extension)) return 'texto';
  return 'otro';
}

export function PrevisualizarDocumentoModal({ open, titulo, documentoId, archivo, onClose }: Props) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlPrevia, setUrlPrevia] = useState<string | null>(null);
  const [textoPlano, setTextoPlano] = useState<string | null>(null);
  const [hojasExcel, setHojasExcel] = useState<HojaExcel[] | null>(null);
  const [hojaActiva, setHojaActiva] = useState<string>('');

  useEffect(() => {
    if (!open || !documentoId || !archivo) return;

    let cancelado = false;
    let urlCreada: string | null = null;

    async function cargar() {
      setCargando(true);
      setError(null);
      setUrlPrevia(null);
      setTextoPlano(null);
      setHojasExcel(null);
      setHojaActiva('');
      try {
        const ruta = `/documentos/${documentoId}/descargar/`;
        const { url, tipo: mime } = await obtenerUrlPrevisualizacion(ruta);
        if (cancelado) {
          URL.revokeObjectURL(url);
          return;
        }
        urlCreada = url;
        const tipo = tipoDeArchivo(archivo!);
        if (tipo === 'texto') {
          const respuesta = await fetch(url);
          setTextoPlano(await respuesta.text());
        } else if (tipo === 'excel') {
          const buffer = await (await fetch(url)).arrayBuffer();
          const libro = XLSX.read(buffer, { type: 'array' });
          const hojas = libro.SheetNames.map((nombreHoja) => ({
            nombre: nombreHoja,
            html: XLSX.utils.sheet_to_html(libro.Sheets[nombreHoja]),
          }));
          if (!cancelado) {
            setHojasExcel(hojas);
            setHojaActiva(hojas[0]?.nombre ?? '');
          }
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
  }, [open, documentoId, archivo]);

  const nombre = archivo ? nombreDeArchivo(archivo) : '';
  const tipo = archivo ? tipoDeArchivo(archivo) : 'otro';

  return (
    <Modal title={titulo} open={open} onCancel={onClose} footer={null} width={800} destroyOnHidden>
      {!archivo || !documentoId ? (
        <Empty description="Este documento todavía no tiene un archivo cargado." />
      ) : (
        <div>
          {cargando && <Skeleton active paragraph={{ rows: 6 }} />}
          {error && <Alert type="error" message={error} showIcon />}

          {!cargando && !error && (
            <>
              {tipo === 'pdf' && urlPrevia && (
                <iframe
                  src={urlPrevia}
                  title={nombre}
                  style={{ width: '100%', height: 560, border: '1px solid #e1e0d9', borderRadius: 4 }}
                />
              )}
              {tipo === 'imagen' && urlPrevia && (
                <img
                  src={urlPrevia}
                  alt={nombre}
                  style={{ maxWidth: '100%', maxHeight: 560, display: 'block', margin: '0 auto' }}
                />
              )}
              {tipo === 'excel' && hojasExcel && (
                <div>
                  {hojasExcel.length > 1 && (
                    <Tabs
                      size="small"
                      activeKey={hojaActiva}
                      onChange={setHojaActiva}
                      items={hojasExcel.map((hoja) => ({ key: hoja.nombre, label: hoja.nombre }))}
                    />
                  )}
                  <div
                    className="previsualizar-excel"
                    style={{
                      maxHeight: 560,
                      overflow: 'auto',
                      border: '1px solid #e1e0d9',
                      borderRadius: 4,
                      padding: 8,
                    }}
                    // El HTML viene de XLSX.utils.sheet_to_html a partir del propio archivo
                    // que el usuario acaba de subir/descargar — no de entrada de terceros.
                    dangerouslySetInnerHTML={{
                      __html: hojasExcel.find((hoja) => hoja.nombre === hojaActiva)?.html ?? hojasExcel[0].html,
                    }}
                  />
                </div>
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
                  onClick={() => descargarArchivo(`/documentos/${documentoId}/descargar/`, nombre)}
                >
                  Descargar {nombre}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
