import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useDialog } from './DialogContext';

interface NetworkContextType {
  isOnline: boolean;
  isWifi: boolean;
  isCellular: boolean;
  connectionType: string | null;
  connectionDetails: string | null;
  lastChecked: Date | null;
  checkNetworkAction: <T>(action: () => Promise<T>, showErrorDialog?: boolean) => Promise<T | null>;
  checkConnection: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isWifi, setIsWifi] = useState(false);
  const [isCellular, setIsCellular] = useState(false);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [connectionDetails, setConnectionDetails] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const { showDialog } = useDialog();

  // Função para atualizar o estado da rede com base nas informações do NetInfo
  const updateNetworkState = useCallback((state: NetInfoState) => {
    setIsOnline(!!state.isConnected);
    setIsWifi(state.type === 'wifi');
    setIsCellular(state.type === 'cellular');
    setConnectionType(state.type);

    // Criar detalhes legíveis da conexão
    let details = state.type || 'desconhecido';

    if (state.type === 'wifi' && state.details && 'ssid' in state.details) {
      const wifiDetails = state.details;
      details = `WiFi: ${wifiDetails.ssid || 'Desconhecido'}`;
      if (wifiDetails.strength) {
        details += ` (Sinal: ${wifiDetails.strength}%)`;
      }
    } else if (
      state.type === 'cellular' &&
      state.details &&
      'cellularGeneration' in state.details
    ) {
      const cellDetails = state.details;
      details = `Celular: ${cellDetails.cellularGeneration || 'Desconhecido'}`;
      if (cellDetails.carrier) {
        details += ` (${cellDetails.carrier})`;
      }
    }

    setConnectionDetails(details);
    setLastChecked(new Date());
  }, []);

  // Verificar conexão atual
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch();
      updateNetworkState(state);
      return !!state.isConnected;
    } catch (error) {
      console.error('Erro ao verificar estado da conexão:', error);
      return false;
    }
  }, [updateNetworkState]);

  useEffect(() => {
    // Verificar estado inicial
    checkConnection();

    // Configurar listener para mudanças de rede
    const unsubscribe = NetInfo.addEventListener(updateNetworkState);

    return () => {
      unsubscribe();
    };
  }, [updateNetworkState, checkConnection]);

  // Função para verificar rede antes de executar uma ação
  const checkNetworkAction = useCallback(
    async <T,>(action: () => Promise<T>, showErrorDialog = true): Promise<T | null> => {
      const isConnected = await checkConnection();

      if (!isConnected) {
        if (showErrorDialog) {
          showDialog({
            type: 'error',
            title: 'Sem conexão',
            message:
              'Esta ação requer conexão com a internet. Por favor, verifique sua conexão e tente novamente.',
          });
        }
        return null;
      }

      try {
        return await action();
      } catch (error) {
        // Se for erro de rede, mostrar diálogo específico
        if (
          error instanceof Error &&
          (error.message.toLowerCase().includes('network') ||
            error.message.toLowerCase().includes('internet') ||
            error.message.toLowerCase().includes('connection'))
        ) {
          if (showErrorDialog) {
            showDialog({
              type: 'error',
              title: 'Erro de conexão',
              message:
                'Ocorreu um erro de conexão. Por favor, verifique sua conexão e tente novamente.',
            });
          }

          // Verifica o estado da conexão novamente após o erro
          checkConnection();
        }
        throw error;
      }
    },
    [checkConnection, showDialog]
  );

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        isWifi,
        isCellular,
        connectionType,
        connectionDetails,
        lastChecked,
        checkNetworkAction,
        checkConnection,
      }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork deve ser usado dentro de um NetworkProvider');
  }
  return context;
};

export default NetworkProvider;
