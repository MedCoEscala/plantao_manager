// Configurações da aplicação

// URL da API do backend
export const API_URL = process.env.EXPO_PUBLIC_API_URL
  ? ensureApiPrefix(process.env.EXPO_PUBLIC_API_URL)
  : 'http://localhost:3000/api';

// Função para garantir que a URL base tenha o prefixo '/api'
function ensureApiPrefix(url: string): string {
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
}
