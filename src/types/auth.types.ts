export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export type AuthError = {
  code: string;
  message: string;
};
