import { useClerk } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';

// Classe de erro personalizada para facilitar o tratamento
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Interfaces para os tipos de dados
export interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends Entity {
  name: string;
  email: string;
  phoneNumber?: string;
  birthDate?: string;
}

export interface Location extends Entity {
  name: string;
  address: string;
  phone?: string;
  color?: string;
  userId: string;
}

export interface Shift extends Entity {
  date: string;
  startTime: string;
  endTime: string;
  value: number;
  status: string;
  notes?: string;
  userId: string;
  locationId?: string;
  contractorId?: string;
  location?: Location;
}

export interface Payment extends Entity {
  shiftId: string;
  paymentDate?: string;
  grossValue: number;
  netValue: number;
  paid: boolean;
  notes?: string;
  method?: string;
  shift?: Shift;
}

// Obter a URL base da API com base no ambiente
const getApiBaseUrl = () => {
  const customApiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (customApiUrl) {
    return customApiUrl.endsWith('/') ? customApiUrl.slice(0, -1) : customApiUrl;
  }

  // Em desenvolvimento, determinar automaticamente a URL da API
  if (process.env.NODE_ENV !== 'production') {
    // Verificar se estamos usando Expo Go ou desenvolvimento local
    if (Constants.expoConfig?.extra?.expoGo) {
      // Em desenvolvimento Expo Go, usar a URL do host
      return '';
    } else {
      // Em desenvolvimento local, usar localhost
      return 'http://localhost:8081';
    }
  }

  // Em produção, usar a URL do mesmo domínio/host
  return '';
};

