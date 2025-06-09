import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

import { useContractorsApi, Contractor } from '@/services/contractors-api';

interface ContractorOption {
  value: string;
  label: string;
  icon: string;
}

interface ContractorsContextType {
  contractors: Contractor[];
  contractorOptions: ContractorOption[];
  isLoading: boolean;
  error: string | null;
  refreshContractors: () => Promise<void>;
  loadContractors: () => Promise<void>; // Alias para compatibilidade
  getContractorById: (id: string) => Contractor | undefined;
}

const ContractorsContext = createContext<ContractorsContextType | undefined>(undefined);

export function ContractorsProvider({ children }: { children: React.ReactNode }) {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorOptions, setContractorOptions] = useState<ContractorOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);
  const contractorsApi = useContractorsApi();

  const loadContractors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await contractorsApi.getContractors();

      setContractors(data);

      // Transformar em opções para select
      const options = data.map((contractor) => ({
        value: contractor.id,
        label: contractor.name,
        icon: 'briefcase-outline',
      }));
      setContractorOptions(options);
    } catch (err: any) {
      console.error('Erro ao carregar contratantes:', err);
      setError(err.message || 'Erro ao carregar contratantes');
    } finally {
      setIsLoading(false);
    }
  }, [contractorsApi]);

  const refreshContractors = useCallback(async () => {
    await loadContractors();
  }, [loadContractors]);

  const getContractorById = useCallback(
    (id: string): Contractor | undefined => {
      return contractors.find((contractor) => contractor.id === id);
    },
    [contractors]
  );

  // Carregar dados apenas uma vez na inicialização
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      loadContractors();
    }
  }, [loadContractors]);

  const value: ContractorsContextType = {
    contractors,
    contractorOptions,
    isLoading,
    error,
    refreshContractors,
    loadContractors: refreshContractors, // Alias para compatibilidade
    getContractorById,
  };

  return <ContractorsContext.Provider value={value}>{children}</ContractorsContext.Provider>;
}

export function useContractors(): ContractorsContextType {
  const context = useContext(ContractorsContext);
  if (context === undefined) {
    throw new Error('useContractors deve ser usado dentro de ContractorsProvider');
  }
  return context;
}
