import apiClient from '../lib/axios';
import { useAuth } from '@clerk/clerk-expo';

export const fetchWithAuth = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  getToken: () => Promise<string | null>
): Promise<T> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Não foi possível obter o token de autenticação.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  console.log(`🔐 Fazendo requisição autenticada para: ${endpoint}`);

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
      console.error('🚫 Erro de autenticação (401)');
    }
    throw error;
  }
};

export const useAuthenticatedFetch = () => {
  const { getToken } = useAuth();

  const fetchAuth = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    if (!getToken) {
      throw new Error('Hook useAuth não inicializado corretamente.');
    }
    return fetchWithAuth<T>(endpoint, options, getToken);
  };

  return { fetchAuth };
};
