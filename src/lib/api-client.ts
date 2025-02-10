"use client";
import axios from "axios";
import { API_BASE_URL } from "@/config/api.config";
import { toast } from "@/hooks/use-toast";
import router from "next/router";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      toast({
        title: "Sign in required",
        description: "Please log in again to continue.",
        variant: "destructive",
      });

      setTimeout(() => {
        router.push("/login");
      }, 500);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      toast({
        title: "Session expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });

      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
