import { apiClient } from './client';

/** Extrae el nombre de archivo de una URL de /media/, decodificando acentos/espacios
 * (la URL los trae percent-encoded, p.ej. "%C3%A9" en vez de "é"). */
export function nombreDeArchivo(rutaUrl: string) {
  const nombre = rutaUrl.split('/').pop() ?? 'archivo';
  try {
    return decodeURIComponent(nombre);
  } catch {
    return nombre;
  }
}

/**
 * Descarga un archivo protegido (requiere sesión) a través de la API en vez de un
 * enlace directo a /media/, que en producción no tiene ningún control de acceso propio.
 * Un <a href> normal no puede llevar el header Authorization, así que se pide el
 * archivo por axios (con el token ya inyectado) y se dispara la descarga desde un blob.
 */
export async function descargarArchivo(rutaDescarga: string, nombreArchivo: string) {
  const { data } = await apiClient.get<Blob>(rutaDescarga, { responseType: 'blob' });
  const url = URL.createObjectURL(data);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

/**
 * Igual que descargarArchivo, pero para previsualizar en pantalla en vez de forzar la
 * descarga: devuelve una URL de objeto (revocarla con URL.revokeObjectURL cuando ya no
 * se necesite) y el tipo MIME real del archivo.
 */
export async function obtenerUrlPrevisualizacion(rutaDescarga: string) {
  const { data } = await apiClient.get<Blob>(rutaDescarga, { responseType: 'blob' });
  return { url: URL.createObjectURL(data), tipo: data.type };
}
