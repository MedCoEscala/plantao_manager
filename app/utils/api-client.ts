import * as Network from '@react-native-community/netinfo';

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
 * Faz uma requisição autenticada para as API Routes locais com suporte a retry e timeout
 */
export async function authenticatedFetch<T = any>(
  endpoint: string, // Caminho relativo da API Route (ex: '/api/users/sync')
  options?: FetchOptions,
  getToken?: () => Promise<string | null> // Passar a função getToken do useAuth
): Promise<T> {
  const defaultOptions: FetchOptions = {
    retry: 1,
    timeout: 30000,
    ignoreConnectivity: false,
    ...options,
  };

  const retryCount = defaultOptions.retry ?? 1;
  const timeout = defaultOptions.timeout ?? 30000;
  const ignoreConnectivity = defaultOptions.ignoreConnectivity ?? false;
  const fetchOptions = { ...defaultOptions };

  delete fetchOptions.retry;
  delete fetchOptions.timeout;
  delete fetchOptions.ignoreConnectivity;

  if (!ignoreConnectivity) {
    const isConnected = await checkConnectivity();
    if (!isConnected) {
      throw new Error('Sem conexão com a internet.');
    }
  }

  let lastError: Error | null = null;
  let attempts = 0;

  // Valida se o endpoint começa com /api/
  if (!endpoint.startsWith('/api/')) {
    console.warn(
      `Endpoint \"${endpoint}\" não parece ser uma API Route válida. Deve começar com /api/`
    );
    // Considerar lançar um erro ou continuar, dependendo da política desejada.
    // throw new Error('Endpoint inválido para API Route.');
  }

  while (attempts <= retryCount) {
    attempts++;
    try {
      // Usa o endpoint relativo diretamente, pois as API Routes são locais
      const url = endpoint;

      console.log(`Fazendo requisição para: ${url} (tentativa ${attempts}/${retryCount + 1})`);

      let authToken: string | null = null;
      if (getToken) {
        // Check if getToken function was provided
        try {
          authToken = await getToken();
        } catch (tokenError) {
          console.error('Erro ao obter token via getToken():', tokenError);
          // Decide se continua sem token ou lança erro
        }
      }

      const headers = new Headers(fetchOptions?.headers);
      headers.set('Content-Type', 'application/json');
      if (authToken) {
        headers.set('Authorization', `Bearer ${authToken}`);
      } else {
        console.warn('Nenhum token de autenticação fornecido ou obtido.');
      }

      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(id);

      if (!response.ok) {
        let errorData = { message: `Erro: ${response.status} ${response.statusText}` };
        try {
          errorData = await response.json();
        } catch (parseError) {
          // Ignora erro de parse se o corpo não for JSON válido
        }
        throw new Error(
          errorData.message || `Erro na requisição: ${response.status} ${response.statusText}`
        );
      }

      // Retorna o corpo da resposta parseado como JSON ou null se não houver corpo
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return null as T; // Ou string vazia, dependendo do que fizer mais sentido
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (lastError.name === 'AbortError') {
        console.error(`Timeout na requisição ${endpoint} após ${timeout}ms`);
      } else {
        console.error(
          `Erro na requisição ${endpoint} (tentativa ${attempts}/${retryCount + 1}):`,
          lastError.message // Log apenas a mensagem para ser mais limpo
        );
      }
      if (attempts <= retryCount) {
        const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw lastError;
      }
    }
  }

  throw lastError; // Nunca alcançado, mas necessário para TypeScript
}

export default {
  authenticatedFetch,
  checkConnectivity,
};
