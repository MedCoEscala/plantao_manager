import axios from 'axios';

import { API_URL } from '../config';

const activeRequests = new Map<string, number>();

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // Gera uma chave única para a requisição
    const requestKey = `${config.method}:${config.url}${
      config.params ? JSON.stringify(config.params) : ''
    }`;

    // Registra o momento de início da requisição
    activeRequests.set(requestKey, Date.now());

    (config as any).startTime = Date.now();
    return config;
  },
  (error) => {
    console.error('Erro na configuração da requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para respostas
apiClient.interceptors.response.use(
  (response) => {
    // Extrai informações da resposta
    const { method, url, params } = response.config;
    const requestKey = `${method}:${url}${params ? JSON.stringify(params) : ''}`;

    // Remove da lista de requisições ativas
    activeRequests.delete(requestKey);

    return response;
  },
  (error) => {
    if (error.config) {
      const { method, url, params } = error.config;
      const requestKey = `${method}:${url}${params ? JSON.stringify(params) : ''}`;
      activeRequests.delete(requestKey);
    }

    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    console.error('Erro na requisição:', error.config?.url);

    if (error.code === 'ECONNABORTED') {
      console.error('Timeout da requisição excedido');
    } else if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Mensagem:', error.response.data?.message || error.message);
    } else if (error.request) {
      console.error('Erro de rede - sem resposta do servidor');
    } else {
      console.error('Erro:', error.message);
    }

    return Promise.reject(error);
  }
);

// Função para limpar requisições antigas periodicamente
setInterval(() => {
  const now = Date.now();
  activeRequests.forEach((startTime, key) => {
    // Remove requisições com mais de 30 segundos
    if (now - startTime > 30000) {
      activeRequests.delete(key);
    }
  });
}, 60000); // Executa a cada minuto

export default apiClient;
