import { useState } from 'react';
import { router } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { useDialog } from '../../app/contexts/DialogContext';
import NetInfo from '@react-native-community/netinfo';

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

      // Verificar conexão com a internet
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error(
          'Sem conexão com a internet. Por favor, verifique sua conexão e tente novamente.'
        );
      }

      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(root)');
      } else if (signInAttempt.status === 'needs_first_factor') {
        // Necessário segundo fator (2FA), nesse caso você pode redirecionar para a tela de 2FA
        router.replace('/(auth)/verify-code');
      } else if (signInAttempt.status === 'needs_new_password') {
        // Necessário resetar a senha
        router.replace('/(auth)/reset-password');
      } else {
        const errorMessage = 'Falha na autenticação. Verifique suas credenciais';
        setError(errorMessage);
        showDialog({
          type: 'error',
          title: 'Falha no Login',
          message: 'Não foi possível fazer login. Por favor, verifique suas credenciais.',
        });
      }
    } catch (error) {
      let errorMessage = 'Erro desconhecido ao fazer login';

      if (error instanceof Error) {
        errorMessage = error.message;

        // Tratamento específico para erros comuns do Clerk
        if (errorMessage.includes('Invalid password')) {
          errorMessage = 'Senha inválida. Verifique suas credenciais.';
        } else if (errorMessage.includes('Identifier not found')) {
          errorMessage = 'Email não encontrado. Verifique suas credenciais ou crie uma conta.';
        } else if (errorMessage.includes('network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        }
      }

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
