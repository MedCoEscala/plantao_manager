import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import type { User } from '../types/user';
import { authService } from '../services/auth';
import { profileService } from '../services/profile';
import { userSyncService } from '../services/sync';
import { useDialog } from './DialogContext';
import { useSQLite } from './SQLiteContext';

/**
 * Interface para os dados do contexto de autenticação
 */
interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phoneNumber?: string,
    birthDate?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

/**
 * Provedor de autenticação para a aplicação
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showDialog } = useDialog();
  const { database } = useSQLite();

  /**
   * Inicializa o serviço de sincronização com o banco de dados
   */
  useEffect(() => {
    if (database) {
      userSyncService.initialize(database);
    }
  }, [database]);

  /**
   * Verifica se o usuário está logado ao iniciar o app
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);

        // Verifica autenticação com Clerk
        const isAuthenticated = await authService.isAuthenticated();

        if (isAuthenticated) {
          // Tenta obter dados do Clerk
          const userData = await profileService.getUserProfile();

          if (userData) {
            setUser(userData);

            // Verifica se é necessário sincronizar dados com SQLite
            if (database && (await userSyncService.hasPendingSync())) {
              await userSyncService.syncUserData();
            }

            router.replace('/(root)');
          } else {
            // Tenta obter usuário do banco de dados local
            if (database) {
              const localUser = await userSyncService.getUserFromLocal();
              if (localUser) {
                setUser(localUser);
                router.replace('/(root)');
                return;
              }
            }

            // Se não encontrou dados localmente, redireciona para login
            router.replace('/(auth)/sign-in');
          }
        } else {
          // Não está autenticado, redireciona para login
          router.replace('/(auth)/sign-in');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        showDialog({
          type: 'error',
          title: 'Erro de Autenticação',
          message: 'Erro ao verificar seu login. Por favor, tente novamente.',
        });

        // Em caso de erro, redireciona para login
        router.replace('/(auth)/sign-in');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Função para fazer login
   */
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.login(email, password);

      if (result.success && result.user) {
        setUser(result.user);

        // Sincroniza com o banco de dados local
        if (database) {
          await userSyncService.updateUserInLocal(result.user);
        }

        router.replace('/(root)');
      } else {
        setError(result.error || 'Erro desconhecido ao fazer login');
        showDialog({
          type: 'error',
          title: 'Falha no Login',
          message: result.error || 'Email ou senha inválidos. Por favor, tente novamente.',
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido ao fazer login';
      setError(errorMessage);
      showDialog({
        type: 'error',
        title: 'Erro de Login',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Função para registrar um novo usuário
   */
  const register = async (
    name: string,
    email: string,
    password: string,
    phoneNumber?: string,
    birthDate?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.register(name, email, password, phoneNumber, birthDate);

      if (result.success && result.user) {
        setUser(result.user);

        // Sincroniza com o banco de dados local
        if (database) {
          await userSyncService.updateUserInLocal(result.user);
        }

        router.replace('/(root)');

        showDialog({
          type: 'success',
          title: 'Cadastro Realizado',
          message: 'Sua conta foi criada com sucesso!',
        });
      } else {
        setError(result.error || 'Erro desconhecido ao registrar');
        showDialog({
          type: 'error',
          title: 'Falha no Cadastro',
          message: result.error || 'Não foi possível criar sua conta. Por favor, tente novamente.',
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido ao registrar';
      setError(errorMessage);
      showDialog({
        type: 'error',
        title: 'Erro de Cadastro',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      showDialog({
        type: 'error',
        title: 'Erro de Logout',
        message: 'Ocorreu um erro ao sair da sua conta.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};

export type { User };
export default AuthProvider;
