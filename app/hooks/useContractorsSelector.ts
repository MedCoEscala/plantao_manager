import { useState, useEffect, useCallback, useRef } from 'react';
import { useContractorsApi, Contractor } from '@/services/contractors-api';
import { useToast } from '@/components/ui/Toast';

interface ContractorOption {
  value: string;
  label: string;
  icon?: string;
}

export function useContractorsSelector() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorOptions, setContractorOptions] = useState<ContractorOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const dataLoadedRef = useRef(false);

  const contractorsApi = useContractorsApi();
  const { showToast } = useToast();

  const loadContractors = useCallback(
    async (force = false) => {
      // Evitar múltiplas requisições simultâneas
      if (isLoadingRef.current && !force) return;

      // Não recarregar se já temos dados, a menos que force=true
      if (dataLoadedRef.current && contractors.length > 0 && !force) return;

      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const data = await contractorsApi.getContractors();
        setContractors(data);
        dataLoadedRef.current = true;

        // Transformar em opções para select
        const options = data.map((contractor) => ({
          value: contractor.id,
          label: contractor.name,
          icon: 'briefcase-outline',
        }));

        setContractorOptions(options);
      } catch (error: any) {
        console.error('Erro ao carregar contratantes:', error);
        setError(error.message || 'Erro ao carregar contratantes');
        showToast('Erro ao carregar lista de contratantes', 'error');
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    [contractorsApi, showToast, contractors.length]
  );

  useEffect(() => {
    // Apenas carregar dados se ainda não tivermos dados e não estivermos carregando
    if (!dataLoadedRef.current && !isLoadingRef.current) {
      loadContractors();
    }
  }, [loadContractors]);

  const getContractorById = useCallback(
    (id: string): Contractor | undefined => {
      return contractors.find((contractor) => contractor.id === id);
    },
    [contractors]
  );

  return {
    contractors,
    contractorOptions,
    isLoading,
    error,
    loadContractors,
    getContractorById,
  };
}
