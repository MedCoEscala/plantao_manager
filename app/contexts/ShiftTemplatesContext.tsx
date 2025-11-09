import { useAuth } from '@clerk/clerk-expo';
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

import { useProfile } from '../hooks/useProfile';
import {
  ShiftTemplate,
  CreateShiftTemplateData,
  UpdateShiftTemplateData,
  ShiftTemplateFilters,
  CreateShiftFromTemplateData,
  useShiftTemplatesApi,
} from '../services/shift-templates-api';

interface ShiftTemplatesContextType {
  templates: ShiftTemplate[];
  isLoading: boolean;
  error: string | null;

  // Operações CRUD
  createTemplate: (data: CreateShiftTemplateData) => Promise<ShiftTemplate>;
  updateTemplate: (id: string, data: UpdateShiftTemplateData) => Promise<ShiftTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  getTemplateById: (id: string) => Promise<ShiftTemplate>;

  // Operação especial para criar plantão a partir de template
  createShiftFromTemplate: (templateId: string, data: CreateShiftFromTemplateData) => Promise<any>;

  // Controles de estado
  refreshTemplates: () => Promise<void>;
  setFilters: (filters: ShiftTemplateFilters) => void;
  clearError: () => void;
}

const ShiftTemplatesContext = createContext<ShiftTemplatesContextType | undefined>(undefined);

export function ShiftTemplatesProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ShiftTemplateFilters>({ isActive: true });

  const { isLoaded: isAuthLoaded, userId } = useAuth();
  const { isInitialized: isProfileInitialized } = useProfile();
  const api = useShiftTemplatesApi();
  const hasInitialized = useRef(false);

  // Função para carregar templates
  const loadTemplates = useCallback(async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getShiftTemplates(filters);
      setTemplates(data);
    } catch (err: any) {
      console.error('❌ Erro ao carregar templates:', err);
      setError(err.message || 'Erro desconhecido ao carregar templates');
    } finally {
      setIsLoading(false);
    }
  }, [api, filters, isLoading]);

  useEffect(() => {
    if (isProfileInitialized && !hasInitialized.current) {
      hasInitialized.current = true;
      loadTemplates();
    }
  }, [isProfileInitialized, loadTemplates]);

  useEffect(() => {
    if (hasInitialized.current) {
      loadTemplates();
    }
  }, [filters]);

  useEffect(() => {
    if (isAuthLoaded && !userId) {
      setTemplates([]);
      setError(null);
      setIsLoading(false);
      hasInitialized.current = false;
    }
  }, [isAuthLoaded, userId]);

  const createTemplate = useCallback(
    async (data: CreateShiftTemplateData): Promise<ShiftTemplate> => {
      try {
        setError(null);
        const newTemplate = await api.createShiftTemplate(data);

        // Atualizar lista local
        setTemplates((prev) => [newTemplate, ...prev]);

        return newTemplate;
      } catch (err: any) {
        const errorMsg = err.message || 'Erro ao criar template';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [api]
  );

  const updateTemplate = useCallback(
    async (id: string, data: UpdateShiftTemplateData): Promise<ShiftTemplate> => {
      try {
        setError(null);
        const updatedTemplate = await api.updateShiftTemplate(id, data);

        // Atualizar lista local
        setTemplates((prev) =>
          prev.map((template) => (template.id === id ? updatedTemplate : template))
        );

        return updatedTemplate;
      } catch (err: any) {
        const errorMsg = err.message || 'Erro ao atualizar template';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [api]
  );

  const deleteTemplate = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        await api.deleteShiftTemplate(id);

        // Remover da lista local
        setTemplates((prev) => prev.filter((template) => template.id !== id));
      } catch (err: any) {
        const errorMsg = err.message || 'Erro ao deletar template';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [api]
  );

  const getTemplateById = useCallback(
    async (id: string): Promise<ShiftTemplate> => {
      try {
        setError(null);
        return await api.getShiftTemplateById(id);
      } catch (err: any) {
        const errorMsg = err.message || 'Erro ao buscar template';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [api]
  );

  const createShiftFromTemplate = useCallback(
    async (templateId: string, data: CreateShiftFromTemplateData): Promise<any> => {
      try {
        setError(null);
        return await api.createShiftFromTemplate(templateId, data);
      } catch (err: any) {
        const errorMsg = err.message || 'Erro ao criar plantão a partir do template';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [api]
  );

  const refreshTemplates = useCallback(async () => {
    await loadTemplates();
  }, [loadTemplates]);

  const setFiltersCallback = useCallback((newFilters: ShiftTemplateFilters) => {
    setFilters(newFilters);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: ShiftTemplatesContextType = {
    templates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplateById,
    createShiftFromTemplate,
    refreshTemplates,
    setFilters: setFiltersCallback,
    clearError,
  };

  return <ShiftTemplatesContext.Provider value={value}>{children}</ShiftTemplatesContext.Provider>;
}

export function useShiftTemplatesContext(): ShiftTemplatesContextType {
  const context = useContext(ShiftTemplatesContext);
  if (!context) {
    throw new Error('useShiftTemplatesContext deve ser usado dentro de ShiftTemplatesProvider');
  }
  return context;
}
