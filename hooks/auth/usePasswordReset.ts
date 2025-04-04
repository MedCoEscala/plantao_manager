import { useState } from 'react';
import { router } from 'expo-router';
import { useDialog } from '../../app/contexts/DialogContext';

export interface UsePasswordResetResult {
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para gerenciar o processo de recuperação de senha
 */
const usePasswordReset = (): UsePasswordResetResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showDialog } = useDialog();

  const requestPasswordReset = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // No Clerk, isso normalmente é feito pelo endpoint de Reset Password
      // que envia automaticamente um email
      try {
        // Na API do Clerk, isso é feito através de fetch para o endpoint
        const clerk = globalThis.Clerk;
        if (!clerk) {
          throw new Error('Clerk não inicializado');
        }

        await clerk.client.signIn.create({
          strategy: 'reset_password_email_code',
          identifier: email,
        });

        showDialog({
          type: 'success',
          title: 'Email Enviado',
          message:
            'Um email com instruções para redefinir sua senha foi enviado para o seu endereço de email.',
        });
        router.replace('/(auth)/sign-in');
      } catch (apiError) {
        throw new Error('Falha ao solicitar redefinição de senha');
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

      // Com Clerk, normalmente isso é tratado em um fluxo completo de redefinição
      // usando a verificação e atualização via código
      try {
        const clerk = globalThis.Clerk;
        if (!clerk) {
          throw new Error('Clerk não inicializado');
        }

        // Este é um exemplo simplificado - o fluxo real com Clerk é diferente
        // e envolve verificação por código, não token
        await clerk.client.signIn.attemptFirstFactor({
          strategy: 'reset_password_email_code',
          code: token,
          password: newPassword,
        });

        showDialog({
          type: 'success',
          title: 'Senha Alterada',
          message:
            'Sua senha foi alterada com sucesso! Agora você pode fazer login com sua nova senha.',
        });
        router.replace('/(auth)/sign-in');
      } catch (apiError) {
        throw new Error('Falha ao redefinir senha');
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
};

export { usePasswordReset };
export default usePasswordReset;
