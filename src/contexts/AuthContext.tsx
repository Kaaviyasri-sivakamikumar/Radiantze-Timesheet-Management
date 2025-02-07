"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authService } from "@/services/api/auth.service";
import type { User } from "@/types/features/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      // Make API call to verify token with proper Authorization header
      fetch("/api/auth/verify", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUser({ ...data.user, role: data.user.role });
            setToken(storedToken);
          } else {
            alert("Invalid token Please login again");
            // localStorage.removeItem("token");
            setUser(null);
            setToken(null);
          }
        });
      // .catch((error) => {
      //   console.error("Token verification failed:", error);
      //   console.error("Stack trace:", error.stack);
      //   console.trace();
      //   alert("Invalid token. Something went wrong");
      //   //add delay for 10 seconds
      //   setTimeout(() => {
      //     alert("Invalid token. Something went wrong");
      //   }, 10000);
      //   // localStorage.removeItem("token");
      //   setUser(null);
      //   setToken(null);
      // });
    }
  }, []);

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const value = {
    user,
    token,
    setUser,
    setToken,
    isAuthenticated: !!user && !!token,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
