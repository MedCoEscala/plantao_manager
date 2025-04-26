import axios from 'axios';

const baseURL = process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
  console.error('ERRO: EXPO_PUBLIC_API_URL não está definida no .env');
  // Lançar erro ou usar fallback pode ser melhor aqui
  // throw new Error('EXPO_PUBLIC_API_URL is not defined');
}

const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
    // Outros headers padrão, se necessário
  },
});

// O token será adicionado manualmente nas chamadas que o exigem
// usando useAuth().getToken()

export default apiClient;
