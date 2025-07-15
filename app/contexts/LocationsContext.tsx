import { useAuth } from '@clerk/clerk-expo';
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

import { useToast } from '../components/ui/Toast';
import { useProfile } from '../hooks/useProfile';
import { fetchWithAuth } from '../utils/api-client';

export interface Location {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LocationsContextType {
  locations: Location[];
  locationOptions: { label: string; value: string; icon?: string; color?: string }[];
  isLoading: boolean;
  error: string | null;
  refreshLocations: () => Promise<void>;
  addLocation: (location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLocation: (id: string, location: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
}

const LocationsContext = createContext<LocationsContextType | undefined>(undefined);

export function LocationsProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getToken, isLoaded: isAuthLoaded, userId } = useAuth();
  const { showToast } = useToast();
  const { isInitialized: isProfileInitialized } = useProfile();

  const hasInitialized = useRef(false);

  const fetchLocations = useCallback(
    async (showLoadingState = true): Promise<void> => {
      // Só busca se o profile estiver inicializado
      if (!isAuthLoaded || !userId || !isProfileInitialized) {
        setIsLoading(false);
        return;
      }

      try {
        if (showLoadingState) {
          setIsLoading(true);
        }
        setError(null);

        const token = await getToken();
        if (!token) {
          console.warn('Token não disponível para buscar locais');
          throw new Error('AUTH_TOKEN_UNAVAILABLE');
        }

        const data = await fetchWithAuth<Location[]>('/locations', {}, async () => token);

        // Ordenar por nome para consistência
        const sortedLocations = data.sort((a, b) => a.name.localeCompare(b.name));
        setLocations(sortedLocations);
      } catch (error: any) {
        console.error('Erro ao buscar locais:', error);
        setError('Erro ao carregar locais');
        if (error.message !== 'AUTH_TOKEN_UNAVAILABLE') {
          showToast('Erro ao carregar locais', 'error');
        }
      } finally {
        if (showLoadingState) {
          setIsLoading(false);
        }
      }
    },
    [getToken, isAuthLoaded, userId, isProfileInitialized, showToast]
  );

  const addLocation = useCallback(
    async (locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
      if (!getToken) return;

      try {
        const token = await getToken();
        if (!token) {
          console.warn('Token não disponível para adicionar local');
          throw new Error('AUTH_TOKEN_UNAVAILABLE');
        }

        const newLocation = await fetchWithAuth<Location>(
          '/locations',
          {
            method: 'POST',
            body: JSON.stringify(locationData),
          },
          async () => token
        );

        // Atualizar o estado local imediatamente
        setLocations((prev) => {
          const updated = [...prev, newLocation];
          return updated.sort((a, b) => a.name.localeCompare(b.name));
        });

        showToast('Local adicionado com sucesso', 'success');

        // Recarregar dados para garantir sincronização
        setTimeout(() => {
          fetchLocations(false);
        }, 500);
      } catch (error: any) {
        console.error('Erro ao adicionar local:', error);
        const errorMessage = error?.response?.data?.message || 'Erro ao adicionar local';
        showToast(errorMessage, 'error');
        throw error;
      }
    },
    [getToken, showToast, fetchLocations]
  );

  const updateLocation = useCallback(
    async (id: string, locationData: Partial<Location>): Promise<void> => {
      if (!getToken) return;

      try {
        const token = await getToken();
        if (!token) {
          console.warn('Token não disponível para atualizar local');
          throw new Error('AUTH_TOKEN_UNAVAILABLE');
        }

        const updatedLocation = await fetchWithAuth<Location>(
          `/locations/${id}`,
          {
            method: 'PUT',
            body: JSON.stringify(locationData),
          },
          async () => token
        );

        // Atualizar o estado local imediatamente
        setLocations((prev) => {
          const updated = prev.map((l) => (l.id === id ? updatedLocation : l));
          return updated.sort((a, b) => a.name.localeCompare(b.name));
        });

        showToast('Local atualizado com sucesso', 'success');

        // Recarregar dados para garantir sincronização
        setTimeout(() => {
          fetchLocations(false);
        }, 500);
      } catch (error: any) {
        console.error('Erro ao atualizar local:', error);
        const errorMessage = error?.response?.data?.message || 'Erro ao atualizar local';
        showToast(errorMessage, 'error');
        throw error;
      }
    },
    [getToken, showToast, fetchLocations]
  );

  const deleteLocation = useCallback(
    async (id: string): Promise<void> => {
      if (!getToken) return;

      try {
        const token = await getToken();
        if (!token) {
          console.warn('Token não disponível para remover local');
          throw new Error('AUTH_TOKEN_UNAVAILABLE');
        }

        await fetchWithAuth(`/locations/${id}`, { method: 'DELETE' }, async () => token);

        // Atualizar o estado local imediatamente
        setLocations((prev) => prev.filter((l) => l.id !== id));

        showToast('Local removido com sucesso', 'success');

        // Recarregar dados para garantir sincronização
        setTimeout(() => {
          fetchLocations(false);
        }, 500);
      } catch (error: any) {
        console.error('Erro ao remover local:', error);
        const errorMessage = error?.response?.data?.message || 'Erro ao remover local';
        showToast(errorMessage, 'error');
        throw error;
      }
    },
    [getToken, showToast, fetchLocations]
  );

  // Inicializar contexto quando o profile for carregado
  useEffect(() => {
    if (isProfileInitialized && !hasInitialized.current) {
      hasInitialized.current = true;
      fetchLocations();
    }
  }, [isProfileInitialized, fetchLocations]);

  // Reset quando usuário desloga
  useEffect(() => {
    if (isAuthLoaded && !userId) {
      setLocations([]);
      setError(null);
      setIsLoading(false);
      hasInitialized.current = false;
    }
  }, [isAuthLoaded, userId]);

  // Memoizar locationOptions para evitar recriações desnecessárias
  const locationOptions = React.useMemo(
    () =>
      locations.map((location) => ({
        label: location.name,
        value: location.id,
        icon: 'location-outline',
        color: location.color,
      })),
    [locations]
  );

  const value: LocationsContextType = {
    locations,
    locationOptions,
    isLoading,
    error,
    refreshLocations: fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation,
  };

  return <LocationsContext.Provider value={value}>{children}</LocationsContext.Provider>;
}

export function useLocationsContext(): LocationsContextType {
  const context = useContext(LocationsContext);
  if (context === undefined) {
    throw new Error('useLocationsContext deve ser usado dentro de LocationsProvider');
  }
  return context;
}

// Alias para compatibilidade com useLocationsSelector
export function useLocations(): LocationsContextType & { loadLocations: () => Promise<void> } {
  const context = useLocationsContext();
  return {
    ...context,
    loadLocations: context.refreshLocations,
  };
}

// Default export para resolver warning do React Router
const locationsContext = {
  LocationsProvider,
  useLocationsContext,
};

export default locationsContext;
