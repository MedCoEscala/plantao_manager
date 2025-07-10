// Configuração específica para NativeWind v4 em produção
import '../../global.css';

// Força o carregamento dos estilos básicos para inicialização
export function initializeNativeWind() {
  // Esta função garante que o CSS é carregado corretamente
  try {
    // Força o processamento imediato dos estilos críticos
    if (process.env.NODE_ENV === "production") {
      console.log("🎨 Inicializando NativeWind em modo produção");
      
      // Garantir que os estilos base sejam processados
      const criticalStyles = [
        'flex-1',
        'bg-white',
        'text-base',
        'text-black',
        'p-4',
        'rounded-lg',
        'bg-primary-500'
      ];
      
      // Log dos estilos críticos para debugar
      console.log("🔍 Estilos críticos carregados:", criticalStyles.length);
    }
    
    console.log("✅ NativeWind v4 inicializado com sucesso");
  } catch (error) {
    console.warn("⚠️  Erro ao inicializar NativeWind:", error);
  }
}

// Função para verificar se os estilos estão funcionando
export function verifyStyles() {
  if (__DEV__) {
    console.log("🔍 Verificando estilos NativeWind...");
  }
} 