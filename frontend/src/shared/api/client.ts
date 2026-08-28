import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './tokenStorage';

// El backend debe quedar en el MISMO host desde el que se cargó la página (localhost,
// 127.0.0.1 o la IP de LAN de este equipo): si VITE_API_URL fija un host distinto al
// que usó el navegador para abrir el frontend, quedan como "sitios" distintos y la
// cookie httpOnly del refresh token (SameSite) deja de viajar — se pierde la sesión en
// cada recarga. Por eso solo se toman el puerto y la ruta de VITE_API_URL; el host se
// reconstruye siempre con window.location.hostname.
function resolverApiUrl(): string {
  const configurada = import.meta.env.VITE_API_URL as string | undefined;
  if (!configurada) {
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
  }
  try {
    const url = new URL(configurada);
    url.hostname = window.location.hostname;
    return url.toString();
  } catch {
    return configurada;
  }
}

const API_URL = resolverApiUrl();

// withCredentials: la cookie httpOnly del refresh token solo viaja en peticiones
// "con credenciales" — sin esto el navegador nunca la adjuntaría (frontend y backend
// son orígenes distintos: :5173 vs :8000).
export const apiClient = axios.create({ baseURL: API_URL, withCredentials: true });

const refreshClient = axios.create({ baseURL: API_URL, withCredentials: true });

apiClient.interceptors.request.use((config) => {
  const access = tokenStorage.getAccess();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Endpoints de autenticación: un 401 aquí significa credenciales/código inválidos,
// no una sesión expirada — no debe intentar refrescar el token ni redirigir a /login
// (ya estamos ahí), sino dejar que el propio formulario muestre el error.
const RUTAS_SIN_REINTENTO_DE_TOKEN = ['/auth/token/', '/auth/token/verificar-otp/', '/auth/token/refresh/'];

function esRutaDeAutenticacion(url?: string): boolean {
  return Boolean(url) && RUTAS_SIN_REINTENTO_DE_TOKEN.some((ruta) => url!.endsWith(ruta));
}

// Deduplicado a propósito DENTRO de la función (no en cada llamador): el refresh
// token rota en cada uso (ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION), así que
// dos refrescos concurrentes con la misma cookie no son idempotentes — el segundo
// llega con un token que el primero ya invalidó y recibe 401. Esto pasaba de verdad:
// en desarrollo, StrictMode monta el efecto de carga de sesión dos veces, disparando
// dos POST simultáneos a /auth/token/refresh/ y dejando al usuario deslogueado por una
// carrera. Compartir una única promesa en vuelo, sin importar quién la pida
// (el arranque de la app o el interceptor de 401), lo evita de raíz.
let refreshPromise: Promise<string> | null = null;

// El refresh token va en la cookie httpOnly (el navegador la manda solo); no hay nada
// que leer ni enviar en el body.
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/auth/token/refresh/')
      .then(({ data }) => {
        tokenStorage.setAccess(data.access);
        return data.access as string;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !esRutaDeAutenticacion(originalRequest.url)
    ) {
      originalRequest._retry = true;
      try {
        const access = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        tokenStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
