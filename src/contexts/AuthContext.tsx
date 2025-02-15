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
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
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
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const router = useRouter();
  const { toast } = useToast();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        service.verifyToken().then((response) => {
          if (response.status === 200) {
            const data = response.data;
            // const userRole = data?.user?.role;
            setUser({ ...data.user });
            setIsAdmin(data.user.isAdmin);
            // setIsAdmin(userRole === "admin"); // Set isAdmin flag

            if (pathname === "/login") {
              toast({
                title: `Welcome back ${
                  data?.user?.name || data?.user?.email || "Unknown User"
                }`,
                description: "Already logged in",
                variant: "default",
              });

              router.push("/");
            }
          }
        });
      } else {
        if (pathname !== "/login") {
          toast({
            title: "Login required",
            description: "Login again to continue",
            variant: "destructive",
          });
          setTimeout(() => {
            router.push("/login");
          });
        }
      }
    } catch (err) {
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
      setIsAdmin(false);
    }
  }, []);

  const logout = async () => {
    try {
      service.logout().then((response) => {
        if (response.status === 200) {
          setUser(null);
          setToken(null);
          setIsAdmin(false);
          localStorage.removeItem("token");
          setTimeout(() => {
            router.push("/login");
          });
        }
      });
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Failed to logout",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    token,
    isAdmin,
    setUser,
    setToken,
    setIsAdmin,
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
