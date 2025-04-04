import { useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useDialog } from '../../app/contexts/DialogContext';

export interface UseLogoutResult {
  logout: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Hook para gerenciar o processo de logout
 */
const useLogout = (): UseLogoutResult => {
  const [isLoading, setIsLoading] = useState(false);
  const { signOut } = useAuth();
  const { showDialog } = useDialog();

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut();
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

  return {
    logout,
    isLoading,
  };
};

export { useLogout };
export default useLogout;
