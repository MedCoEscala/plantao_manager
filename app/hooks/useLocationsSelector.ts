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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const dataLoadedRef = useRef(false);

  const locationsApi = useLocationsApi();
  const { showToast } = useToast();

  const loadLocations = useCallback(
    async (force = false) => {
      // Evitar múltiplas requisições simultâneas
      if (isLoadingRef.current && !force) return;

      // Não recarregar se já temos dados, a menos que force=true
      if (dataLoadedRef.current && locations.length > 0 && !force) return;

      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const data = await locationsApi.getLocations();
        setLocations(data);
        dataLoadedRef.current = true;

        // Transformar em opções para select
        const options = data.map((location) => ({
          value: location.id,
          label: location.name,
          icon: 'business-outline',
          color: location.color || '#0077B6',
        }));

        setLocationOptions(options);
      } catch (error: any) {
        console.error('Erro ao carregar locais:', error);
        setError(error.message || 'Erro ao carregar locais');
        showToast('Erro ao carregar lista de locais', 'error');
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    [locationsApi, showToast, locations.length]
  );

  useEffect(() => {
    // Apenas carregar dados se ainda não tivermos dados e não estivermos carregando
    if (!dataLoadedRef.current && !isLoadingRef.current) {
      loadLocations();
    }
  }, [loadLocations]);

  const getLocationById = useCallback(
    (id: string): Location | undefined => {
      return locations.find((location) => location.id === id);
    },
    [locations]
  );

  return {
    locations,
    locationOptions,
    isLoading,
    error,
    loadLocations,
    getLocationById,
  };
}
