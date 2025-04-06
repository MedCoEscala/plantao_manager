import { useState } from 'react';
import { router } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { useDialog } from '../../app/contexts/DialogContext';
import userRepository from '@/app/repositories/userRepository';

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

      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      if (signUp.createdUserId) {
        await userRepository.createUser(
          {
            name,
            email,
            phoneNumber,
            birthDate,
          },
          signUp.createdUserId
        );
      }

      router.push({
        pathname: '/(auth)/verify-code',
        params: {
          email,
          phoneNumber: phoneNumber || '',
          birthDate: birthDate || '',
        },
      });
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
};

export { useRegister };
export default useRegister;
