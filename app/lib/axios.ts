import axios from 'axios';

const baseURL = process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
  console.error('ERRO: EXPO_PUBLIC_API_URL não está definida no .env');
  throw new Error('EXPO_PUBLIC_API_URL is not defined');
}

// Função para garantir que a URL base tenha o prefixo '/api'
const ensureApiPrefix = (url: string): string => {
  // Se já terminar com '/api', não adicione novamente
  if (url.endsWith('/api')) {
    return url;
  }

  // Se terminar com '/', adicione 'api'
  if (url.endsWith('/')) {
    return `${url}api`;
  }

  // Caso contrário, adicione '/api'
  return `${url}/api`;
};

// Variáveis para controlar requisições recentes
const recentRequests = new Map();
const REQUEST_THROTTLE_TIME = 2000; // Reduzido para 2 segundos

// Lista de endpoints que não devem ser throttled (requisições críticas)
const CRITICAL_ENDPOINTS = ['/shifts', '/users/me'];

// Função para limpar entradas antigas do Map
const cleanupRecentRequests = () => {
  const now = Date.now();
  const cutoffTime = now - 30000; // 30 segundos
  for (const [key, time] of recentRequests.entries()) {
    if (time < cutoffTime) {
      recentRequests.delete(key);
    }
  }
};

// Limpar entradas a cada 30 segundos
setInterval(cleanupRecentRequests, 30000);

const apiClient = axios.create({
  baseURL: ensureApiPrefix(baseURL),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Timeout de 10 segundos
});

apiClient.interceptors.request.use(
  (config) => {
    // Criar uma chave única para a requisição
    const requestKey = `${config.method}-${config.url}${JSON.stringify(config.params || {})}`;
    const now = Date.now();

    // Verificar se é um endpoint crítico
    const isCriticalEndpoint = CRITICAL_ENDPOINTS.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    // Verificar se a mesma requisição foi feita recentemente (e não é crítica)
    const lastRequestTime = recentRequests.get(requestKey);
    if (!isCriticalEndpoint && lastRequestTime && now - lastRequestTime < REQUEST_THROTTLE_TIME) {
      // Se sim, apenas registrar em nível de depuração
      console.debug(`🔄 Repetição de requisição para: ${config.url} (throttled)`);
    } else {
      // Se não, registrar normalmente e atualizar o tempo
      console.log(`🚀 Requisição para: ${config.url}`);
      recentRequests.set(requestKey, now);
    }

    return config;
  },
  (error) => {
    console.error('❌ Erro na configuração da requisição:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ Resposta de: ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        `❌ Erro ${error.response.status} de ${error.config?.url}:`,
        error.response.data
      );
    } else if (error.request) {
      console.error(`❌ Sem resposta para requisição ${error.config?.url}:`, error.message);
    } else {
      console.error('❌ Erro na configuração da requisição:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
