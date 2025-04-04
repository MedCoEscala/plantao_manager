import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import type { User } from '../types/user';
import { useDialog } from './DialogContext';
import { useSQLite } from './SQLiteContext';
import { userSyncService } from '../services/sync';

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
  const { isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
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
        if (!isLoaded) return;

        if (isSignedIn && clerkUser) {
          // Mapear dados do usuário do Clerk
          const userData: User = {
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
            createdAt: clerkUser.createdAt
              ? clerkUser.createdAt.toString()
              : new Date().toISOString(),
            updatedAt: clerkUser.updatedAt
              ? clerkUser.updatedAt.toString()
              : new Date().toISOString(),
            phoneNumber: clerkUser.phoneNumbers[0]?.phoneNumber || '',
            birthDate: (clerkUser.publicMetadata?.birthDate as string) || '',
          };

          setUser(userData);

          // Sincroniza com o banco de dados local
          if (database) {
            await userSyncService.updateUserInLocal(userData);
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
  }, [isLoaded, isSignedIn, clerkUser]);

  /**
   * Função para fazer login - apenas um stub que será implementado via hook
   */
  const login = async (email: string, password: string) => {
    // Esta função será implementada pelo hook useLogin
    console.log('A função de login no AuthContext não deve ser chamada diretamente.');
  };

  /**
   * Função para registrar - apenas um stub que será implementado via hook
   */
  const register = async (
    name: string,
    email: string,
    password: string,
    phoneNumber?: string,
    birthDate?: string
  ) => {
    // Esta função será implementada pelo hook useRegister
    console.log('A função de registro no AuthContext não deve ser chamada diretamente.');
  };

  /**
   * Função para fazer logout
   */
  const logout = async () => {
    try {
      setIsLoading(true);

      await signOut();
      setUser(null);

      router.replace('/(auth)/sign-in');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido ao fazer logout';
      showDialog({
        type: 'error',
        title: 'Erro ao Sair',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para usar o contexto de autenticação
 */
export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
}

export type { User };
export default AuthProvider;
