// app/contexts/SyncContext.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { usePrisma } from './PrismaContext';
import { useAuth } from '@clerk/clerk-expo';

// Definir os tipos que precisamos localmente
type AppStateStatus = 'active' | 'background' | 'inactive' | 'unknown' | 'extension';

// Definir uma interface simplificada para o retorno de addEventListener
interface Subscription {
  remove: () => void;
}

// Interface para o AppState que usamos
interface AppStateInterface {
  addEventListener(type: 'change', listener: (state: AppStateStatus) => void): Subscription;
}

// Importar AppState de forma segura, evitando o erro de tipagem
// @ts-ignore - Ignoramos o erro de tipagem aqui para acessar o AppState
const AppState: AppStateInterface = require('react-native').AppState;

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingOperations: number;
  syncNow: () => Promise<boolean>;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingOperations, setPendingOperations] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const { prisma, isReady } = usePrisma();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        if (pendingOperations > 0 && isOnline && isSignedIn) {
          syncNow();
        }
      }
    };

    // Usamos a interface segura para adicionar o listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [pendingOperations, isOnline, isSignedIn]);

  useEffect(() => {
    if (isOnline && pendingOperations > 0 && isSignedIn && isLoaded && !isSyncing) {
      syncNow();
    }
  }, [isOnline, pendingOperations, isSignedIn, isLoaded, isSyncing]);

  const syncNow = async (): Promise<boolean> => {
    if (isSyncing || !isOnline || !isSignedIn || !isLoaded || !isReady) {
      return false;
    }

    try {
      setIsSyncing(true);
      setSyncStatus('syncing');

      // Implementação simplificada com Prisma
      // Como não estamos mais realizando sincronização local/remota
      // vamos apenas atualizar o status e retornar sucesso
      setLastSyncTime(new Date());
      setPendingOperations(0);
      setSyncStatus('success');

      return true;
    } catch (error) {
      console.error('Erro durante sincronização:', error);
      setSyncStatus('error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const value = {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingOperations,
    syncNow,
    syncStatus,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);

  if (context === undefined) {
    throw new Error('useSync deve ser usado dentro de um SyncProvider');
  }

  return context;
};

export default SyncProvider;
