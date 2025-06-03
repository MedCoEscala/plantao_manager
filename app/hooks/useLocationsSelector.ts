import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocationsApi, Location } from '@/services/locations-api';
import { useToast } from '@/components/ui/Toast';

interface LocationOption {
  value: string;
  label: string;
  icon: string;
  color: string;
}

export function useLocationsSelector() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs para controle de carregamento
  const isLoadingRef = useRef(false);
  const dataLoadedRef = useRef(false);
  const lastLoadTimeRef = useRef(0);

  const locationsApi = useLocationsApi();
  const { showToast } = useToast();

  const loadLocations = useCallback(
    async (force = false) => {
      const now = Date.now();

      // Evitar múltiplas requisições simultâneas
      if (isLoadingRef.current && !force) {
        console.log('[Locations] Carregamento já em andamento');
        return;
      }

      // Não recarregar se já temos dados recentes, a menos que force=true
      if (
        dataLoadedRef.current &&
        !force &&
        now - lastLoadTimeRef.current < 300000 // 5 minutos
      ) {
        console.log('[Locations] Dados já carregados e recentes');
        return;
      }

      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      lastLoadTimeRef.current = now;

      try {
        console.log('[Locations] Carregando locais...');
        const data = await locationsApi.getLocations();

        setLocations(data);
        dataLoadedRef.current = true;

        // Transformar em opções para select de forma otimizada
        const options = data.map((location) => ({
          value: location.id,
          label: location.name,
          icon: 'business-outline',
          color: location.color || '#0077B6',
        }));

        setLocationOptions(options);
        console.log(`[Locations] ${data.length} locais carregados`);
      } catch (error: any) {
        console.error('[Locations] Erro ao carregar:', error);
        setError(error.message || 'Erro ao carregar locais');

        // Só mostra toast se não for uma tentativa automática
        if (force) {
          showToast('Erro ao carregar lista de locais', 'error');
        }
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    [locationsApi, showToast]
  );

  // Carregamento inicial mais controlado
  useEffect(() => {
    // Apenas carregar dados se ainda não tivermos carregado
    if (!dataLoadedRef.current && !isLoadingRef.current) {
      loadLocations(false);
    }
  }, []); // Dependências vazias para carregar apenas uma vez

  const getLocationById = useCallback(
    (id: string): Location | undefined => {
      return locations.find((location) => location.id === id);
    },
    [locations]
  );

  // Função para forçar reload quando necessário
  const reloadLocations = useCallback(() => {
    loadLocations(true);
  }, [loadLocations]);

  return {
    locations,
    locationOptions,
    isLoading,
    error,
    loadLocations: reloadLocations, // Expor apenas a versão que força reload
    getLocationById,
  };
}

// Default export para resolver warning do React Router
const locationsSelectorHook = {
  useLocationsSelector,
};

export default locationsSelectorHook;
