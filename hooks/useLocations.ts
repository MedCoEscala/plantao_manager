import { useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { v4 as uuidv4 } from 'uuid';
import { authenticatedFetch } from '../app/utils/api-client';

export interface Location {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  color?: string;
  userId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface LocationCreateInput {
  name: string;
  address: string;
  phone?: string;
  color?: string;
}

export interface LocationUpdateInput extends Partial<LocationCreateInput> {
  id: string;
}

export function useLocations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user, isLoaded } = useUser();

  const getLocations = useCallback(async (): Promise<Location[]> => {
    if (!isLoaded || !user) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const locations = await authenticatedFetch<Location[]>('locations');
      return locations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar locais';
      setError(new Error(errorMessage));
      console.error('Erro ao buscar locais:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user]);

  const getLocationById = useCallback(
    async (id: string): Promise<Location | null> => {
      if (!isLoaded || !user) {
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const location = await authenticatedFetch<Location | null>(`locations/${id}`);
        return location;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar local';
        setError(new Error(errorMessage));
        console.error(`Erro ao buscar local com ID ${id}:`, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, user]
  );

  const createLocation = useCallback(
    async (data: LocationCreateInput): Promise<Location | null> => {
      if (!isLoaded || !user) {
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Adicionar id único para a localização
        const locationData = {
          id: uuidv4(),
          ...data,
          color: data.color || '#0077B6', // Cor padrão se não especificada
        };

        const location = await authenticatedFetch<Location>('locations', {
          method: 'POST',
          body: JSON.stringify(locationData),
        });

        return location;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar local';
        setError(new Error(errorMessage));
        console.error('Erro ao criar local:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, user]
  );

  const updateLocation = useCallback(
    async (data: LocationUpdateInput): Promise<boolean> => {
      if (!isLoaded || !user) {
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const { id, ...updateData } = data;

        await authenticatedFetch(`locations/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar local';
        setError(new Error(errorMessage));
        console.error(`Erro ao atualizar local com ID ${data.id}:`, err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, user]
  );

  const deleteLocation = useCallback(
    async (id: string): Promise<boolean> => {
      if (!isLoaded || !user) {
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        await authenticatedFetch(`locations/${id}`, {
          method: 'DELETE',
        });

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir local';
        setError(new Error(errorMessage));
        console.error(`Erro ao excluir local com ID ${id}:`, err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, user]
  );

  return {
    getLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation,
    loading,
    error,
  };
}

export default useLocations;
