import { useState } from 'react';
import { router } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { useDialog } from '../../app/contexts/DialogContext';
import { authenticatedFetch } from '../../app/utils/api-client';
import NetInfo from '@react-native-community/netinfo';

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

const useRegister = (): UseRegisterResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp, isLoaded } = useSignUp();
  const { showDialog } = useDialog();

  const register = async (
    name: string,
    email: string,
    password: string,
    phoneNumber?: string,
    birthDate?: string
  ) => {
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

      // Dividir nome em primeiro nome e sobrenome para o Clerk
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      // Criar usuário no Clerk
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
        ...(phoneNumber ? { phoneNumber } : {}),
      });

      // Preparar verificação por email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // Se tiver um ID de usuário criado, salvar os dados adicionais na nossa API
      if (signUp.createdUserId) {
        try {
          // Tentar até 3 vezes em caso de falha
          let attempts = 0;
          let success = false;

          while (attempts < 3 && !success) {
            try {
              await authenticatedFetch('user', {
                method: 'POST',
                body: JSON.stringify({
                  id: signUp.createdUserId,
                  name,
                  email,
                  phoneNumber: phoneNumber || null,
                  birthDate: birthDate || null,
                }),
              });
              success = true;
              console.log('Usuário criado na API:', signUp.createdUserId);
            } catch (apiError) {
              attempts++;
              console.error(`Tentativa ${attempts} falhou ao salvar usuário na API:`, apiError);

              // Esperar antes de tentar novamente
              if (attempts < 3) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
            }
          }

          if (!success) {
            console.error('Falha após 3 tentativas de salvar usuário na API');
            // Não interrompemos o fluxo, apenas logamos o erro
          }
        } catch (apiError) {
          console.error('Erro ao salvar usuário na API:', apiError);
        }
      }

      // Redirecionar para verificação de código
      router.push({
        pathname: '/(auth)/verify-code',
        params: {
          email,
          phoneNumber: phoneNumber || '',
          birthDate: birthDate || '',
        },
      });
    } catch (error) {
      let errorMessage = 'Erro desconhecido ao registrar';

      if (error instanceof Error) {
        errorMessage = error.message;

        // Tratamento para erros comuns de registro
        if (errorMessage.includes('email') && errorMessage.includes('already')) {
          errorMessage = 'Este email já está sendo usado. Tente fazer login ou use outro email.';
        } else if (errorMessage.includes('password')) {
          errorMessage =
            'A senha não atende aos requisitos de segurança. Use pelo menos 8 caracteres, incluindo letras e números.';
        } else if (errorMessage.includes('network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        }
      }

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
};

export { useRegister };
export default useRegister;
