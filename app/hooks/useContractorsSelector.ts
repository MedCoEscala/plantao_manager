import { useState, useEffect, useRef } from 'react';
import { useContractorsApi, Contractor } from '@/services/contractors-api';

interface ContractorOption {
  value: string;
  label: string;
  icon?: string;
}

// Cache global para evitar múltiplas requisições
class ContractorsCache {
  private static instance: ContractorsCache;
  private cache: Map<string, { data: Contractor[]; timestamp: number; loading: boolean }> =
    new Map();
  private readonly CACHE_DURATION = 300000; // 5 minutos
  private loadingPromises: Map<string, Promise<Contractor[]>> = new Map();

  static getInstance(): ContractorsCache {
    if (!ContractorsCache.instance) {
      ContractorsCache.instance = new ContractorsCache();
    }
    return ContractorsCache.instance;
  }

  async getContractors(contractorsApi: any): Promise<Contractor[]> {
    const key = 'contractors';
    const now = Date.now();

    // Verificar cache
    const cached = this.cache.get(key);
    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      console.log('[ContractorsCache] Retornando dados do cache');
      return cached.data;
    }

    // Verificar se já está carregando
    const loadingPromise = this.loadingPromises.get(key);
    if (loadingPromise) {
      console.log('[ContractorsCache] Aguardando carregamento em andamento');
      return loadingPromise;
    }

    // Iniciar novo carregamento
    console.log('[ContractorsCache] Iniciando novo carregamento');
    const promise = this.loadContractors(contractorsApi, key);
    this.loadingPromises.set(key, promise);

    try {
      const data = await promise;
      this.cache.set(key, { data, timestamp: now, loading: false });
      return data;
    } finally {
      this.loadingPromises.delete(key);
    }
  }

  private async loadContractors(contractorsApi: any, key: string): Promise<Contractor[]> {
    try {
      const data = await contractorsApi.getContractors();
      console.log(`[ContractorsCache] ${data.length} contratantes carregados`);
      return data;
    } catch (error) {
      console.error('[ContractorsCache] Erro ao carregar contratantes:', error);
      throw error;
    }
  }

  clearCache(): void {
    console.log('[ContractorsCache] Cache limpo');
    this.cache.clear();
    this.loadingPromises.clear();
  }

  isLoading(): boolean {
    return this.loadingPromises.size > 0;
  }
}

export function useContractorsSelector() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorOptions, setContractorOptions] = useState<ContractorOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractorsApi = useContractorsApi();
  const cache = ContractorsCache.getInstance();
  const initializedRef = useRef(false);

  // Função para carregar dados
  const loadData = async (force = false) => {
    if (force) {
      cache.clearCache();
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await cache.getContractors(contractorsApi);

      setContractors(data);

      // Transformar em opções para select
      const options = data.map((contractor) => ({
        value: contractor.id,
        label: contractor.name,
        icon: 'briefcase-outline',
      }));
      setContractorOptions(options);
    } catch (error: any) {
      console.error('[useContractorsSelector] Erro:', error);
      setError(error.message || 'Erro ao carregar contratantes');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregamento inicial - APENAS UMA VEZ
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      loadData();
    }
  }, []);

  const getContractorById = (id: string): Contractor | undefined => {
    return contractors.find((contractor) => contractor.id === id);
  };

  const reloadContractors = () => {
    loadData(true);
  };

  return {
    contractors,
    contractorOptions,
    isLoading,
    error,
    loadContractors: reloadContractors,
    getContractorById,
  };
}

export default useContractorsSelector;
