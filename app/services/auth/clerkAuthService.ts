import { AuthResponse, AuthService, ResetPasswordResponse } from './authTypes';
import { User } from '../../types/user';
import { formatUserFromClerk } from './utils';
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

// Função auxiliar para fazer requisições à API
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

class ClerkAuthService implements AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      if (!email || !password) {
        return {
          success: false,
          error: 'Email e senha são obrigatórios',
        };
      }

      const clerk = globalThis.Clerk;
      if (!clerk) {
        return {
          success: false,
          error: 'Sistema de autenticação não inicializado',
        };
      }

      try {
        const signInAttempt = await clerk.client.signIn.create({
          identifier: email,
          password,
        });

        if (signInAttempt.status !== 'complete') {
          return {
            success: false,
            error: 'Email ou senha incorretos',
          };
        }

        await clerk.setActive({
          session: signInAttempt.createdSessionId,
        });

        const user = await clerk.user;

        if (!user) {
          return {
            success: false,
            error: 'Não foi possível recuperar os dados do usuário',
          };
        }

        const userInfo = formatUserFromClerk(user, email);

        // Usar a API em vez do Prisma direto
        try {
          await apiRequest('user', 'POST', {
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            phoneNumber: userInfo.phoneNumber,
            birthDate: userInfo.birthDate,
          });
        } catch (syncError) {
          console.error('Erro ao sincronizar usuário com banco:', syncError);
          // Não interrompemos o login se a sincronização falhar
        }

        return {
          success: true,
          user: userInfo,
        };
      } catch (signInError) {
        console.error('Erro durante o login:', signInError);
        return {
          success: false,
          error: 'Email ou senha incorretos',
        };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Ocorreu um erro durante o login';

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async register(
    name: string,
    email: string,
    password: string,
    phoneNumber?: string,
    birthDate?: string
  ): Promise<AuthResponse> {
    try {
      if (!name || !email || !password) {
        return {
          success: false,
          error: 'Nome, email e senha são obrigatórios',
        };
      }

      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const clerk = globalThis.Clerk;
      if (!clerk) {
        return {
          success: false,
          error: 'Sistema de autenticação não inicializado',
        };
      }

      try {
        const signUpAttempt = await clerk.client.signUp.create({
          firstName,
          lastName,
          emailAddress: email,
          password,
        });

        if (signUpAttempt.status !== 'complete') {
          return {
            success: false,
            error: 'Falha no processo de registro',
          };
        }

        await clerk.setActive({
          session: signUpAttempt.createdSessionId,
        });

        const user = await clerk.user;

        if (!user) {
          return {
            success: false,
            error: 'Não foi possível recuperar os dados do usuário',
          };
        }

        await this.updateUserMetadata(user, { phoneNumber, birthDate });

        const userInfo: User = {
          id: user.id,
          email: email,
          name: name,
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: user.updatedAt || new Date().toISOString(),
          phoneNumber: phoneNumber || '',
          birthDate: birthDate || '',
        };

        // Usar a API em vez do Prisma direto
        try {
          await apiRequest('user', 'POST', {
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            phoneNumber: userInfo.phoneNumber,
            birthDate: userInfo.birthDate,
          });
        } catch (syncError) {
          console.error('Erro ao sincronizar usuário com banco:', syncError);
          // Não interrompemos o registro se a sincronização falhar
        }

        return {
          success: true,
          user: userInfo,
        };
      } catch (signUpError) {
        console.error('Erro durante o registro:', signUpError);
        return {
          success: false,
          error: 'Este email já pode estar cadastrado ou ocorreu um erro no registro',
        };
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Ocorreu um erro durante o registro';

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async forgotPassword(email: string): Promise<ResetPasswordResponse> {
    try {
      if (!email) {
        return {
          success: false,
          error: 'Email é obrigatório',
        };
      }

      const clerk = globalThis.Clerk;
      if (!clerk) {
        return {
          success: false,
          error: 'Sistema de autenticação não inicializado',
        };
      }

      await clerk.client.signIn.create({
        identifier: email,
        strategy: 'reset_password_email_code',
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao solicitar recuperação de senha',
      };
    }
  }

  async logout(): Promise<boolean> {
    try {
      const clerk = globalThis.Clerk;
      if (!clerk) {
        return false;
      }

      await clerk.signOut();
      return true;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const clerk = globalThis.Clerk;
    return clerk ? !!clerk.user : false;
  }

  async requestPasswordReset(email: string): Promise<ResetPasswordResponse> {
    return this.forgotPassword(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
    try {
      const clerk = globalThis.Clerk;
      if (!clerk) {
        return {
          success: false,
          error: 'Sistema de autenticação não inicializado',
        };
      }

      const signIn = clerk.client.signIn;
      if (!signIn) {
        return {
          success: false,
          error: 'Sistema de autenticação não inicializado',
        };
      }

      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: token,
        password: newPassword,
      });

      if (result.status === 'complete') {
        if (result.createdSessionId) {
          await clerk.setActive({
            session: result.createdSessionId,
          });
        }
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Código inválido ou expirado',
        };
      }
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao redefinir senha',
      };
    }
  }

  private async updateUserMetadata(
    user: any,
    data: { phoneNumber?: string; birthDate?: string }
  ): Promise<void> {
    try {
      if (!user) return;

      const updateData = {
        publicMetadata: {
          ...user.publicMetadata,
        },
      };

      if (data.phoneNumber) {
        updateData.publicMetadata.phoneNumber = data.phoneNumber;
      }

      if (data.birthDate) {
        updateData.publicMetadata.birthDate = data.birthDate;
      }

      await user.update(updateData);
    } catch (error) {
      console.error('Erro ao atualizar metadados do usuário:', error);
    }
  }
}

// Criar uma instância do serviço
const clerkAuthService = new ClerkAuthService();
export default clerkAuthService;
