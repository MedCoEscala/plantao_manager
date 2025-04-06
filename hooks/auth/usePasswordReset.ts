import { useState } from 'react';
import { router } from 'expo-router';
import { useDialog } from '../../app/contexts/DialogContext';
import { useSignIn } from '@clerk/clerk-expo';

export interface UsePasswordResetResult {
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const usePasswordReset = (): UsePasswordResetResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showDialog } = useDialog();
  const { isLoaded, signIn, setActive } = useSignIn();

  const requestPasswordReset = async (email: string) => {
    if (!isLoaded || !signIn) {
      showDialog({
        type: 'error',
        title: 'Serviço não disponível',
        message: 'Sistema de autenticação não está pronto',
      });
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      await signIn.create({
        identifier: email,
        strategy: 'reset_password_email_code',
      });

      showDialog({
        type: 'success',
        title: 'Email Enviado',
        message:
          'Um email com instruções para redefinir sua senha foi enviado para o seu endereço de email.',
      });

      console.log('Email de redefinição enviado com sucesso');
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

  const resetPassword = async (code: string, newPassword: string) => {
    if (!isLoaded || !signIn) {
      showDialog({
        type: 'error',
        title: 'Serviço não disponível',
        message: 'Sistema de autenticação não está pronto',
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });

      if (result.status === 'complete') {
        console.log('Senha redefinida com sucesso');

        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });

          router.replace('/(root)');
        }
      } else {
        throw new Error('Não foi possível redefinir a senha');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao redefinir senha';
      setError(errorMessage);
      showDialog({
        type: 'error',
        title: 'Erro',
        message: errorMessage,
      });
      throw error;
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
