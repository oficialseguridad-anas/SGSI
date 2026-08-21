import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';

export function AdminRoute() {
  const { user } = useAuth();

  if (!user?.is_superuser) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
