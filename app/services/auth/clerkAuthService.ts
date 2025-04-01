import * as SecureStore from 'expo-secure-store';
import { AuthResponse, AuthService, ResetPasswordResponse } from './authTypes';
import { User } from '../../types/user';
import { formatUserFromClerk } from './utils';

const CLERK_USER_KEY = 'clerk_user';

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

        await SecureStore.setItemAsync(CLERK_USER_KEY, JSON.stringify(userInfo));

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

        await SecureStore.setItemAsync(CLERK_USER_KEY, JSON.stringify(userInfo));

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

      await SecureStore.deleteItemAsync(CLERK_USER_KEY);

      return true;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const clerk = globalThis.Clerk;
      return !!clerk && !!clerk.session;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  }

  async requestPasswordReset(email: string): Promise<ResetPasswordResponse> {
    return this.forgotPassword(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
    try {
      if (!token || !newPassword) {
        return {
          success: false,
          error: 'Token e nova senha são obrigatórios',
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
        await clerk.client.signIn.attemptFirstFactor({
          strategy: 'reset_password_email_code',
          code: token,
          password: newPassword,
        });

        return {
          success: true,
        };
      } catch (error) {
        console.error('Erro ao redefinir senha:', error);
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
      if (data.phoneNumber) {
        try {
          await user.createPhoneNumber({ phoneNumber: data.phoneNumber });
        } catch (phoneError) {
          console.error('Erro ao adicionar telefone:', phoneError);
        }
      }

      if (data.birthDate) {
        try {
          await user.update({
            publicMetadata: { birthDate: data.birthDate },
          });
        } catch (metadataError) {
          console.error('Erro ao adicionar data de nascimento:', metadataError);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar metadados do usuário:', error);
    }
  }
}

export default new ClerkAuthService();
