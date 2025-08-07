import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useMemo } from 'react';

import apiClient from '../lib/axios';

export interface ShiftTemplate {
  id: string;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  value: number;
  paymentType: 'PF' | 'PJ';
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface CreateShiftTemplateData {
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  value: number;
  paymentType: 'PF' | 'PJ';
  notes?: string;
  isActive?: boolean;
  locationId?: string;
  contractorId?: string;
}

export interface UpdateShiftTemplateData {
  name?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  value?: number;
  paymentType?: 'PF' | 'PJ';
  notes?: string;
  isActive?: boolean;
  locationId?: string;
  contractorId?: string;
}

export interface ShiftTemplateFilters {
  searchTerm?: string;
  locationId?: string;
  contractorId?: string;
  isActive?: boolean;
}

export interface CreateShiftFromTemplateData {
  date: string;
}

export const useShiftTemplatesApi = () => {
  const { getToken } = useAuth();

  const getShiftTemplates = useCallback(
    async (filters?: ShiftTemplateFilters): Promise<ShiftTemplate[]> => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Token de autenticação não disponível');
        }

        let queryParams = '';
        if (filters) {
          const params = new URLSearchParams();
          if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
          if (filters.locationId) params.append('locationId', filters.locationId);
          if (filters.contractorId) params.append('contractorId', filters.contractorId);
          if (filters.isActive !== undefined)
            params.append('isActive', filters.isActive.toString());

          queryParams = `?${params.toString()}`;
        }

        console.log('🔍 Buscando templates de plantão com filtros:', filters);

        const response = await apiClient.get(`/shift-templates${queryParams}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(`✅ ${response.data.length} templates retornados`);
        return response.data;
      } catch (error: any) {
        console.error('❌ Erro ao buscar templates de plantão:', error);
        throw new Error(
          error.response?.data?.message || error.message || 'Erro ao buscar templates de plantão'
        );
      }
    },
    [getToken]
  );

  const getShiftTemplateById = useCallback(
    async (id: string): Promise<ShiftTemplate> => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Token de autenticação não disponível');
        }

        if (!id || typeof id !== 'string') {
          throw new Error('ID do template é obrigatório');
        }

        console.log('🔍 Buscando template por ID:', id);

        const response = await apiClient.get(`/shift-templates/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('✅ Template encontrado:', response.data.id);
        return response.data;
      } catch (error: any) {
        console.error(`❌ Erro ao buscar template ${id}:`, error);
        throw new Error(
          error.response?.data?.message || error.message || 'Erro ao buscar template'
        );
      }
    },
    [getToken]
  );

  const createShiftTemplate = useCallback(
    async (data: CreateShiftTemplateData): Promise<ShiftTemplate> => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Token de autenticação não disponível');
        }

        console.log('📝 Criando template de plantão:', {
          name: data.name,
          startTime: data.startTime,
          endTime: data.endTime,
          value: data.value,
        });

        const response = await apiClient.post('/shift-templates', data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('✅ Template criado com sucesso:', response.data.id);
        return response.data;
      } catch (error: any) {
        console.error('❌ Erro ao criar template:', error);
        throw new Error(error.response?.data?.message || error.message || 'Erro ao criar template');
      }
    },
    [getToken]
  );

  const updateShiftTemplate = useCallback(
    async (id: string, data: UpdateShiftTemplateData): Promise<ShiftTemplate> => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Token de autenticação não disponível');
        }

        if (!id || typeof id !== 'string') {
          throw new Error('ID do template é obrigatório');
        }

        console.log('📝 Atualizando template:', id, Object.keys(data));

        const response = await apiClient.put(`/shift-templates/${id}`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('✅ Template atualizado com sucesso:', id);
        return response.data;
      } catch (error: any) {
        console.error(`❌ Erro ao atualizar template ${id}:`, error);
        throw new Error(
          error.response?.data?.message || error.message || 'Erro ao atualizar template'
        );
      }
    },
    [getToken]
  );

  const deleteShiftTemplate = useCallback(
    async (id: string): Promise<ShiftTemplate> => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Token de autenticação não disponível');
        }

        if (!id || typeof id !== 'string') {
          throw new Error('ID do template é obrigatório');
        }

        console.log('🗑️ Desativando template:', id);

        const response = await apiClient.delete(`/shift-templates/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('✅ Template desativado com sucesso:', id);
        return response.data;
      } catch (error: any) {
        console.error(`❌ Erro ao desativar template ${id}:`, error);
        throw new Error(
          error.response?.data?.message || error.message || 'Erro ao desativar template'
        );
      }
    },
    [getToken]
  );

  const createShiftFromTemplate = useCallback(
    async (templateId: string, data: CreateShiftFromTemplateData): Promise<any> => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Token de autenticação não disponível');
        }

        if (!templateId || typeof templateId !== 'string') {
          throw new Error('ID do template é obrigatório');
        }

        console.log(
          '📅 Criando plantão a partir do template:',
          templateId,
          'para data:',
          data.date
        );

        const response = await apiClient.post(`/shift-templates/${templateId}/create-shift`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('✅ Plantão criado a partir do template:', response.data.id);
        return response.data;
      } catch (error: any) {
        console.error(`❌ Erro ao criar plantão do template ${templateId}:`, error);
        throw new Error(
          error.response?.data?.message || error.message || 'Erro ao criar plantão do template'
        );
      }
    },
    [getToken]
  );

  return useMemo(
    () => ({
      getShiftTemplates,
      getShiftTemplateById,
      createShiftTemplate,
      updateShiftTemplate,
      deleteShiftTemplate,
      createShiftFromTemplate,
    }),
    [
      getShiftTemplates,
      getShiftTemplateById,
      createShiftTemplate,
      updateShiftTemplate,
      deleteShiftTemplate,
      createShiftFromTemplate,
    ]
  );
};

const shiftTemplatesApi = {
  useShiftTemplatesApi,
};

export default shiftTemplatesApi;
