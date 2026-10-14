import { Navigate, Outlet } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

/**
 * ProtectedRoute — redirects to /login if not authenticated.
 * Wraps protected routes in the BrowserRouter.
 */
export default function ProtectedRoute() {
  const { isAuthenticated } = useAppStore();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
