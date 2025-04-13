import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '@clerk/clerk-expo';

// Interface para representar operações do Prisma através da API
interface PrismaAPI {
  // Função genérica para fazer requisições à API
  request: <T>(endpoint: string, method: string, data?: any) => Promise<T>;
  isReady: boolean;
  lastError: string | null;
}

const PrismaContext = createContext<PrismaAPI | undefined>(undefined);

// Função auxiliar para obter a URL base da API
function getApiBaseUrl() {
  // Verificar se temos uma URL definida no arquivo .env
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (configuredUrl && configuredUrl.trim() !== '') {
    return configuredUrl.trim();
  }

  // Em desenvolvimento, use o IP da máquina em vez de localhost
  // para que os dispositivos físicos e emuladores possam acessar
  const debuggerHost = Constants.expoConfig?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    return `http://${host}:3000/api`;
  }

  // Em produção, use a URL relativa
  return '/api';
}

// Função para fazer requisições à API
async function apiRequest<T>(endpoint: string, method: string, data?: any): Promise<T> {
  try {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/${endpoint}`;

    console.log(`Fazendo requisição para: ${url} (${method})`);

    // Obter token de autenticação do Clerk ou usar um token de desenvolvimento
    let token = '';

    try {
      // @ts-ignore - Ignoramos o erro de tipagem aqui
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
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(
        `Erro na requisição: ${response.status} - ${errorData.message || response.statusText}`
      );
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
  const [lastError, setLastError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        // Primeiro verifica se temos conexão com a internet
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          setLastError('Sem conexão com a internet. Verifique sua conexão e tente novamente.');
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 5000);
          return;
        }

        // Faz uma requisição para testar a API
        const baseUrl = getApiBaseUrl();
        const statusUrl = `${baseUrl}/status`;

        console.log(`Verificando conexão com a API: ${statusUrl} (tentativa ${retryCount + 1})`);

        // Obter token de autenticação ou usar token de desenvolvimento
        let token = '';
        try {
          // @ts-ignore - Ignoramos o erro de tipagem aqui
          const clerk = globalThis.Clerk;
          if (clerk && clerk.session) {
            token = await clerk.session.getToken();
          } else if (__DEV__) {
            console.log('Usando token de desenvolvimento para API');
            token = 'dev-token-bypass';
          }
        } catch (tokenError) {
          console.log('Erro ao obter token (normal se não estiver autenticado):', tokenError);
          if (__DEV__) {
            token = 'dev-token-bypass';
          }
        }

        // Adicionamos um timeout para garantir que não ficamos presos esperando indefinidamente
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

        const response = await fetch(statusUrl, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Erro na verificação: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Status da API:', data);

        if (data.services.database === 'connected') {
          console.log('Conexão com banco de dados estabelecida com sucesso');
          setIsReady(true);
          setLastError(null);
        } else {
          const errorMsg = `Banco de dados não conectado: ${data.services.database}`;
          console.error(errorMsg);
          setLastError(errorMsg);
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 5000);
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `Erro ao conectar à API: ${error.message}`
            : 'Erro desconhecido ao conectar à API';

        console.error(errorMsg);
        setLastError(errorMsg);

        // Tentar novamente após alguns segundos (máximo 5 tentativas)
        if (retryCount < 5) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 5000);
        }
      }
    };

    // Verificamos a conexão com a API imediatamente, independente do estado de autenticação
    checkApiConnection();
  }, [retryCount]);

  // Implementação das funções da API Prisma
  const prismaAPI: PrismaAPI = {
    request: apiRequest,
    isReady,
    lastError,
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
