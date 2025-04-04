import { useState } from 'react';
import { router } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { useDialog } from '../../app/contexts/DialogContext';

export interface UseLoginResult {
  login: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const useLogin = (): UseLoginResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, setActive, isLoaded } = useSignIn();
  const { showDialog } = useDialog();

  const login = async (email: string, password: string) => {
    if (!isLoaded) {
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

      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(root)');
      } else {
        setError('Falha na autenticação. Verifique suas credenciais');
        showDialog({
          type: 'error',
          title: 'Falha no Login',
          message: 'Não foi possível fazer login. Por favor, verifique suas credenciais.',
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
};

export { useLogin };
export default useLogin;
