import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './tokenStorage';

const API_URL = import.meta.env.VITE_API_URL as string;

export const apiClient = axios.create({ baseURL: API_URL });

const refreshClient = axios.create({ baseURL: API_URL });

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

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) {
    throw new Error('No hay refresh token disponible');
  }
  const { data } = await refreshClient.post('/auth/token/refresh/', { refresh });
  tokenStorage.setAccess(data.access);
  return data.access;
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
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const access = await refreshPromise;
        refreshPromise = null;
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        tokenStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
