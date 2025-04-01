import { useState } from 'react';
import { router } from 'expo-router';
import { authService } from '../../services/auth';
import { useDialog } from '../../contexts/DialogContext';

export interface UseLogoutResult {
  logout: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Hook para gerenciar o processo de logout
 */
export function useLogout(): UseLogoutResult {
  const [isLoading, setIsLoading] = useState(false);
  const { showDialog } = useDialog();

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
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
}
