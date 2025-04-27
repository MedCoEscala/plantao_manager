import axios from 'axios';

const baseURL = process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
  console.error('ERRO: EXPO_PUBLIC_API_URL não está definida no .env');
  throw new Error('EXPO_PUBLIC_API_URL is not defined');
}

const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 Requisição para: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Erro na requisição:', error);
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
    } else {
      console.error('❌ Erro na resposta:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
