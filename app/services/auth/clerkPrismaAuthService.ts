import { useSignIn, useSignUp, useUser } from '@clerk/clerk-expo';
import { useAuth } from '@clerk/clerk-expo';
import { AuthResponse, AuthService, ResetPasswordResponse } from './authTypes';
import { formatUserFromClerk } from './utils';
import { router } from 'expo-router';
import Constants from 'expo-constants';

// Função auxiliar para obter a URL base da API
function getApiBaseUrl() {
  // Em desenvolvimento, use o IP da máquina em vez de localhost
  // para que os dispositivos físicos e emuladores possam acessar
  const debuggerHost = Constants.expoConfig?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    return `http://${host}:3000/api`;
  }

  // Em produção, use a URL da API
  return '/api';
}

async function apiRequest(endpoint: string, method: string, data?: any) {
  try {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/${endpoint}`;

    console.log(`Fazendo requisição para: ${url}`);

    // Obter token de autenticação do Clerk ou usar um token de desenvolvimento
    let token = '';
    try {
      const clerk = globalThis.Clerk;
      if (clerk && clerk.session) {
        token = await clerk.session.getToken();
      } else if (__DEV__) {
        console.log('Usando token de desenvolvimento para API');
        token = 'dev-token-bypass';
      }
    } catch (tokenError) {
      console.error('Erro ao obter token:', tokenError);
      if (__DEV__) {
        token = 'dev-token-bypass';
      }
    }

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro na requisição API ${endpoint}:`, error);
    throw error;
  }
}

export function useClerkPrismaAuth(): AuthService {
  const { signIn, isLoaded: isSignInLoaded, setActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const { signOut } = useAuth();
  const { user } = useUser();

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    if (!isSignInLoaded || !signIn) {
      return {
        success: false,
        error: 'Sistema de autenticação não inicializado',
      };
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status !== 'complete') {
        return {
          success: false,
          error: 'Email ou senha incorretos',
        };
      }

      await setActive({ session: signInAttempt.createdSessionId });

      const clerkUser = user;
      if (!clerkUser) {
        return {
          success: false,
          error: 'Não foi possível recuperar os dados do usuário',
        };
      }

      try {
        const userData = {
          id: clerkUser.id,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
          email: clerkUser.primaryEmailAddress?.emailAddress || email,
          phoneNumber: clerkUser.phoneNumbers?.[0]?.phoneNumber || null,
          birthDate: (clerkUser.publicMetadata?.birthDate as string) || null,
        };

        await apiRequest('user', 'POST', userData);
        console.log('Usuário sincronizado com banco de dados via API');
      } catch (dbError) {
        console.error('Erro ao sincronizar usuário com banco via API:', dbError);
      }

      return {
        success: true,
        user: formatUserFromClerk(clerkUser, email),
      };
    } catch (error) {
      console.error('Erro durante o login:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao fazer login',
      };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phoneNumber?: string,
    birthDate?: string
  ): Promise<AuthResponse> => {
    if (!isSignUpLoaded || !signUp) {
      return {
        success: false,
        error: 'Sistema de autenticação não inicializado',
      };
    }

    try {
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const signUpAttempt = await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      router.push({
        pathname: '/(auth)/verify-code',
        params: {
          email,
          phoneNumber: phoneNumber || '',
          birthDate: birthDate || '',
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido ao registrar';
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const requestPasswordReset = async (email: string): Promise<ResetPasswordResponse> => {
    if (!isSignInLoaded || !signIn) {
      return {
        success: false,
        error: 'Sistema de autenticação não inicializado',
      };
    }

    try {
      await signIn.create({
        identifier: email,
        strategy: 'reset_password_email_code',
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao solicitar recuperação de senha',
      };
    }
  };

  const resetPassword = async (
    token: string,
    newPassword: string
  ): Promise<ResetPasswordResponse> => {
    if (!isSignInLoaded || !signIn) {
      return {
        success: false,
        error: 'Sistema de autenticação não inicializado',
      };
    }

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: token,
        password: newPassword,
      });

      if (result.status === 'complete') {
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
        }
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Código inválido ou expirado',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao redefinir senha',
      };
    }
  };

  const logout = async (): Promise<boolean> => {
    try {
      await signOut();
      return true;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return false;
    }
  };

  const isAuthenticated = async (): Promise<boolean> => {
    return !!user;
  };

  return {
    login,
    register,
    requestPasswordReset,
    resetPassword,
    logout,
    isAuthenticated,
    forgotPassword: requestPasswordReset,
  };
}

// Exportação padrão para evitar warnings
const ClerkPrismaAuthService = () => null;
export default ClerkPrismaAuthService;
