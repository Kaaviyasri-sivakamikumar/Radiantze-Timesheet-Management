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
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

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
  const router = useRouter();
  const { toast } = useToast();
  const pathname = usePathname();

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

            if (pathname === "/login") {
              toast({
                title: `Welcome back ${ (data?.user?.name || data?.user?.email || "Unknown User")}`,
                description: "Already logged in",
                variant: "default",
              });

              router.push("/");
            }


          } else {
            toast({
              title: "Session expired",
              description: "Login again to continue",
              variant: "destructive",
            });
            setTimeout(() => {
              router.push("/login");
            });
            localStorage.removeItem("token");
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
    } else {
      localStorage.removeItem("token");
      toast({
        title: "Session expired",
        description: "Login again to continue",
        variant: "destructive",
      });
      setTimeout(() => {
        router.push("/login");
      }, 200);
    }
  }, []);

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setToken(null);
      setTimeout(() => {
        router.push("/login");
      });
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
