import { Spin } from 'antd';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';

export function PrivateRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Cuenta marcada para cambio obligatorio de contraseña: bloquea cualquier otra
  // pantalla hasta que la cambie. Fuera de ese caso, /cambiar-password también es
  // accesible voluntariamente (opción "Cambiar contraseña" del menú de usuario).
  if (user?.debe_cambiar_password && location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />;
  }

  return <Outlet />;
}
