import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import Constants from 'expo-constants';

// Interface para representar operações do Prisma através da API
interface PrismaAPI {
  // Função genérica para fazer requisições à API
  request: <T>(endpoint: string, method: string, data?: any) => Promise<T>;
  isReady: boolean;
}

const PrismaContext = createContext<PrismaAPI | undefined>(undefined);

// Função auxiliar para obter a URL base da API
function getApiBaseUrl() {
  // Em desenvolvimento, use o IP da máquina em vez de localhost
  // para que os dispositivos físicos e emuladores possam acessar
  const debuggerHost = Constants.expoConfig?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    return `http://${host}:3000/api`;
  }

  // Em produção, use a URL da API
  return '/api';
}

// Função para fazer requisições à API
async function apiRequest<T>(endpoint: string, method: string, data?: any): Promise<T> {
  try {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/${endpoint}`;

    console.log(`Fazendo requisição para: ${url}`);

    // Obter token de autenticação do Clerk ou usar um token de desenvolvimento
    let token = '';
    try {
      const clerk = globalThis.Clerk;
      if (clerk && clerk.session) {
        token = await clerk.session.getToken();
      } else if (__DEV__) {
        console.log('Usando token de desenvolvimento para API');
        token = 'dev-token-bypass';
      }
    } catch (tokenError) {
      console.error('Erro ao obter token:', tokenError);
      if (__DEV__) {
        token = 'dev-token-bypass';
      }
    }

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro na requisição API ${endpoint}:`, error);
    throw error;
  }
}

interface PrismaProviderProps {
  children: ReactNode;
}

export const PrismaProvider: React.FC<PrismaProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        // Faz uma requisição para testar a API
        const baseUrl = getApiBaseUrl();
        const statusUrl = `${baseUrl}/status`;

        console.log(`Verificando conexão com a API: ${statusUrl}`);

        // Obter token de autenticação ou usar token de desenvolvimento
        let token = '';
        try {
          const clerk = globalThis.Clerk;
          if (clerk && clerk.session) {
            token = await clerk.session.getToken();
          } else if (__DEV__) {
            console.log('Usando token de desenvolvimento para API');
            token = 'dev-token-bypass';
          }
        } catch (tokenError) {
          console.error('Erro ao obter token:', tokenError);
          if (__DEV__) {
            token = 'dev-token-bypass';
          }
        }

        const response = await fetch(statusUrl, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        });

        if (!response.ok) {
          throw new Error(`Erro na verificação: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Status da API:', data);

        if (data.services.database === 'connected') {
          console.log('Conexão com banco de dados estabelecida com sucesso');
          setIsReady(true);
        } else {
          console.error('Banco de dados não conectado:', data.services.database);
          setTimeout(checkApiConnection, 5000);
        }
      } catch (error) {
        console.error('Erro ao conectar à API:', error);
        // Tentar novamente após alguns segundos
        setTimeout(checkApiConnection, 5000);
      }
    };

    // Iniciar verificação
    checkApiConnection();
  }, []);

  // Implementação das funções da API Prisma
  const prismaAPI: PrismaAPI = {
    request: apiRequest,
    isReady,
  };

  return <PrismaContext.Provider value={prismaAPI}>{children}</PrismaContext.Provider>;
};

export const usePrisma = () => {
  const context = useContext(PrismaContext);
  if (context === undefined) {
    throw new Error('usePrisma deve ser usado dentro de um PrismaProvider');
  }
  return context;
};

export default PrismaProvider;
