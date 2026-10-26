import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { HiOutlineShieldExclamation } from 'react-icons/hi2';

/**
 * ProtectedRoute — Advanced Route Guard.
 * Features:
 * - Loading state (prevents flashing login screen while checking auth).
 * - Redirect state (sends user back to the intended page after login).
 * - Role-based access control (optional).
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, isLoading } = useAppStore();
  const location = useLocation();

  // 1. Show a premium loading state if auth is being verified
  // (Note: Agar aapke store mein 'isLoading' nahi hai, toh aap ise hata sakte hain, par industry standard mein yeh hota hai)
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-fade-in">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm font-bold text-slate-500 animate-pulse">
          Verifying secure session...
        </p>
      </div>
    );
  }

  // 2. If not logged in, redirect to login page.
  // 'state={{ from: location }}' saves the current URL so we can redirect back after login.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role-Based Access Control (Optional)
  // Agar user ka role allowedRoles mein nahi hai, toh unauthorized page par bhejo.
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 animate-fade-in">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-100 shadow-sm">
          <HiOutlineShieldExclamation className="text-4xl" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          You do not have the required permissions to view this page. Please contact support if you believe this is an error.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  // 4. User is authenticated and authorized -> Render the child routes
  return <Outlet />;
}