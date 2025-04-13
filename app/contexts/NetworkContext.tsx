import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useDialog } from './DialogContext';

interface NetworkContextType {
  isOnline: boolean;
  checkNetworkAction: <T>(action: () => Promise<T>) => Promise<T | null>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const { showDialog } = useDialog();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });

    // Verificar estado inicial
    NetInfo.fetch().then((state) => {
      setIsOnline(!!state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Função para verificar rede antes de executar uma ação
  const checkNetworkAction = async <T,>(action: () => Promise<T>): Promise<T | null> => {
    const netState = await NetInfo.fetch();
    const online = !!netState.isConnected;

    if (!online) {
      showDialog({
        type: 'error',
        title: 'Sem conexão',
        message:
          'Esta ação requer conexão com a internet. Por favor, verifique sua conexão e tente novamente.',
      });
      return null;
    }

    try {
      return await action();
    } catch (error) {
      // Se for erro de rede, mostrar diálogo específico
      if (error instanceof Error && error.message.includes('network')) {
        showDialog({
          type: 'error',
          title: 'Erro de conexão',
          message:
            'Ocorreu um erro de conexão. Por favor, verifique sua conexão e tente novamente.',
        });
      }
      throw error;
    }
  };

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        checkNetworkAction,
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
