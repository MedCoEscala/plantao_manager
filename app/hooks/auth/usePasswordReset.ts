import { useState } from 'react';
import { router } from 'expo-router';
import { authService } from '../../services/auth';
import { useDialog } from '../../contexts/DialogContext';

export interface UsePasswordResetResult {
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para gerenciar o processo de recuperação de senha
 */
export function usePasswordReset(): UsePasswordResetResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showDialog } = useDialog();

  const requestPasswordReset = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.requestPasswordReset(email);

      if (result.success) {
        showDialog({
          type: 'success',
          title: 'Email Enviado',
          message:
            'Um email com instruções para redefinir sua senha foi enviado para o seu endereço de email.',
        });
        router.replace('/(auth)/sign-in');
      } else {
        setError(result.error || 'Erro ao solicitar redefinição de senha');
        showDialog({
          type: 'error',
          title: 'Falha na Solicitação',
          message: result.error || 'Não foi possível enviar o email de redefinição de senha.',
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido na redefinição de senha';
      setError(errorMessage);
      showDialog({
        type: 'error',
        title: 'Erro',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.resetPassword(token, newPassword);

      if (result.success) {
        showDialog({
          type: 'success',
          title: 'Senha Alterada',
          message:
            'Sua senha foi alterada com sucesso! Agora você pode fazer login com sua nova senha.',
        });
        router.replace('/(auth)/sign-in');
      } else {
        setError(result.error || 'Erro ao redefinir senha');
        showDialog({
          type: 'error',
          title: 'Falha na Redefinição',
          message:
            result.error ||
            'Não foi possível redefinir sua senha. Tente novamente ou solicite um novo link.',
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido na redefinição de senha';
      setError(errorMessage);
      showDialog({
        type: 'error',
        title: 'Erro',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    requestPasswordReset,
    resetPassword,
    isLoading,
    error,
  };
}
