import { useAuth } from '@clerk/clerk-expo';

import apiClient from '@/lib/axios';

export interface Contractor {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface CreateContractorData {
  name: string;
  email?: string;
  phone?: string;
}

export interface UpdateContractorData {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ContractorsFilters {
  searchTerm?: string;
}

export const useContractorsApi = () => {
  const { getToken } = useAuth();

  const getContractors = async (filters?: ContractorsFilters): Promise<Contractor[]> => {
    try {
      const token = await getToken();

      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      let queryParams = '';

      if (filters?.searchTerm) {
        queryParams = `?searchTerm=${encodeURIComponent(filters.searchTerm)}`;
      }

      const response = await apiClient.get(`/contractors${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('❌ [Contractors] Erro ao buscar contratantes:', error);
      throw error;
    }
  };

  const getContractorById = async (id: string): Promise<Contractor> => {
    try {
      const token = await getToken();

      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await apiClient.get(`contractors/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.log(`Erro ao buscar contratante ${id}`, error);
      throw error;
    }
  };

  const createContractor = async (data: CreateContractorData): Promise<Contractor> => {
    try {
      const token = await getToken();

      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await apiClient.post('/contractors', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.log('Erro ao criar contratante', error);
      throw error;
    }
  };

  const updateContractor = async (id: string, data: UpdateContractorData): Promise<Contractor> => {
    try {
      const token = await getToken();

      const response = await apiClient.put(`/contractors/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar contratante ${id}:`, error);
      throw error;
    }
  };

  const deleteContractor = async (id: string): Promise<Contractor> => {
    try {
      const token = await getToken();

      const response = await apiClient.delete(`/contractors/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Erro ao excluir contratante ${id}:`, error);
      throw error;
    }
  };

  return {
    getContractors,
    getContractorById,
    createContractor,
    updateContractor,
    deleteContractor,
  };
};

// Default export para resolver warning do React Router
const contractorsApi = {
  useContractorsApi,
};

export default contractorsApi;
