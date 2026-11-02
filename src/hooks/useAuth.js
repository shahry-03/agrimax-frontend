import { useMemo } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * useAuth — Advanced Hook for managing JWT tokens, user authentication, and roles.
 * Features:
 * - Role-Based Access Control (RBAC) helpers.
 * - User Initials generator for Avatars.
 * - Token Expiry check (JWT decode).
 */
export function useAuth() {
  const { 
    user, 
    token, 
    isAuthenticated, 
    login, 
    logout, 
    sessionId, 
    resetSessionId 
  } = useAppStore();

  // 1. Role Checking (Industry Standard)
  const hasRole = (role) => user?.role === role;
  const hasAnyRole = (roles) => roles.includes(user?.role);
  
  const isFarmer = hasRole('FARMER') || (!user?.role && !user?.email);
  const isBuyer = hasRole('BUYER');
  const isAdmin = hasRole('ADMIN');
  const isDelivery = hasRole('DELIVERY');
  const isGuest = !isAuthenticated;

  // 2. Avatar Initials (e.g., "Ali Khan" -> "AK")
  const getUserInitials = () => {
    if (!user?.name) return isBuyer ? '💼' : '👨‍🌾';
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // 3. Token Expiry Check (Optional but highly advanced)
  const isTokenExpired = useMemo(() => {
    if (!token) return true;
    try {
      // Decode JWT payload safely
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const { exp } = JSON.parse(jsonPayload);
      // Check if token is expired (exp is in seconds)
      return exp * 1000 < Date.now();
    } catch (error) {
      return true; // If decoding fails, consider it expired
    }
  }, [token]);

  return {
    // Core State
    user,
    token,
    isAuthenticated,
    isGuest,
    sessionId,
    
    // Roles
    isFarmer,
    isBuyer,
    isAdmin,
    isDelivery,
    hasRole,
    hasAnyRole,

    // Actions
    login,
    logout,
    resetSessionId,
    
    // Helpers
    getUserInitials,
    isTokenExpired,
  };
}

export default useAuth;