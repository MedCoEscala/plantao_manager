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

const validateShiftData = (shift: CreateShiftData): string[] => {
  const errors: string[] = [];

  if (!shift.date) {
    errors.push('Data é obrigatória');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(shift.date)) {
    errors.push('Formato de data inválido. Use YYYY-MM-DD');
  }

  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  if (!shift.startTime) {
    errors.push('Horário de início é obrigatório');
  } else if (!timeRegex.test(shift.startTime)) {
    errors.push('Formato de horário de início inválido. Use HH:MM');
  }

  if (!shift.endTime) {
    errors.push('Horário de término é obrigatório');
  } else if (!timeRegex.test(shift.endTime)) {
    errors.push('Formato de horário de término inválido. Use HH:MM');
  }

  if (typeof shift.value !== 'number' || shift.value <= 0) {
    errors.push('Valor deve ser um número maior que zero');
  }

  if (!shift.paymentType || !['PF', 'PJ'].includes(shift.paymentType)) {
    errors.push('Tipo de pagamento deve ser PF ou PJ');
  }

  return errors;
};

const validateBatchData = (batchData: CreateShiftsBatchData): string[] => {
  const errors: string[] = [];

  if (!Array.isArray(batchData.shifts) || batchData.shifts.length === 0) {
    errors.push('É necessário fornecer pelo menos um plantão');
    return errors;
  }

  if (batchData.shifts.length > 100) {
    errors.push('Máximo de 100 plantões por lote');
  }

  batchData.shifts.forEach((shift, index) => {
    const shiftErrors = validateShiftData(shift);
    shiftErrors.forEach((error) => {
      errors.push(`Plantão ${index + 1}: ${error}`);
    });
  });

  return errors;
};

export const useShiftsApi = () => {
  const { getToken } = useAuth();

  const getShifts = useCallback(
    async (filters?: ShiftFilters): Promise<Shift[]> => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Token de autenticação não disponível');
        }

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

        console.log('🔍 Buscando plantões com filtros:', filters);

        const response = await apiClient.get(`/shifts${queryParams}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(`✅ ${response.data.length} plantões retornados`);
        return response.data;
      } catch (error: any) {
        console.error('❌ Erro ao buscar plantões:', error);
        throw new Error(
          error.response?.data?.message || error.message || 'Erro ao buscar plantões'
        );
      }
    },
    [getToken]
  );

  const getShiftById = useCallback(
    async (id: string): Promise<Shift> => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Token de autenticação não disponível');
        }

        if (!id || typeof id !== 'string') {
          throw new Error('ID do plantão é obrigatório');
        }

        console.log('🔍 Buscando plantão por ID:', id);

        const response = await apiClient.get(`/shifts/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('✅ Plantão encontrado:', response.data.id);
        return response.data;
      } catch (error: any) {
        console.error(`❌ Erro ao buscar plantão ${id}:`, error);
        throw new Error(error.response?.data?.message || error.message || 'Erro ao buscar plantão');
      }
    },
    [getToken]
  );

  const createShift = useCallback(
    async (data: CreateShiftData): Promise<Shift> => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Token de autenticação não disponível');
        }

        const validationErrors = validateShiftData(data);
        if (validationErrors.length > 0) {
          throw new Error(`Dados inválidos: ${validationErrors.join(', ')}`);
        }

        console.log('📝 Criando plantão:', {
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          value: data.value,
        });

        const response = await apiClient.post('/shifts', data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('✅ Plantão criado com sucesso:', response.data.id);
        return response.data;
      } catch (error: any) {
        console.error('❌ Erro ao criar plantão:', error);
        throw new Error(error.response?.data?.message || error.message || 'Erro ao criar plantão');
      }
    },
    [getToken]
  );

  const createShiftsBatch = useCallback(
    async (data: CreateShiftsBatchData): Promise<BatchCreateResult> => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Token de autenticação não disponível');
        }

        const validationErrors = validateBatchData(data);
        if (validationErrors.length > 0) {
          const limitedErrors = validationErrors.slice(0, 5);
          const errorMessage = limitedErrors.join(', ');
          const hasMoreErrors = validationErrors.length > 5;

          throw new Error(
            `Dados inválidos: ${errorMessage}${hasMoreErrors ? ` (+${validationErrors.length - 5} outros erros)` : ''}`
          );
        }

        console.log('📦 Criando lote de plantões:', {
          total: data.shifts.length,
          skipConflicts: data.skipConflicts,
          continueOnError: data.continueOnError,
        });

        const response = await apiClient.post('/shifts/batch', data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result: BatchCreateResult = response.data;

        console.log('✅ Lote processado:', {
          created: result.summary.created,
          skipped: result.summary.skipped,
          failed: result.summary.failed,
        });

        if (!result.summary || typeof result.summary.total !== 'number') {
          console.warn('⚠️ Resposta do servidor com formato inesperado:', result);
        }

        return result;
      } catch (error: any) {
        console.error('❌ Erro ao criar lote de plantões:', error);
        throw new Error(
          error.response?.data?.message || error.message || 'Erro ao criar lote de plantões'
        );
      }
    },
    [getToken]
  );

  const updateShift = useCallback(
    async (id: string, data: UpdateShiftData): Promise<Shift> => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Token de autenticação não disponível');
        }

        if (!id || typeof id !== 'string') {
          throw new Error('ID do plantão é obrigatório');
        }

        if (data.startTime && !/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(data.startTime)) {
          throw new Error('Formato de horário de início inválido. Use HH:MM');
        }

        if (data.endTime && !/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(data.endTime)) {
          throw new Error('Formato de horário de término inválido. Use HH:MM');
        }

        if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
          throw new Error('Formato de data inválido. Use YYYY-MM-DD');
        }

        if (data.value !== undefined && (typeof data.value !== 'number' || data.value <= 0)) {
          throw new Error('Valor deve ser um número maior que zero');
        }

        if (data.paymentType && !['PF', 'PJ'].includes(data.paymentType)) {
          throw new Error('Tipo de pagamento deve ser PF ou PJ');
        }

        console.log('📝 Atualizando plantão:', id, Object.keys(data));

        const response = await apiClient.put(`/shifts/${id}`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('✅ Plantão atualizado com sucesso:', id);
        return response.data;
      } catch (error: any) {
        console.error(`❌ Erro ao atualizar plantão ${id}:`, error);
        throw new Error(
          error.response?.data?.message || error.message || 'Erro ao atualizar plantão'
        );
      }
    },
    [getToken]
  );

  const deleteShift = useCallback(
    async (id: string): Promise<Shift> => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Token de autenticação não disponível');
        }

        if (!id || typeof id !== 'string') {
          throw new Error('ID do plantão é obrigatório');
        }

        console.log('🗑️ Excluindo plantão:', id);

        const response = await apiClient.delete(`/shifts/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('✅ Plantão excluído com sucesso:', id);
        return response.data;
      } catch (error: any) {
        console.error(`❌ Erro ao excluir plantão ${id}:`, error);
        throw new Error(
          error.response?.data?.message || error.message || 'Erro ao excluir plantão'
        );
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

const shiftsApi = {
  useShiftsApi,
};

export default shiftsApi;
