import { useAuth } from '@clerk/clerk-expo';
import { useCallback } from 'react';

import apiClient from '../lib/axios';

export interface DeleteAccountData {
  password: string; // Usado apenas para validação no frontend
}

export const useUserApi = () => {
  const { getToken } = useAuth();

  /**
   * Deleta completamente a conta do usuário
   * Remove todos os dados do banco e a conta do Clerk
   */
  const deleteAccount = useCallback(
    async (data: DeleteAccountData): Promise<void> => {
      try {
        const token = await getToken();

        if (!token) {
          throw new Error('Usuário não autenticado');
        }

        await apiClient.delete('/users/me/account', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            password: data.password,
          },
        });
      } catch (error: any) {
        console.error('Erro ao deletar conta:', error);

        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }

        throw new Error('Erro ao deletar conta. Tente novamente mais tarde.');
      }
    },
    [getToken]
  );

  return {
    deleteAccount,
  };
};
