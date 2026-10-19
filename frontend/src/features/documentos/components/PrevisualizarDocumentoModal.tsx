import { DownloadOutlined, FileOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Modal, Skeleton, Tabs } from 'antd';
import mammoth from 'mammoth';
import { PPTXViewer } from 'pptxviewjs';
import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { descargarArchivo, nombreDeArchivo, obtenerUrlPrevisualizacion } from '../../../shared/api/descargarArchivo';

interface Props {
  open: boolean;
  titulo: string;
  documentoId: number | null;
  archivo: string | null;
  onClose: () => void;
}

type Tipo = 'pdf' | 'imagen' | 'excel' | 'word' | 'powerpoint' | 'texto' | 'otro';

interface HojaExcel {
  nombre: string;
  html: string;
}

function tipoDeArchivo(nombre: string): Tipo {
  const extension = nombre.split('.').pop()?.toLowerCase() ?? '';
  if (extension === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg'].includes(extension)) return 'imagen';
  if (['xlsx', 'xls', 'xlsm'].includes(extension)) return 'excel';
  // Word y PowerPoint se convierten en el propio navegador (sin servidor de por medio):
  // .docx con `mammoth` (a HTML, con bastante fidelidad de formato) y .pptx dibujando cada
  // diapositiva en un <canvas> con `pptxviewjs`. Los formatos antiguos .doc/.ppt (binarios,
  // no son un zip de XML/OOXML) no tienen una librería JS confiable para esto y quedan
  // como "otro".
  if (extension === 'docx') return 'word';
  if (extension === 'pptx') return 'powerpoint';
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
  const [htmlWord, setHtmlWord] = useState<string | null>(null);
  const contenedorPptxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !documentoId || !archivo) return;

    let cancelado = false;
    let urlCreada: string | null = null;
    let rendererPptx: PPTXViewer | null = null;

    async function cargar() {
      setCargando(true);
      setError(null);
      setUrlPrevia(null);
      setTextoPlano(null);
      setHojasExcel(null);
      setHojaActiva('');
      setHtmlWord(null);
      if (contenedorPptxRef.current) contenedorPptxRef.current.innerHTML = '';
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
        } else if (tipo === 'word') {
          const buffer = await (await fetch(url)).arrayBuffer();
          const resultado = await mammoth.convertToHtml({ arrayBuffer: buffer });
          if (!cancelado) setHtmlWord(resultado.value);
        } else if (tipo === 'powerpoint') {
          const buffer = await (await fetch(url)).arrayBuffer();
          rendererPptx = new PPTXViewer({});
          await rendererPptx.loadFile(buffer);
          const total = rendererPptx.getSlideCount();
          if (!cancelado && contenedorPptxRef.current) {
            for (let i = 0; i < total; i++) {
              const canvas = document.createElement('canvas');
              // `pptxviewjs` ajusta el contenido de la diapositiva (preservando su
              // proporción real, sin deformarla) dentro de las dimensiones que tenga el
              // <canvas> en el momento de renderizar — por eso se fija un tamaño explícito
              // en `style.width/height` ANTES de llamar a `renderSlide`.
              canvas.style.width = '740px';
              canvas.style.height = '480px';
              canvas.style.maxWidth = '100%';
              canvas.style.display = 'block';
              canvas.style.margin = '0 auto 12px';
              canvas.style.border = '1px solid #e1e0d9';
              canvas.style.borderRadius = '4px';
              contenedorPptxRef.current.appendChild(canvas);
              await rendererPptx.renderSlide(i, canvas);
              if (cancelado) break;
            }
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
      if (rendererPptx) rendererPptx.destroy();
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

          {/* El contenedor de PowerPoint se monta siempre (oculto mientras carga) porque
              `pptxviewjs` dibuja los <canvas> directamente en él vía `ref`, apenas termina
              la carga asíncrona — si solo existiera cuando `!cargando`, la ref todavía
              estaría vacía en ese momento. */}
          <div
            ref={contenedorPptxRef}
            style={{
              display: tipo === 'powerpoint' && !cargando && !error ? 'block' : 'none',
              maxHeight: 560,
              overflow: 'auto',
            }}
          />

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
              {tipo === 'word' && htmlWord !== null && (
                <div
                  style={{
                    maxHeight: 560,
                    overflow: 'auto',
                    border: '1px solid #e1e0d9',
                    borderRadius: 4,
                    padding: 16,
                  }}
                  // El HTML viene de `mammoth` a partir del propio archivo .docx que el
                  // usuario acaba de subir/descargar — no de entrada de terceros.
                  dangerouslySetInnerHTML={{ __html: htmlWord }}
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
