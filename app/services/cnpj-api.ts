import apiClient from '@/lib/axios';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback } from 'react';

export interface CNPJData {
  id: string;
  companyName?: string;
  cnpjNumber?: string;
  accountingFirmName?: string;
  monthlyFee?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCNPJData {
  companyName?: string;
  cnpjNumber?: string;
  accountingFirmName?: string;
  monthlyFee?: number;
}

export interface UpdateCNPJData {
  companyName?: string;
  cnpjNumber?: string;
  accountingFirmName?: string;
  monthlyFee?: number;
}

export const useCNPJApi = () => {
  const { getToken } = useAuth();

  const getCNPJData = useCallback(async (): Promise<CNPJData | null> => {
    try {
      const token = await getToken();

      const response = await apiClient.get('/cnpj', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Não encontrou dados, retorna null
        return null;
      }
      console.error('Erro ao buscar dados CNPJ:', error);
      throw error;
    }
  }, [getToken]);

  const createCNPJData = useCallback(
    async (data: CreateCNPJData): Promise<CNPJData> => {
      try {
        const token = await getToken();

        const response = await apiClient.post('/cnpj', data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        return response.data;
      } catch (error) {
        console.error('Erro ao criar dados CNPJ:', error);
        throw error;
      }
    },
    [getToken]
  );

  const updateCNPJData = useCallback(
    async (data: UpdateCNPJData): Promise<CNPJData> => {
      try {
        const token = await getToken();

        const response = await apiClient.put('/cnpj', data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        return response.data;
      } catch (error) {
        console.error('Erro ao atualizar dados CNPJ:', error);
        throw error;
      }
    },
    [getToken]
  );

  const deleteCNPJData = useCallback(async (): Promise<CNPJData> => {
    try {
      const token = await getToken();

      const response = await apiClient.delete('/cnpj', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao excluir dados CNPJ:', error);
      throw error;
    }
  }, [getToken]);

  return {
    getCNPJData,
    createCNPJData,
    updateCNPJData,
    deleteCNPJData,
  };
};

const cnpjApi = {
  useCNPJApi,
};

export default cnpjApi;
