import { useState, useCallback } from 'react';
import { useApi, Location, ApiError } from '../app/services/api';
import { v4 as uuidv4 } from 'uuid';

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
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Buscar todos os locais
  const getLocations = useCallback(async (): Promise<Location[]> => {
    setLoading(true);
    setError(null);

    try {
      const locations = await api.getLocations();
      return locations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar locais';
      setError(new Error(errorMessage));
      console.error('Erro ao buscar locais:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Buscar local   por ID
  const getLocationById = useCallback(
    async (id: string): Promise<Location | null> => {
      setLoading(true);
      setError(null);

      try {
        const location = await api.getLocation(id);
        return location;
      } catch (err) {
        // Se for erro 404, retornamos null
        if (err instanceof ApiError && err.status === 404) {
          return null;
        }

        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar local';
        setError(new Error(errorMessage));
        console.error(`Erro ao buscar local com ID ${id}:`, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  // Criar novo local
  const createLocation = useCallback(
    async (data: LocationCreateInput): Promise<Location | null> => {
      setLoading(true);
      setError(null);

      try {
        // Gerar um ID no cliente para manter compatibilidade com o código existente
        const id = uuidv4();
        const location = await api.createLocation({
          ...data,
          id,
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
    [api]
  );

  // Atualizar local existente
  const updateLocation = useCallback(
    async (data: LocationUpdateInput): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        // Removemos o ID dos dados antes de enviar para a API
        const { id, ...updateData } = data;
        await api.updateLocation(id, updateData);
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
    [api]
  );

  // Excluir local
  const deleteLocation = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await api.deleteLocation(id);
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof ApiError && err.status === 400
            ? err.data?.error || 'Não é possível excluir este local'
            : err instanceof Error
              ? err.message
              : 'Erro ao excluir local';

        setError(new Error(errorMessage));
        console.error(`Erro ao excluir local com ID ${id}:`, err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [api]
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
