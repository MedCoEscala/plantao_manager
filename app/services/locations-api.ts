import { useAuth } from '@clerk/clerk-expo';
import { useCallback } from 'react';

import apiClient from '../lib/axios';

export interface Location {
  id: string;
  name: string;
  address?: string;
  phone?: string | number;
  color: string;
}

export interface CreateLocationData {
  name: string;
  address?: string;
  phone?: string | number;
  color: string;
}

export interface UpdateLocationData {
  name?: string;
  address?: string;
  phone?: string | number;
  color?: string;
}

export interface LocationsFilters {
  searchTerm?: string;
}

export const useLocationsApi = () => {
  const { getToken } = useAuth();

  const getLocations = useCallback(
    async (filters?: LocationsFilters): Promise<Location[]> => {
      try {
        const token = await getToken();

        let queryParams = '';

        if (filters?.searchTerm) {
          queryParams = `?searchTerm=${encodeURIComponent(filters.searchTerm)}`;
        }

        const response = await apiClient.get(`/locations${queryParams}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        return response.data;
      } catch (error) {
        console.log('Erro ao buscar locais', error);
        throw error;
      }
    },
    [getToken]
  );

  const getLocationById = useCallback(
    async (id: string): Promise<Location> => {
      try {
        const token = await getToken();

        const response = await apiClient.get(`/locations/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        return response.data;
      } catch (error) {
        console.log(`Erro ao buscar local ${id}`, error);
        throw error;
      }
    },
    [getToken]
  );

  const createLocation = useCallback(
    async (data: CreateLocationData): Promise<Location> => {
      try {
        const token = await getToken();

        const response = await apiClient.post('/locations', data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        return response.data;
      } catch (error) {
        console.log(`Erro ao criar local`, error);
        throw error;
      }
    },
    [getToken]
  );

  const updateLocation = useCallback(
    async (id: string, data: UpdateLocationData): Promise<Location> => {
      try {
        const token = await getToken();

        const response = await apiClient.put(`/locations/${id}`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        return response.data;
      } catch (error) {
        console.log(`Erro ao atualizar local ${id}`, error);
        throw error;
      }
    },
    [getToken]
  );

  const deleteLocation = useCallback(
    async (id: string): Promise<Location> => {
      try {
        const token = await getToken();

        const response = await apiClient.delete(`/locations/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        return response.data;
      } catch (error) {
        console.log(`Erro ao deletar local ${id}`, error);
        throw error;
      }
    },
    [getToken]
  );

  return {
    getLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation,
  };
};

// Default export para resolver warning do React Router
const locationsApi = {
  useLocationsApi,
};

export default locationsApi;
