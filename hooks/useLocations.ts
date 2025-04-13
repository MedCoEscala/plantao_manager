import { useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { usePrisma } from '../app/contexts/PrismaContext';
import { v4 as uuidv4 } from 'uuid';

export interface Location {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  color?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
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
  const { user } = useUser();
  const { prisma, isReady } = usePrisma();

  const getLocations = useCallback(async (): Promise<Location[]> => {
    if (!isReady || !user) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const locations = await prisma.location.findMany({
        where: { userId: user.id },
        orderBy: { name: 'asc' },
      });
      return locations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar locais';
      setError(new Error(errorMessage));
      console.error('Erro ao buscar locais:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [prisma, isReady, user]);

  const getLocationById = useCallback(
    async (id: string): Promise<Location | null> => {
      if (!isReady || !user) {
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const location = await prisma.location.findFirst({
          where: {
            id,
            userId: user.id,
          },
        });

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
    [prisma, isReady, user]
  );

  const createLocation = useCallback(
    async (data: LocationCreateInput): Promise<Location | null> => {
      if (!isReady || !user) {
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const id = uuidv4();
        const location = await prisma.location.create({
          data: {
            id,
            ...data,
            color: data.color || '#0077B6', // Cor padrão se não especificada
            userId: user.id,
          },
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
    [prisma, isReady, user]
  );

  const updateLocation = useCallback(
    async (data: LocationUpdateInput): Promise<boolean> => {
      if (!isReady || !user) {
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const { id, ...updateData } = data;

        const existingLocation = await prisma.location.findFirst({
          where: {
            id,
            userId: user.id,
          },
        });

        if (!existingLocation) {
          throw new Error('Local não encontrado ou não pertence ao usuário');
        }

        await prisma.location.update({
          where: { id },
          data: updateData,
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
    [prisma, isReady, user]
  );

  const deleteLocation = useCallback(
    async (id: string): Promise<boolean> => {
      if (!isReady || !user) {
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const shiftsCount = await prisma.shift.count({
          where: {
            locationId: id,
            userId: user.id,
          },
        });

        if (shiftsCount > 0) {
          throw new Error('Não é possível excluir este local porque há plantões associados a ele');
        }

        const existingLocation = await prisma.location.findFirst({
          where: {
            id,
            userId: user.id,
          },
        });

        if (!existingLocation) {
          throw new Error('Local não encontrado ou não pertence ao usuário');
        }

        await prisma.location.delete({
          where: { id },
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
    [prisma, isReady, user]
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