// Hook personalizado para fazer requisições autenticadas
export function useApi() {
  const clerk = useClerk();
  const apiBaseUrl = getApiBaseUrl();

  // Função auxiliar para construir o caminho completo da API
  const buildApiPath = (path: string) => {
    if (apiBaseUrl === '') {
      return path; // Usar URL relativa se não tiver base URL
    }
    return path.startsWith('/') ? `${apiBaseUrl}${path}` : `${apiBaseUrl}/${path}`;
  };

  // Função para verificar conexão com a rede
  const checkNetworkConnection = async () => {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new ApiError('Sem conexão com a internet', 0);
    }
  };

  // Função genérica para fazer requisições à API
  const apiRequest = async (path: string, options: RequestInit = {}) => {
    await checkNetworkConnection();

    let token: string | null = null;

    try {
      // Obter token de autenticação
      const sessionToken = await clerk.session?.getToken();
      token = sessionToken || null;
    } catch (error) {
      console.error('Erro ao obter token:', error);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Usando token de desenvolvimento para API');
        token = 'dev-token-bypass';
      } else {
        throw new ApiError('Erro de autenticação', 401);
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const requestOptions = {
      ...options,
      headers,
    };

    try {
      const url = buildApiPath(path);
      console.log(`Requisição para: ${url}`);
      const response = await fetch(url, requestOptions);

      // Se a resposta não for OK (2xx), lançar erro
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new ApiError(
          errorData?.error || `Erro ${response.status}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error(`Erro na requisição para ${path}:`, error);
      throw new ApiError(
        error instanceof Error ? error.message : 'Erro desconhecido na requisição',
        500
      );
    }
  };

  // Métodos específicos para cada entidade
  return {
    // Verificação de status da API
    checkStatus: async () => {
      try {
        return await apiRequest('/api/status');
      } catch (error) {
        console.error('Erro ao verificar status da API:', error);
        throw error;
      }
    },

    // Usuários
    getUser: async () => {
      try {
        return await apiRequest('/api/user');
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        throw error;
      }
    },

    updateUser: async (data: Partial<User>) => {
      try {
        return await apiRequest('/api/user', {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        throw error;
      }
    },

    createUser: async (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        return await apiRequest('/api/user', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (error) {
        console.error('Erro ao criar usuário:', error);
        throw error;
      }
    },

    // Locais
    getLocations: async () => {
      try {
        return await apiRequest('/api/locations');
      } catch (error) {
        console.error('Erro ao buscar locais:', error);
        throw error;
      }
    },

    getLocation: async (id: string) => {
      try {
        return await apiRequest(`/api/locations/${id}`);
      } catch (error) {
        console.error(`Erro ao buscar local ${id}:`, error);
        throw error;
      }
    },

    createLocation: async (data: Omit<Location, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      try {
        return await apiRequest('/api/locations', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (error) {
        console.error('Erro ao criar local:', error);
        throw error;
      }
    },

    updateLocation: async (
      id: string,
      data: Partial<Omit<Location, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
    ) => {
      try {
        return await apiRequest(`/api/locations/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch (error) {
        console.error(`Erro ao atualizar local ${id}:`, error);
        throw error;
      }
    },

    deleteLocation: async (id: string) => {
      try {
        return await apiRequest(`/api/locations/${id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error(`Erro ao excluir local ${id}:`, error);
        throw error;
      }
    },

    // Plantões
    getShifts: async () => {
      try {
        return await apiRequest('/api/shifts');
      } catch (error) {
        console.error('Erro ao buscar plantões:', error);
        throw error;
      }
    },

    getShiftsByMonth: async (year: number, month: number) => {
      try {
        return await apiRequest(`/api/shifts?year=${year}&month=${month}`);
      } catch (error) {
        console.error(`Erro ao buscar plantões de ${month}/${year}:`, error);
        throw error;
      }
    },

    getShiftsByDate: async (date: string) => {
      try {
        return await apiRequest(`/api/shifts?date=${date}`);
      } catch (error) {
        console.error(`Erro ao buscar plantões da data ${date}:`, error);
        throw error;
      }
    },

    getShift: async (id: string) => {
      try {
        return await apiRequest(`/api/shifts/${id}`);
      } catch (error) {
        console.error(`Erro ao buscar plantão ${id}:`, error);
        throw error;
      }
    },

    createShift: async (data: Omit<Shift, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      try {
        return await apiRequest('/api/shifts', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (error) {
        console.error('Erro ao criar plantão:', error);
        throw error;
      }
    },

    updateShift: async (
      id: string,
      data: Partial<Omit<Shift, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
    ) => {
      try {
        return await apiRequest(`/api/shifts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch (error) {
        console.error(`Erro ao atualizar plantão ${id}:`, error);
        throw error;
      }
    },

    deleteShift: async (id: string) => {
      try {
        return await apiRequest(`/api/shifts/${id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error(`Erro ao excluir plantão ${id}:`, error);
        throw error;
      }
    },

    // Pagamentos
    getPayments: async () => {
      try {
        return await apiRequest('/api/payments');
      } catch (error) {
        console.error('Erro ao buscar pagamentos:', error);
        throw error;
      }
    },

    getPaymentsByShift: async (shiftId: string) => {
      try {
        return await apiRequest(`/api/payments?shiftId=${shiftId}`);
      } catch (error) {
        console.error(`Erro ao buscar pagamentos do plantão ${shiftId}:`, error);
        throw error;
      }
    },

    getPayment: async (id: string) => {
      try {
        return await apiRequest(`/api/payments/${id}`);
      } catch (error) {
        console.error(`Erro ao buscar pagamento ${id}:`, error);
        throw error;
      }
    },

    createPayment: async (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        return await apiRequest('/api/payments', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        throw error;
      }
    },

    updatePayment: async (
      id: string,
      data: Partial<Omit<Payment, 'id' | 'shiftId' | 'createdAt' | 'updatedAt'>>
    ) => {
      try {
        return await apiRequest(`/api/payments/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch (error) {
        console.error(`Erro ao atualizar pagamento ${id}:`, error);
        throw error;
      }
    },

    deletePayment: async (id: string) => {
      try {
        return await apiRequest(`/api/payments/${id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error(`Erro ao excluir pagamento ${id}:`, error);
        throw error;
      }
    },
  };
}
