import { apiClient } from '../../shared/api/client';
import type { LoginResultado, Me, Setup2FA, TokensJWT, Usuario, UsuarioCreateInput, UsuarioUpdateInput } from './types';

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<LoginResultado>('/auth/token/', { email, password });
  return data;
}

export async function verificarOtp(otpToken: string, codigo: string) {
  const { data } = await apiClient.post<TokensJWT>('/auth/token/verificar-otp/', {
    otp_token: otpToken,
    codigo,
  });
  return data;
}

export async function reenviarOtp(otpToken: string) {
  await apiClient.post('/auth/token/reenviar-otp/', { otp_token: otpToken });
}

export async function cerrarSesion() {
  await apiClient.post('/auth/logout/');
}

export async function fetchMe() {
  const { data } = await apiClient.get<Me>('/auth/me/');
  return data;
}

export async function cambiarPassword(passwordActual: string, passwordNueva: string) {
  await apiClient.post('/auth/cambiar-password/', {
    password_actual: passwordActual,
    password_nueva: passwordNueva,
  });
}

export async function solicitarRecuperacionPassword(email: string) {
  await apiClient.post('/auth/password/solicitar/', { email });
}

export async function confirmarRecuperacionPassword(email: string, codigo: string, passwordNueva: string) {
  await apiClient.post('/auth/password/confirmar/', {
    email,
    codigo,
    password_nueva: passwordNueva,
  });
}

export async function fetchUsuarios() {
  const { data } = await apiClient.get<{ results: Usuario[]; count: number }>('/usuarios/');
  return data;
}

export async function crearUsuario(input: UsuarioCreateInput) {
  const { data } = await apiClient.post<Usuario>('/usuarios/', input);
  return data;
}

export async function actualizarUsuario(id: number, input: UsuarioUpdateInput) {
  const { data } = await apiClient.patch<Usuario>(`/usuarios/${id}/`, input);
  return data;
}

export async function eliminarUsuario(id: number) {
  await apiClient.delete(`/usuarios/${id}/`);
}

export async function setup2fa() {
  const { data } = await apiClient.post<Setup2FA>('/auth/2fa/setup/');
  return data;
}

export async function activar2fa(codigo: string) {
  const { data } = await apiClient.post<{ codigos_recuperacion: string[] }>('/auth/2fa/activar/', { codigo });
  return data;
}

export async function desactivar2fa(password: string, codigo: string) {
  await apiClient.post('/auth/2fa/desactivar/', { password, codigo });
}

export async function enviarCodigoEmailActivacion() {
  await apiClient.post('/auth/2fa/email/enviar/');
}

export async function activarEmail2fa(codigo: string) {
  const { data } = await apiClient.post<{ codigos_recuperacion: string[] }>('/auth/2fa/email/activar/', { codigo });
  return data;
}
