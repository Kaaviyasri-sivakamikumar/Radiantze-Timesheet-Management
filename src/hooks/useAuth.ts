import { useAuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  const { user, setUser, token, logout, isAuthenticated, isAdmin,isAuthenticating } = useAuthContext();
  const loading = false;

  return {
    user,
    loading,
    logout,
    isAuthenticated,
    isAdmin,
    isAuthenticating
  };
} 