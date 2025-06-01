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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs para controle de carregamento
  const isLoadingRef = useRef(false);
  const dataLoadedRef = useRef(false);
  const lastLoadTimeRef = useRef(0);

  const contractorsApi = useContractorsApi();
  const { showToast } = useToast();

  const loadContractors = useCallback(
    async (force = false) => {
      const now = Date.now();

      // Evitar múltiplas requisições simultâneas
      if (isLoadingRef.current && !force) {
        console.log('[Contractors] Carregamento já em andamento');
        return;
      }

      // Não recarregar se já temos dados recentes, a menos que force=true
      if (
        dataLoadedRef.current &&
        contractors.length > 0 &&
        !force &&
        now - lastLoadTimeRef.current < 300000
      ) {
        // 5 minutos
        console.log('[Contractors] Dados já carregados e recentes');
        return;
      }

      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      lastLoadTimeRef.current = now;

      try {
        console.log('[Contractors] Carregando contratantes...');
        const data = await contractorsApi.getContractors();

        setContractors(data);
        dataLoadedRef.current = true;

        // Transformar em opções para select de forma otimizada
        const options = data.map((contractor) => ({
          value: contractor.id,
          label: contractor.name,
          icon: 'briefcase-outline',
        }));

        setContractorOptions(options);
        console.log(`[Contractors] ${data.length} contratantes carregados`);
      } catch (error: any) {
        console.error('[Contractors] Erro ao carregar:', error);
        setError(error.message || 'Erro ao carregar contratantes');

        // Só mostra toast se não for uma tentativa automática
        if (force) {
          showToast('Erro ao carregar lista de contratantes', 'error');
        }
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    [contractorsApi, showToast, contractors.length]
  );

  // Carregamento inicial mais controlado
  useEffect(() => {
    // Apenas carregar dados se ainda não tivermos carregado
    if (!dataLoadedRef.current && !isLoadingRef.current) {
      loadContractors(false);
    }
  }, []); // Dependências vazias para carregar apenas uma vez

  const getContractorById = useCallback(
    (id: string): Contractor | undefined => {
      return contractors.find((contractor) => contractor.id === id);
    },
    [contractors]
  );

  // Função para forçar reload quando necessário
  const reloadContractors = useCallback(() => {
    loadContractors(true);
  }, [loadContractors]);

  return {
    contractors,
    contractorOptions,
    isLoading,
    error,
    loadContractors: reloadContractors, // Expor apenas a versão que força reload
    getContractorById,
  };
}

// Default export para resolver warning do React Router
const contractorsSelectorHook = {
  useContractorsSelector,
};

export default contractorsSelectorHook;
