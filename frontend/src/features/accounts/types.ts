export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  es_rol_sistema: boolean;
}

export interface Usuario {
  id: number;
  email: string;
  nombre_completo: string;
  cargo: string;
  direccion: number | null;
  direccion_nombre: string | null;
  telefono: string;
  is_active: boolean;
  debe_cambiar_password: boolean;
  roles: Rol[];
  date_joined: string;
}

export interface UsuarioCreateInput {
  email: string;
  nombre_completo: string;
  cargo: string;
  direccion: number | null;
  telefono: string;
  password: string;
  is_active: boolean;
  debe_cambiar_password: boolean;
}

export type UsuarioUpdateInput = Omit<UsuarioCreateInput, 'password'>;

export type MetodoOtp = 'APP' | 'EMAIL';

export interface Me {
  id: number;
  email: string;
  nombre_completo: string;
  cargo: string;
  direccion_nombre: string | null;
  is_superuser: boolean;
  is_staff: boolean;
  otp_habilitado: boolean;
  otp_metodo: MetodoOtp;
  debe_cambiar_password: boolean;
  roles: string[];
  permisos: string[];
}

export interface TokensJWT {
  // El refresh token ya no viaja en el body: el backend lo entrega en una cookie
  // httpOnly que el JavaScript del frontend nunca llega a leer.
  access: string;
}

export interface LoginRequiereOtp {
  requiere_otp: true;
  metodo: MetodoOtp;
  otp_token: string;
}

export type LoginResultado = TokensJWT | LoginRequiereOtp;

export interface Setup2FA {
  secreto: string;
  otpauth_url: string;
}
