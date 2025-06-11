import { useAuth } from '@clerk/clerk-expo';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

import { useToast } from '@/components/ui/Toast';
import { useProfile } from '@/hooks/useProfile';
import { fetchWithAuth } from '@/utils/api-client';

export interface Contractor {
  id: string;
  name: string;
  email: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ContractorsContextType {
  contractors: Contractor[];
  isLoading: boolean;
  error: string | null;
  refreshContractors: () => Promise<void>;
  addContractor: (contractor: Omit<Contractor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContractor: (id: string, contractor: Partial<Contractor>) => Promise<void>;
  deleteContractor: (id: string) => Promise<void>;
}

const ContractorsContext = createContext<ContractorsContextType | undefined>(undefined);

export function ContractorsProvider({ children }: { children: React.ReactNode }) {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getToken, isLoaded: isAuthLoaded, userId } = useAuth();
  const { showToast } = useToast();
  const { isInitialized: isProfileInitialized } = useProfile();

  const fetchContractors = useCallback(async (): Promise<void> => {
    // Só busca se o profile estiver inicializado
    if (!isAuthLoaded || !userId || !isProfileInitialized) {
      console.log('🔐 [Contractors] Aguardando inicialização do profile...');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔐 [Contractors] Obtendo token de autenticação...');
      const token = await getToken();
      if (!token) {
        console.error('❌ [Contractors] Token não obtido - usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      setIsLoading(true);
      setError(null);

      console.log('🚀 [Contractors] Buscando contratantes...');
      const data = await fetchWithAuth<Contractor[]>(
        '/contractors',
        { method: 'GET' },
        async () => token
      );

      console.log('✅ [Contractors] Contratantes carregados:', data?.length || 0);
      setContractors(data || []);
    } catch (error: any) {
      console.error('❌ [Contractors] Erro ao buscar contratantes:', error);
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Erro ao carregar contratantes';
      setError(errorMessage);

      // Não mostrar toast se for erro de autenticação (ainda inicializando)
      if (!error?.message?.includes('não autenticado')) {
        showToast('Erro ao carregar contratantes', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthLoaded, userId, isProfileInitialized, getToken, showToast]);

  const addContractor = useCallback(
    async (contractorData: Omit<Contractor, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
      if (!getToken) return;

      try {
        const token = await getToken();
        if (!token) throw new Error('Token não disponível');

        const newContractor = await fetchWithAuth<Contractor>(
          '/contractors',
          {
            method: 'POST',
            body: JSON.stringify(contractorData),
          },
          async () => token
        );

        setContractors((prev) => [...prev, newContractor]);
        showToast('Contratante adicionado com sucesso', 'success');
      } catch (error: any) {
        console.error('Erro ao adicionar contratante:', error);
        const errorMessage = error?.response?.data?.message || 'Erro ao adicionar contratante';
        showToast(errorMessage, 'error');
        throw error;
      }
    },
    [getToken, showToast]
  );

  const updateContractor = useCallback(
    async (id: string, contractorData: Partial<Contractor>): Promise<void> => {
      if (!getToken) return;

      try {
        const token = await getToken();
        if (!token) throw new Error('Token não disponível');

        const updatedContractor = await fetchWithAuth<Contractor>(
          `/contractors/${id}`,
          {
            method: 'PUT',
            body: JSON.stringify(contractorData),
          },
          async () => token
        );

        setContractors((prev) => prev.map((c) => (c.id === id ? updatedContractor : c)));
        showToast('Contratante atualizado com sucesso', 'success');
      } catch (error: any) {
        console.error('Erro ao atualizar contratante:', error);
        const errorMessage = error?.response?.data?.message || 'Erro ao atualizar contratante';
        showToast(errorMessage, 'error');
        throw error;
      }
    },
    [getToken, showToast]
  );

  const deleteContractor = useCallback(
    async (id: string): Promise<void> => {
      if (!getToken) return;

      try {
        const token = await getToken();
        if (!token) throw new Error('Token não disponível');

        await fetchWithAuth(`/contractors/${id}`, { method: 'DELETE' }, async () => token);

        setContractors((prev) => prev.filter((c) => c.id !== id));
        showToast('Contratante removido com sucesso', 'success');
      } catch (error: any) {
        console.error('Erro ao remover contratante:', error);
        const errorMessage = error?.response?.data?.message || 'Erro ao remover contratante';
        showToast(errorMessage, 'error');
        throw error;
      }
    },
    [getToken, showToast]
  );

  // Carrega contratantes quando o profile estiver inicializado
  useEffect(() => {
    if (isProfileInitialized) {
      console.log('👥 [Contractors] Profile inicializado, carregando contratantes...');
      fetchContractors();
    }
  }, [isProfileInitialized, fetchContractors]);

  // Reset quando usuário desloga
  useEffect(() => {
    if (isAuthLoaded && !userId) {
      console.log('🔄 [Contractors] Usuário deslogado, resetando contexto...');
      setContractors([]);
      setError(null);
      setIsLoading(false);
    }
  }, [isAuthLoaded, userId]);

  const value: ContractorsContextType = {
    contractors,
    isLoading,
    error,
    refreshContractors: fetchContractors,
    addContractor,
    updateContractor,
    deleteContractor,
  };

  return <ContractorsContext.Provider value={value}>{children}</ContractorsContext.Provider>;
}

export function useContractorsContext(): ContractorsContextType {
  const context = useContext(ContractorsContext);
  if (context === undefined) {
    throw new Error('useContractorsContext deve ser usado dentro de ContractorsProvider');
  }
  return context;
}

// Default export para resolver warning do React Router
const contractorsContext = {
  ContractorsProvider,
  useContractorsContext,
};

export default contractorsContext;
