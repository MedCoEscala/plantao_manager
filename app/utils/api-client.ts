import { useAuth } from '@clerk/clerk-expo';

import apiClient from '../lib/axios';

export const fetchWithAuth = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  getToken: () => Promise<string | null>
): Promise<T> => {
  const token = await getToken();
  if (!token) {
    console.warn('Token de autenticação não disponível');
    throw new Error('AUTH_TOKEN_UNAVAILABLE');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  try {
    const response = await apiClient.request({
      url: endpoint,
      method: options.method || 'GET',
      headers: Object.fromEntries(headers.entries()),
      data: options.body ? JSON.parse(options.body as string) : undefined,
    });

    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      console.error('Erro de autenticação (401)');
    }
    throw error;
  }
};

export const useAuthenticatedFetch = () => {
  const { getToken } = useAuth();

  const fetchAuth = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    if (!getToken) {
      console.warn('Hook useAuth não inicializado corretamente');
      throw new Error('AUTH_HOOK_NOT_INITIALIZED');
    }
    return fetchWithAuth<T>(endpoint, options, getToken);
  };

  return { fetchAuth };
};

// Default export para resolver warning do React Router
const authUtils = {
  fetchWithAuth,
  useAuthenticatedFetch,
};

export default authUtils;
