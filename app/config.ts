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
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Para desenvolvimento local (backend roda em localhost:3000)
  // Para produção, usar a URL do Vercel (https://medescala.vercel.app)
  let defaultUrl: string;

  if (Platform.OS === 'web') {
    // Para web, sempre localhost (desenvolvimento)
    defaultUrl = 'http://localhost:3000';
  } else if (isRunningInExpoGo()) {
    // Para Expo Go, precisa do IP da rede (localhost não funciona)
    // Fallback para um IP comum, mas idealmente deve estar no .env
    defaultUrl = 'http://192.168.100.88:3000';
  } else {
    // Para simulador/emulador, localhost funciona
    defaultUrl = 'http://localhost:3000';
  }

  return defaultUrl;
}

// URL da API do backend
export const API_URL = getApiUrl();

// Default export para resolver warning do React Router
const config = {
  API_URL,
  isRunningInExpoGo,
};

export default config;
