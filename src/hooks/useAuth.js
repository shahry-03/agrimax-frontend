import useAppStore from '../store/useAppStore';

/**
 * useAuth — Hook for managing JWT tokens, user authentication, and profile state.
 */
export function useAuth() {
  const { user, token, isAuthenticated, login, logout, sessionId, resetSessionId } =
    useAppStore();

  return {
    user,
    token,
    isAuthenticated,
    sessionId,
    login,
    logout,
    resetSessionId,
  };
}

export default useAuth;
