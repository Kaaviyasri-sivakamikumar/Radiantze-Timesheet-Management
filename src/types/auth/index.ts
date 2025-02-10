export interface AuthFormData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
  // Add other user properties
} 