import clerkAuthService from './clerkAuthService';
import type { AuthResponse, AuthService, ResetPasswordResponse } from './authTypes';

export { clerkAuthService as authService };
export type { AuthResponse, AuthService, ResetPasswordResponse };

// Exportação padrão para evitar avisos de rota em React Native
export default function AuthModule() {
  return null;
}
