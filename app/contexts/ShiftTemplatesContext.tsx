import { useAuth } from '@clerk/clerk-expo';
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

import { useToast } from '../components/ui/Toast';
import { useProfile } from '../hooks/useProfile';
import {
  useShiftTemplatesApi,
  ShiftTemplate,
  CreateShiftTemplateData,
  UpdateShiftTemplateData,
  ShiftTemplateFilters,
  CreateShiftFromTemplateData,
} from '../services/shift-templates-api';

interface ShiftTemplatesContextType {
  templates: ShiftTemplate[];
  templateOptions: { label: string; value: string; description?: string }[];
  isLoading: boolean;
  error: string | null;
  refreshTemplates: () => Promise<void>;
  createTemplate: (data: CreateShiftTemplateData) => Promise<ShiftTemplate>;
  updateTemplate: (id: string, data: UpdateShiftTemplateData) => Promise<ShiftTemplate>;
  deleteTemplate: (id: string) => Promise<ShiftTemplate>;
  createShiftFromTemplate: (templateId: string, data: CreateShiftFromTemplateData) => Promise<any>;
  getTemplateById: (id: string) => Promise<ShiftTemplate>;
}

const ShiftTemplatesContext = createContext<ShiftTemplatesContextType | undefined>(undefined);

export function ShiftTemplatesProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getToken, isLoaded: isAuthLoaded, userId } = useAuth();
  const { showToast } = useToast();
  const { isInitialized: isProfileInitialized } = useProfile();
  const shiftTemplatesApi = useShiftTemplatesApi();

  const hasInitialized = useRef(false);

  const fetchTemplates = useCallback(
    async (showLoadingState = true): Promise<void> => {
      if (!isAuthLoaded || !userId || !isProfileInitialized) {
        setIsLoading(false);
        return;
      }

      try {
        if (showLoadingState) {
          setIsLoading(true);
        }
        setError(null);

        const data = await shiftTemplatesApi.getShiftTemplates();

        const sortedTemplates = data.sort((a, b) => a.name.localeCompare(b.name));
        setTemplates(sortedTemplates);
      } catch (error: any) {
        console.error('Erro ao buscar templates de plantão:', error);
        setError('Erro ao carregar templates');
        showToast('Erro ao carregar templates', 'error');
      } finally {
        if (showLoadingState) {
          setIsLoading(false);
        }
      }
    },
    [isAuthLoaded, userId, isProfileInitialized, shiftTemplatesApi, showToast]
  );

  const createTemplate = useCallback(
    async (data: CreateShiftTemplateData): Promise<ShiftTemplate> => {
      try {
        const newTemplate = await shiftTemplatesApi.createShiftTemplate(data);

        setTemplates((prev) => {
          const updated = [...prev, newTemplate];
          return updated.sort((a, b) => a.name.localeCompare(b.name));
        });

        showToast('Template criado com sucesso', 'success');

        setTimeout(() => {
          fetchTemplates(false);
        }, 500);

        return newTemplate;
      } catch (error: any) {
        console.error('Erro ao criar template:', error);
        const errorMessage =
          error?.response?.data?.message || error?.message || 'Erro ao criar template';
        showToast(errorMessage, 'error');
        throw error;
      }
    },
    [shiftTemplatesApi, showToast, fetchTemplates]
  );

  const updateTemplate = useCallback(
    async (id: string, data: UpdateShiftTemplateData): Promise<ShiftTemplate> => {
      try {
        const updatedTemplate = await shiftTemplatesApi.updateShiftTemplate(id, data);

        setTemplates((prev) => {
          const updated = prev.map((t) => (t.id === id ? updatedTemplate : t));
          return updated.sort((a, b) => a.name.localeCompare(b.name));
        });

        showToast('Template atualizado com sucesso', 'success');

        setTimeout(() => {
          fetchTemplates(false);
        }, 500);

        return updatedTemplate;
      } catch (error: any) {
        console.error('Erro ao atualizar template:', error);
        const errorMessage =
          error?.response?.data?.message || error?.message || 'Erro ao atualizar template';
        showToast(errorMessage, 'error');
        throw error;
      }
    },
    [shiftTemplatesApi, showToast, fetchTemplates]
  );

  const deleteTemplate = useCallback(
    async (id: string): Promise<ShiftTemplate> => {
      try {
        const deletedTemplate = await shiftTemplatesApi.deleteShiftTemplate(id);

        setTemplates((prev) => prev.filter((t) => t.id !== id));

        showToast('Template desativado com sucesso', 'success');

        setTimeout(() => {
          fetchTemplates(false);
        }, 500);

        return deletedTemplate;
      } catch (error: any) {
        console.error('Erro ao desativar template:', error);
        const errorMessage =
          error?.response?.data?.message || error?.message || 'Erro ao desativar template';
        showToast(errorMessage, 'error');
        throw error;
      }
    },
    [shiftTemplatesApi, showToast, fetchTemplates]
  );

  const createShiftFromTemplate = useCallback(
    async (templateId: string, data: CreateShiftFromTemplateData): Promise<any> => {
      try {
        const createdShift = await shiftTemplatesApi.createShiftFromTemplate(templateId, data);
        showToast('Plantão criado a partir do template!', 'success');
        return createdShift;
      } catch (error: any) {
        console.error('Erro ao criar plantão do template:', error);
        const errorMessage =
          error?.response?.data?.message || error?.message || 'Erro ao criar plantão do template';
        showToast(errorMessage, 'error');
        throw error;
      }
    },
    [shiftTemplatesApi, showToast]
  );

  const getTemplateById = useCallback(
    async (id: string): Promise<ShiftTemplate> => {
      return shiftTemplatesApi.getShiftTemplateById(id);
    },
    [shiftTemplatesApi]
  );

  useEffect(() => {
    if (isProfileInitialized && !hasInitialized.current) {
      hasInitialized.current = true;
      fetchTemplates();
    }
  }, [isProfileInitialized, fetchTemplates]);

  useEffect(() => {
    if (isAuthLoaded && !userId) {
      setTemplates([]);
      setError(null);
      setIsLoading(false);
      hasInitialized.current = false;
    }
  }, [isAuthLoaded, userId]);

  const templateOptions = React.useMemo(
    () =>
      templates
        .filter((template) => template.isActive)
        .map((template) => ({
          label: template.name,
          value: template.id,
          description: template.description,
        })),
    [templates]
  );

  const value: ShiftTemplatesContextType = {
    templates,
    templateOptions,
    isLoading,
    error,
    refreshTemplates: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createShiftFromTemplate,
    getTemplateById,
  };

  return <ShiftTemplatesContext.Provider value={value}>{children}</ShiftTemplatesContext.Provider>;
}

export function useShiftTemplatesContext(): ShiftTemplatesContextType {
  const context = useContext(ShiftTemplatesContext);
  if (context === undefined) {
    throw new Error('useShiftTemplatesContext deve ser usado dentro de ShiftTemplatesProvider');
  }
  return context;
}

export function useShiftTemplates(): ShiftTemplatesContextType & {
  loadTemplates: () => Promise<void>;
} {
  const context = useShiftTemplatesContext();
  return {
    ...context,
    loadTemplates: context.refreshTemplates,
  };
}

const shiftTemplatesContext = {
  ShiftTemplatesProvider,
  useShiftTemplatesContext,
};

export default shiftTemplatesContext;
