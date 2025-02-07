// hooks/useAuth.js
import { useAuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  const { user, setUser, token, logout, isAuthenticated } = useAuthContext();
  const loading = false; // We can remove loading state since context handles it

  return {
    user,
    loading,
    logout,
    isAuthenticated,
  };
}
