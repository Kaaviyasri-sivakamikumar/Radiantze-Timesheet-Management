"use client";

import { useState } from 'react';
import { authService } from '@/services/api/auth.service';
import type { AuthFormData, AuthResponse } from '@/types/features/auth';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, setToken } = useAuthContext();
  const router = useRouter();

  const handleAuthResponse = (response: AuthResponse) => {
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem('token', response.token);
  };

  const login = async (data: AuthFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);
      handleAuthResponse(response);

      // Redirect based on role
      if (response.user.role === 'admin') {
        router.push('/admin/dashboard'); // Admin dashboard
      } else {
        router.push('/timesheet'); // Timesheet submission page
      }

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: AuthFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      handleAuthResponse(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    register,
    isLoading,
    error,
  };
} 