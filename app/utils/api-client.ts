import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as Network from '@react-native-community/netinfo';

/**
 * Obtém a URL base da API com base no ambiente
 */
export function getApiBaseUrl(): string {
  // Verificar se a URL está explicitamente definida no .env
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (apiUrl && apiUrl.trim() !== '') {
    console.log(`Usando API URL do .env: ${apiUrl}`);
    return apiUrl.trim().endsWith('/api') ? apiUrl.trim() : `${apiUrl.trim()}/api`;
  }

  // Em desenvolvimento com Expo Go
  if (__DEV__) {
    // Tenta obter o host do debugger (funciona para a maioria dos cenários de desenvolvimento)
    const debuggerHost = Constants.expoConfig?.extra?.expoGo?.debuggerHost;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      console.log(`Usando host do debugger: ${host}`);
      // Usamos a porta 3000 para a API por padrão
      return `http://${host}:3000/api`;
    }

    // Tenta obter o host pelo URL atual (fallback)
    try {
      const url = Linking.createURL('');
      console.log(`URL do Linking: ${url}`);
      const hostMatch = url.match(/exp:\/\/([^:]+)/);
      if (hostMatch && hostMatch[1]) {
        console.log(`Usando host do Linking: ${hostMatch[1]}`);
        return `http://${hostMatch[1]}:3000/api`;
      }
    } catch (e) {
      console.warn('Erro ao obter host pelo URL:', e);
    }

    // Se não encontrou o host, usa um fallback para desenvolvimento local
    console.log('Usando fallback para localhost');
    return 'http://localhost:3000/api';
  }

  // Fallback para API relativa (quando executado em produção)
  console.warn('EXPO_PUBLIC_API_URL não está definido. Usando fallback para API relativa.');
  return '/api';
}

/**
 * Verifica se o dispositivo está conectado à internet
 */
export async function checkConnectivity(): Promise<boolean> {
  const netInfo = await Network.fetch();
  return netInfo.isConnected === true;
}

/**
 * Interface para opções avançadas do authenticatedFetch
 */
interface FetchOptions extends RequestInit {
  retry?: number; // Número de tentativas em caso de falha
  timeout?: number; // Timeout em milisegundos
  ignoreConnectivity?: boolean; // Se deve ignorar a verificação de conectividade
}

/**
 * Faz uma requisição autenticada para a API com suporte a retry e timeout
 */
export async function authenticatedFetch<T = any>(
  endpoint: string,
  options?: FetchOptions,
  token?: string
): Promise<T> {
  const defaultOptions: FetchOptions = {
    retry: 1, // Por padrão, apenas 1 tentativa (sem retry)
    timeout: 30000, // 30 segundos de timeout por padrão
    ignoreConnectivity: false,
    ...options,
  };

  // Extraímos os valores com valores padrão caso sejam undefined
  const retryCount = defaultOptions.retry ?? 1;
  const timeout = defaultOptions.timeout ?? 30000;
  const ignoreConnectivity = defaultOptions.ignoreConnectivity ?? false;
  const fetchOptions = { ...defaultOptions };

  // Removemos as propriedades não-padrão do RequestInit
  delete fetchOptions.retry;
  delete fetchOptions.timeout;
  delete fetchOptions.ignoreConnectivity;

  // Verificar conectividade primeiro, a menos que seja explicitamente ignorado
  if (!ignoreConnectivity) {
    const isConnected = await checkConnectivity();
    if (!isConnected) {
      throw new Error(
        'Sem conexão com a internet. Por favor, verifique sua rede e tente novamente.'
      );
    }
  }

  let lastError: Error | null = null;
  let attempts = 0;

  while (attempts <= retryCount) {
    attempts++;
    try {
      const baseUrl = getApiBaseUrl();
      const url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;

      console.log(`Fazendo requisição para: ${url} (tentativa ${attempts}/${retryCount + 1})`);

      // Obter token de autenticação
      let authToken = token;
      if (!authToken) {
        try {
          // @ts-ignore - Ignore erro de tipagem para globalThis.Clerk
          const clerk = globalThis.Clerk;
          if (clerk && clerk.session) {
            authToken = await clerk.session.getToken();
          } else if (__DEV__) {
            console.log('Usando token de desenvolvimento para API');
            authToken = 'dev-token-bypass';
          }
        } catch (tokenError) {
          console.error('Erro ao obter token:', tokenError);
          if (__DEV__) {
            authToken = 'dev-token-bypass';
          }
        }
      }

      const headers = new Headers(fetchOptions?.headers);
      headers.set('Content-Type', 'application/json');
      if (authToken) {
        headers.set('Authorization', `Bearer ${authToken}`);
      }

      // Adicionar um controller para abortar a requisição no timeout
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(id); // Limpar o timeout

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.message ||
            `Erro na requisição: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Se for erro de timeout ou abort, loga de maneira específica
      if (lastError.name === 'AbortError') {
        console.error(`Timeout na requisição API ${endpoint} após ${timeout}ms`);
      } else {
        console.error(
          `Erro na requisição API ${endpoint} (tentativa ${attempts}/${retryCount + 1}):`,
          lastError
        );
      }

      // Se ainda tiver tentativas restantes, espere um pouco antes de tentar novamente
      if (attempts <= retryCount) {
        // Espera progressiva: 1s, 2s, 4s...
        const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // Última tentativa falhou, propaga o erro
        throw lastError;
      }
    }
  }

  // Este código nunca será alcançado devido ao throw no loop, mas TypeScript precisa dele
  throw lastError;
}

export default {
  getApiBaseUrl,
  authenticatedFetch,
  checkConnectivity,
};
