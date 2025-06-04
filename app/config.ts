// Configurações da aplicação
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Função para detectar se está rodando no Expo Go
function isRunningInExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

// Função para detectar automaticamente a URL da API
function getApiUrl(): string {
  // Se tiver a variável de ambiente configurada, use ela
  if (process.env.EXPO_PUBLIC_API_URL) {
    return ensureApiPrefix(process.env.EXPO_PUBLIC_API_URL);
  }

  // Para desenvolvimento
  let defaultUrl: string;

  if (Platform.OS === 'web') {
    // Para web, sempre localhost
    defaultUrl = 'http://localhost:3000/api';
  } else if (isRunningInExpoGo()) {
    // Para Expo Go, precisa do IP da rede (localhost não funciona)
    // Fallback para um IP comum, mas idealmente deve estar no .env
    defaultUrl = 'http://192.168.100.88:3000/api';
  } else {
    // Para simulador/emulador, localhost funciona
    defaultUrl = 'http://localhost:3000/api';
  }

  return defaultUrl;
}

// URL da API do backend
export const API_URL = getApiUrl();

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

// Default export para resolver warning do React Router
const config = {
  API_URL,
  isRunningInExpoGo,
};

export default config;
