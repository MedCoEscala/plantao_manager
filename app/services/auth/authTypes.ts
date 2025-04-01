import { User } from '../../types/user';

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  error?: string;
}

export interface AuthService {
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (
    name: string,
    email: string,
    password: string,
    phoneNumber?: string,
    birthDate?: string
  ) => Promise<AuthResponse>;
  forgotPassword: (email: string) => Promise<ResetPasswordResponse>;
  requestPasswordReset: (email: string) => Promise<ResetPasswordResponse>;
  resetPassword: (token: string, newPassword: string) => Promise<ResetPasswordResponse>;
  logout: () => Promise<boolean>;
  isAuthenticated: () => Promise<boolean>;
}
