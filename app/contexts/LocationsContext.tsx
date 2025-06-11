import { useAuth } from '@clerk/clerk-expo';
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

import { useToast } from '@/components/ui/Toast';
import { useProfile } from '@/hooks/useProfile';
import { fetchWithAuth } from '@/utils/api-client';

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

  const fetchLocations = useCallback(async (): Promise<void> => {
    // Só busca se o profile estiver inicializado
    if (!isAuthLoaded || !userId || !isProfileInitialized) {
      setIsLoading(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Token de autenticação não disponível');
      }

      setIsLoading(true);
      setError(null);

      const data = await fetchWithAuth<Location[]>(
        '/locations',
        { method: 'GET' },
        async () => token
      );

      setLocations(data || []);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Erro ao carregar locais';
      setError(errorMessage);

      // Não mostrar toast se for erro de autenticação (ainda inicializando)
      if (!error?.message?.includes('não autenticado')) {
        showToast('Erro ao carregar locais', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthLoaded, userId, isProfileInitialized, getToken, showToast]);

  const addLocation = useCallback(
    async (locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
      if (!getToken) return;

      try {
        const token = await getToken();
        if (!token) throw new Error('Token não disponível');

        const newLocation = await fetchWithAuth<Location>(
          '/locations',
          {
            method: 'POST',
            body: JSON.stringify(locationData),
          },
          async () => token
        );

        setLocations((prev) => [...prev, newLocation]);
        showToast('Local adicionado com sucesso', 'success');
      } catch (error: any) {
        console.error('Erro ao adicionar local:', error);
        const errorMessage = error?.response?.data?.message || 'Erro ao adicionar local';
        showToast(errorMessage, 'error');
        throw error;
      }
    },
    [getToken, showToast]
  );

  const updateLocation = useCallback(
    async (id: string, locationData: Partial<Location>): Promise<void> => {
      if (!getToken) return;

      try {
        const token = await getToken();
        if (!token) throw new Error('Token não disponível');

        const updatedLocation = await fetchWithAuth<Location>(
          `/locations/${id}`,
          {
            method: 'PUT',
            body: JSON.stringify(locationData),
          },
          async () => token
        );

        setLocations((prev) => prev.map((l) => (l.id === id ? updatedLocation : l)));
        showToast('Local atualizado com sucesso', 'success');
      } catch (error: any) {
        console.error('Erro ao atualizar local:', error);
        const errorMessage = error?.response?.data?.message || 'Erro ao atualizar local';
        showToast(errorMessage, 'error');
        throw error;
      }
    },
    [getToken, showToast]
  );

  const deleteLocation = useCallback(
    async (id: string): Promise<void> => {
      if (!getToken) return;

      try {
        const token = await getToken();
        if (!token) throw new Error('Token não disponível');

        await fetchWithAuth(`/locations/${id}`, { method: 'DELETE' }, async () => token);

        setLocations((prev) => prev.filter((l) => l.id !== id));
        showToast('Local removido com sucesso', 'success');
      } catch (error: any) {
        console.error('Erro ao remover local:', error);
        const errorMessage = error?.response?.data?.message || 'Erro ao remover local';
        showToast(errorMessage, 'error');
        throw error;
      }
    },
    [getToken, showToast]
  );

  // Carrega locais quando o profile estiver inicializado
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

  const value: LocationsContextType = {
    locations,
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

// Default export para resolver warning do React Router
const locationsContext = {
  LocationsProvider,
  useLocationsContext,
};

export default locationsContext;
