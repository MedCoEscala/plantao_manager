import { useAuth } from '@clerk/clerk-expo';
import apiClient from '../lib/axios';

export interface Shift {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  value: number;
  status?: string;
  notes?: string;
  paymentType: string;
  isFixed: boolean;
  locationId?: string;
  contractorId?: string;
  location?: {
    id: string;
    name: string;
    color: string;
  };
  contractor?: {
    id: string;
    name: string;
  };
}

export interface CreateShiftData {
  date: string;
  startTime: string;
  endTime: string;
  value: number;
  paymentType: string;
  isFixed?: boolean;
  notes?: string;
  locationId?: string;
  contractorId?: string;
}

export interface UpdateShiftData {
  date?: string;
  startTime?: string;
  endTime?: string;
  value?: number;
  paymentType?: string;
  isFixed?: boolean;
  notes?: string;
  status?: string;
  locationId?: string;
  contractorId?: string;
}

export interface ShiftFilters {
  startDate?: string;
  endDate?: string;
  locationId?: string;
  contractorId?: string;
  status?: string[];
  searchTerm?: string;
}

export const useShiftsApi = () => {
  const { getToken } = useAuth();

  const getShifts = async (filters?: ShiftFilters): Promise<Shift[]> => {
    try {
      const token = await getToken();

      let queryParams = '';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.locationId) params.append('locationId', filters.locationId);
        if (filters.contractorId) params.append('contractorId', filters.contractorId);
        if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
        if (filters.status && filters.status.length > 0) {
          filters.status.forEach((status) => params.append('status', status));
        }

        queryParams = `?${params.toString()}`;
      }

      const response = await apiClient.get(`/shifts${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar plantões:', error);
      throw error;
    }
  };

  const getShiftById = async (id: string): Promise<Shift> => {
    try {
      const token = await getToken();

      const response = await apiClient.get(`/shifts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar plantão ${id}:`, error);
      throw error;
    }
  };

  const createShift = async (data: CreateShiftData): Promise<Shift> => {
    try {
      const token = await getToken();

      const response = await apiClient.post('/shifts', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao criar plantão:', error);
      throw error;
    }
  };

  const updateShift = async (id: string, data: UpdateShiftData): Promise<Shift> => {
    try {
      const token = await getToken();

      const response = await apiClient.put(`/shifts/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar plantão ${id}:`, error);
      throw error;
    }
  };

  const deleteShift = async (id: string): Promise<Shift> => {
    try {
      const token = await getToken();

      const response = await apiClient.delete(`/shifts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Erro ao excluir plantão ${id}:`, error);
      throw error;
    }
  };

  return {
    getShifts,
    getShiftById,
    createShift,
    updateShift,
    deleteShift,
  };
};

// Default export para resolver warning do React Router
const shiftsApi = {
  useShiftsApi,
};

export default shiftsApi;
