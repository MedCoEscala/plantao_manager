import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import type { User } from '../types/user';
import { useDialog } from './DialogContext';
import { useSQLite } from './SQLiteContext';
import { userSyncService } from '../services/sync';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { showDialog } = useDialog();
  const { database } = useSQLite();

  useEffect(() => {
    if (database) {
      userSyncService.initialize(database);
    }
  }, [database]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!isLoaded) return;

        if (isSignedIn && clerkUser) {
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

          if (database) {
            await userSyncService.updateUserInLocal(userData);
          }

          router.replace('/(root)');
        } else {
          if (database) {
            const localUser = await userSyncService.getUserFromLocal();
            if (localUser) {
              setUser(localUser);
              router.replace('/(root)');
              return;
            }
          }

          router.replace('/(auth)/sign-in');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        showDialog({
          type: 'error',
          title: 'Erro de Autenticação',
          message: 'Erro ao verificar seu login. Por favor, tente novamente.',
        });

        router.replace('/(auth)/sign-in');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isLoaded, isSignedIn, clerkUser]);

  const login = async (email: string, password: string) => {
    console.log('A função de login no AuthContext não deve ser chamada diretamente.');
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phoneNumber?: string,
    birthDate?: string
  ) => {
    console.log('A função de registro no AuthContext não deve ser chamada diretamente.');
  };

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

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
}

export type { User };
export default AuthProvider;
