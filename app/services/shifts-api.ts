import { useAuth } from '@clerk/clerk-expo';
import { useCallback } from 'react';

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
  notes?: string;
  locationId?: string;
  contractorId?: string;
}

export interface CreateShiftsBatchData {
  shifts: CreateShiftData[];
  skipConflicts?: boolean;
  continueOnError?: boolean;
}

export interface BatchCreateResult {
  created: Shift[];
  skipped: CreateShiftData[];
  failed: { shift: CreateShiftData; error: string }[];
  summary: {
    total: number;
    created: number;
    skipped: number;
    failed: number;
  };
}

export interface UpdateShiftData {
  date?: string;
  startTime?: string;
  endTime?: string;
  value?: number;
  paymentType?: string;
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

  const getShifts = useCallback(
    async (filters?: ShiftFilters): Promise<Shift[]> => {
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
    },
    [getToken]
  );

  const getShiftById = useCallback(
    async (id: string): Promise<Shift> => {
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
    },
    [getToken]
  );

  const createShift = useCallback(
    async (data: CreateShiftData): Promise<Shift> => {
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
    },
    [getToken]
  );

  const createShiftsBatch = useCallback(
    async (data: CreateShiftsBatchData): Promise<BatchCreateResult> => {
      try {
        const token = await getToken();

        const response = await apiClient.post('/shifts/batch', data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        return response.data;
      } catch (error) {
        console.error('Erro ao criar plantões em lote:', error);
        throw error;
      }
    },
    [getToken]
  );

  const updateShift = useCallback(
    async (id: string, data: UpdateShiftData): Promise<Shift> => {
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
    },
    [getToken]
  );

  const deleteShift = useCallback(
    async (id: string): Promise<Shift> => {
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
    },
    [getToken]
  );

  return {
    getShifts,
    getShiftById,
    createShift,
    createShiftsBatch,
    updateShift,
    deleteShift,
  };
};

// Default export para resolver warning do React Router
const shiftsApi = {
  useShiftsApi,
};

export default shiftsApi;
