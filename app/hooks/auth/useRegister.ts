import { useState } from 'react';
import { router } from 'expo-router';
import { authService } from '../../services/auth';
import { useDialog } from '../../contexts/DialogContext';

export interface UseRegisterResult {
  register: (
    name: string,
    email: string,
    password: string,
    phoneNumber?: string,
    birthDate?: string
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useRegister(): UseRegisterResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showDialog } = useDialog();

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
        setIsLoading(false);
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

  return {
    register,
    isLoading,
    error,
  };
}
