import { apiClient } from './client';

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
