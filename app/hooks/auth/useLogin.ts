import { useState } from 'react';
import { router } from 'expo-router';
import { authService } from '../../services/auth';
import { useDialog } from '../../contexts/DialogContext';

export interface UseLoginResult {
  login: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useLogin(): UseLoginResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showDialog } = useDialog();

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.login(email, password);

      if (result.success && result.user) {
        setIsLoading(false);
        router.replace('/(root)');
      } else {
        setError(result.error || 'Erro desconhecido ao fazer login');
        showDialog({
          type: 'error',
          title: 'Falha no Login',
          message:
            result.error || 'Não foi possível fazer login. Por favor, verifique suas credenciais.',
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

  return {
    login,
    isLoading,
    error,
  };
}
