"use client";
import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "@/config/api.config";
import { toast } from "@/hooks/use-toast";
import router from "next/router";

const PUBLIC_ENDPOINTS = [API_ENDPOINTS.AUTH.LOGIN, API_ENDPOINTS.AUTH.RESET_PASSWORD];


// Helper function to safely access localStorage
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();

    // Check if the request URL matches a public endpoint
    const isPublic = PUBLIC_ENDPOINTS.some((url) =>
      config.url?.includes(url)
    );

    if (!isPublic) {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        toast({
          title: "Sign in required",
          description: "Please log in again to continue.",
          variant: "destructive",
        });

        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
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
