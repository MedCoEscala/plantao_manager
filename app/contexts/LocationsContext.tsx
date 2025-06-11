import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

import { useLocationsApi, Location } from '@/services/locations-api';

interface LocationOption {
  value: string;
  label: string;
  icon: string;
  color: string;
}

interface LocationsContextType {
  locations: Location[];
  locationOptions: LocationOption[];
  isLoading: boolean;
  error: string | null;
  refreshLocations: () => Promise<void>;
  getLocationById: (id: string) => Location | undefined;
}

const LocationsContext = createContext<LocationsContextType | undefined>(undefined);

export function LocationsProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoadingRef = useRef(false);
  const dataLoadedRef = useRef(false);
  const lastLoadTimeRef = useRef(0);

  const locationsApi = useLocationsApi();

  const loadLocations = useCallback(
    async (force = false) => {
      const now = Date.now();

      // Evitar múltiplas requisições simultâneas
      if (isLoadingRef.current && !force) {
        return;
      }

      // Cache de 5 minutos
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
        console.error('Erro ao carregar locais:', error);
        setError(error.message || 'Erro ao carregar locais');
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    [locationsApi]
  );

  // Carregar locations apenas uma vez na inicialização - usando ref para evitar loop
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!hasInitializedRef.current && !dataLoadedRef.current && !isLoadingRef.current) {
      hasInitializedRef.current = true;
      loadLocations(false);
    }
  }, []); // Sem dependências para evitar loop

  const refreshLocations = useCallback(async () => {
    await loadLocations(true);
  }, [loadLocations]);

  const getLocationById = useCallback(
    (id: string): Location | undefined => {
      return locations.find((location) => location.id === id);
    },
    [locations]
  );

  const value: LocationsContextType = {
    locations,
    locationOptions,
    isLoading,
    error,
    refreshLocations,
    getLocationById,
  };

  return <LocationsContext.Provider value={value}>{children}</LocationsContext.Provider>;
}

export function useLocations() {
  const context = useContext(LocationsContext);
  if (context === undefined) {
    throw new Error('useLocations must be used within a LocationsProvider');
  }
  return context;
}
