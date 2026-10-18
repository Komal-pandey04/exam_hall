import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LoadingState } from './StateViews.jsx';

/** Route guard: sends signed-out visitors to /login and brings them back afterwards. */
export default function RequireAuth() {
  const { user, checking } = useAuth();
  const location = useLocation();
  if (checking) return <LoadingState label="Checking your login…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
