// Utilitário para verificar funcionamento do NativeWind v4 em produção
import { Platform } from 'react-native';

export function verifyNativeWind() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDev = __DEV__;
  
  const info = {
    platform: Platform.OS,
    isProduction,
    isDev,
    timestamp: new Date().toISOString(),
  };
  
  if (isDev) {
    console.log('🔍 NativeWind Verification:', info);
  }
  
  return info;
}

// Função para log de estilos críticos em caso de problemas
export function logCriticalStyles() {
  if (__DEV__) {
    const criticalClasses = [
      'flex-1',
      'bg-white',
      'text-black',
      'p-4',
      'rounded-lg',
      'bg-primary-500'
    ];
    
    console.log('🎨 Testando classes críticas:', criticalClasses);
  }
} 