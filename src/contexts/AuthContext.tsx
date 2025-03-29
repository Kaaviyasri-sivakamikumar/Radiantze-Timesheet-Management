"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { User } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter, usePathname } from "next/navigation";
import { service } from "@/services/service";
import { AxiosError } from "axios";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hasLoadedToken, setHasLoadedToken] = useState<boolean>(false);
  
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(true);

  const router = useRouter();
  const { toast } = useToast();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    setHasLoadedToken(true); // ✅ mark when done
  }, []);
  
  
  useEffect(() => {
    if (!hasLoadedToken) return; // ✅ wait for token to load
  
    const verifyUserSession = async () => {
      if (!token) {
        setIsAuthenticating(false);
        handleUnauthenticatedUser();
        return;
      }
  
      setIsAuthenticating(true);
  
      try {
        const response = await service.verifyToken();
        if (response.status === 200) {
          const { user } = response.data;
          setUser(user);
          setIsAdmin(user.isAdmin);
  
          if (pathname === "/login") {
            toast({
              title: `Welcome back ${user.name || user.email || "User"}`,
              description: "Already logged in",
              variant: "default",
            });
            router.push("/");
          }
        }
      } catch (error) {
        handleSessionExpiration();
      } finally {
        setIsAuthenticating(false);
      }
    };
  
    verifyUserSession();
  }, [token, hasLoadedToken]);
  

  const handleUnauthenticatedUser = () => {
    if (pathname !== "/login" && pathname !== "/login/forgot-password") {
      toast({
        title: "Login required",
        description: "Login again to continue",
        variant: "destructive",
      });
      router.push("/login");
    }
  };

  const handleSessionExpiration = () => {
    toast({
      title: "Session expired",
      description: "Login again to continue",
      variant: "destructive",
    });
    logout();
  };

  const logout = async () => {
    try {
      const response = await service.logout();
      if (response.status === 200) {
        resetAuthState();
      }
    } catch (error) {
      toast({
        title: "Failed to logout",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const resetAuthState = () => {
    setUser(null);
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin,
        setUser,
        setToken,
        setIsAdmin,
        isAuthenticated: !!user && !!token,
        logout,
        isAuthenticating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
