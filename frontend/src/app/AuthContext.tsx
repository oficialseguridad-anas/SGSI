import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMe, invalidarRefreshToken, login as loginRequest, verificarOtp } from '../features/accounts/api';
import type { LoginResultado, Me } from '../features/accounts/types';
import { tokenStorage } from '../shared/api/tokenStorage';

const INACTIVIDAD_LIMITE_MS = 5 * 60 * 1000;
const EVENTOS_ACTIVIDAD = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

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
  const navigate = useNavigate();
  const inactividadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function loadSession() {
    if (!tokenStorage.getAccess()) {
      setIsLoading(false);
      return;
    }
    try {
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
    tokenStorage.setTokens(resultado.access, resultado.refresh);
    const me = await fetchMe();
    setUser(me);
    return resultado;
  }

  async function completarLoginOtp(otpToken: string, codigo: string) {
    const { access, refresh } = await verificarOtp(otpToken, codigo);
    tokenStorage.setTokens(access, refresh);
    const me = await fetchMe();
    setUser(me);
  }

  async function refreshUser() {
    const me = await fetchMe();
    setUser(me);
  }

  async function logout() {
    const refresh = tokenStorage.getRefresh();
    tokenStorage.clear();
    setUser(null);
    if (refresh) {
      try {
        await invalidarRefreshToken(refresh);
      } catch {
        // Best-effort: la sesión local ya quedó cerrada aunque esta llamada falle.
      }
    }
  }

  function hasPerm(perm: string) {
    return Boolean(user?.is_superuser || user?.permisos.includes(perm));
  }

  // Cierra la sesión automáticamente si no hay actividad del usuario (mouse,
  // teclado, scroll) durante INACTIVIDAD_LIMITE_MS.
  useEffect(() => {
    if (!user) return;

    function cerrarPorInactividad() {
      logout();
      navigate('/login?motivo=inactividad', { replace: true });
    }

    function reiniciarTemporizador() {
      if (inactividadTimer.current) clearTimeout(inactividadTimer.current);
      inactividadTimer.current = setTimeout(cerrarPorInactividad, INACTIVIDAD_LIMITE_MS);
    }

    EVENTOS_ACTIVIDAD.forEach((evento) => window.addEventListener(evento, reiniciarTemporizador));
    reiniciarTemporizador();

    return () => {
      if (inactividadTimer.current) clearTimeout(inactividadTimer.current);
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
