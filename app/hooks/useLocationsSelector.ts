import { useState, useEffect, useCallback, useRef } from 'react';

import { useToast } from '@/components/ui/Toast';
import { useLocationsApi, Location } from '@/services/locations-api';

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

  const isLoadingRef = useRef(false);
  const dataLoadedRef = useRef(false);
  const lastLoadTimeRef = useRef(0);

  const locationsApi = useLocationsApi();
  const { showToast } = useToast();

  const loadLocations = useCallback(
    async (force = false) => {
      const now = Date.now();

      if (isLoadingRef.current && !force) {
        return;
      }

      if (dataLoadedRef.current && !force && now - lastLoadTimeRef.current < 300000) {
        return;
      }

      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      lastLoadTimeRef.current = now;

      try {
        const data = await locationsApi.getLocations();

        setLocations(data);
        dataLoadedRef.current = true;

        const options = data.map((location) => ({
          value: location.id,
          label: location.name,
          icon: 'business-outline',
          color: location.color || '#0077B6',
        }));

        setLocationOptions(options);
      } catch (error: any) {
        console.error('[Locations] Erro ao carregar:', error);
        setError(error.message || 'Erro ao carregar locais');

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

  useEffect(() => {
    if (!dataLoadedRef.current && !isLoadingRef.current) {
      loadLocations(false);
    }
  }, []);

  const getLocationById = useCallback(
    (id: string): Location | undefined => {
      return locations.find((location) => location.id === id);
    },
    [locations]
  );

  const reloadLocations = useCallback(() => {
    loadLocations(true);
  }, [loadLocations]);

  return {
    locations,
    locationOptions,
    isLoading,
    error,
    loadLocations: reloadLocations,
    getLocationById,
  };
}

const locationsSelectorHook = {
  useLocationsSelector,
};

export default locationsSelectorHook;
