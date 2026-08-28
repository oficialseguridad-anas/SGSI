import { Button, Modal, Typography } from 'antd';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { cerrarSesion, fetchMe, login as loginRequest, verificarOtp } from '../features/accounts/api';
import type { LoginResultado, Me } from '../features/accounts/types';
import { refreshAccessToken } from '../shared/api/client';
import { tokenStorage } from '../shared/api/tokenStorage';

const INACTIVIDAD_LIMITE_MS = 5 * 60 * 1000;
// Se avisa 1 minuto antes de cerrar la sesión, en vez de cerrarla en silencio: sin
// esto, un formulario abierto mientras el usuario busca un archivo en el selector
// nativo del sistema operativo (que no genera eventos en la página) perdía la sesión
// sin ningún aviso, y el guardado fallaba después con un error genérico.
const AVISO_ANTES_DE_CERRAR_MS = 60 * 1000;
// 'focus': recuperar el foco de la pestaña (p.ej. al cerrar el selector de archivos)
// también cuenta como actividad — es exactamente el caso que perdía la sesión.
const EVENTOS_ACTIVIDAD = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'focus'];

interface AuthContextValue {
  user: Me | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResultado>;
  completarLoginOtp: (otpToken: string, codigo: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  hasPerm: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [avisoInactividad, setAvisoInactividad] = useState(false);
  const navigate = useNavigate();
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cierreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reiniciarTemporizadorRef = useRef<() => void>(() => {});

  async function loadSession() {
    // El access token vive solo en memoria: al recargar la página siempre está vacío,
    // así que el arranque intenta un refresco silencioso con la cookie httpOnly. Si no
    // hay cookie (o expiró), el refresco falla y queda como no autenticado, sin error.
    try {
      await refreshAccessToken();
      const me = await fetchMe();
      setUser(me);
    } catch {
      tokenStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSession();
  }, []);

  async function login(email: string, password: string) {
    const resultado = await loginRequest(email, password);
    if ('requiere_otp' in resultado) {
      return resultado;
    }
    // El refresh token ya quedó en la cookie httpOnly (la puso el backend en la
    // respuesta); acá solo guardamos el access token, en memoria.
    tokenStorage.setAccess(resultado.access);
    const me = await fetchMe();
    setUser(me);
    return resultado;
  }

  async function completarLoginOtp(otpToken: string, codigo: string) {
    const { access } = await verificarOtp(otpToken, codigo);
    tokenStorage.setAccess(access);
    const me = await fetchMe();
    setUser(me);
  }

  async function refreshUser() {
    const me = await fetchMe();
    setUser(me);
  }

  async function logout() {
    tokenStorage.clear();
    setUser(null);
    try {
      await cerrarSesion();
    } catch {
      // Best-effort: la sesión local ya quedó cerrada aunque esta llamada falle.
    }
  }

  function hasPerm(perm: string) {
    return Boolean(user?.is_superuser || user?.permisos.includes(perm));
  }

  // Cierra la sesión automáticamente si no hay actividad del usuario durante
  // INACTIVIDAD_LIMITE_MS, pero avisando AVISO_ANTES_DE_CERRAR_MS antes — un
  // formulario con cambios sin guardar ya no se pierde en silencio.
  useEffect(() => {
    if (!user) {
      setAvisoInactividad(false);
      return;
    }

    function cerrarPorInactividad() {
      setAvisoInactividad(false);
      logout();
      navigate('/login?motivo=inactividad', { replace: true });
    }

    function mostrarAviso() {
      setAvisoInactividad(true);
      cierreTimer.current = setTimeout(cerrarPorInactividad, AVISO_ANTES_DE_CERRAR_MS);
    }

    function reiniciarTemporizador() {
      setAvisoInactividad(false);
      if (avisoTimer.current) clearTimeout(avisoTimer.current);
      if (cierreTimer.current) clearTimeout(cierreTimer.current);
      avisoTimer.current = setTimeout(mostrarAviso, INACTIVIDAD_LIMITE_MS - AVISO_ANTES_DE_CERRAR_MS);
    }

    reiniciarTemporizadorRef.current = reiniciarTemporizador;
    EVENTOS_ACTIVIDAD.forEach((evento) => window.addEventListener(evento, reiniciarTemporizador));
    reiniciarTemporizador();

    return () => {
      if (avisoTimer.current) clearTimeout(avisoTimer.current);
      if (cierreTimer.current) clearTimeout(cierreTimer.current);
      EVENTOS_ACTIVIDAD.forEach((evento) => window.removeEventListener(evento, reiniciarTemporizador));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        completarLoginOtp,
        refreshUser,
        logout,
        hasPerm,
      }}
    >
      {children}
      <Modal
        open={avisoInactividad}
        title="Tu sesión está por cerrarse"
        closable={false}
        maskClosable={false}
        keyboard={false}
        footer={[
          <Button key="seguir" type="primary" onClick={() => reiniciarTemporizadorRef.current()}>
            Seguir conectado
          </Button>,
        ]}
      >
        <Typography.Paragraph>
          Por seguridad, tu sesión se cerrará en menos de un minuto por inactividad. Si tienes cambios sin
          guardar, haz clic en "Seguir conectado" para continuar.
        </Typography.Paragraph>
      </Modal>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
