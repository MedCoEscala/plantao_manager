// app/contexts/SyncContext.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useSQLite } from './SQLiteContext';
import { useAuth } from '@clerk/clerk-expo';
import syncManager from '../services/sync/syncManager';
import userRepository from '../repositories/userRepository';
import locationRepository from '../repositories/locationRepository';
import shiftRepository from '../repositories/shiftRepository';
import paymentRepository from '../repositories/paymentRepository';

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

  const { database, isDBReady } = useSQLite();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (database && isDBReady) {
      userRepository.initialize(database);
      locationRepository.initialize(database);
      shiftRepository.initialize(database);
      paymentRepository.initialize(database);

      syncManager.initialize(database);

      const loadLastSyncTime = async () => {
        const time = await syncManager.getLastSyncTime();
        setLastSyncTime(time);
      };

      loadLastSyncTime();
    }
  }, [database, isDBReady]);

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
    const checkPendingOperations = async () => {
      const hasPending = await syncManager.hasPendingOperations();
      const count = await syncManager.getPendingOperationsCount();
      setPendingOperations(count);
    };

    checkPendingOperations();

    const intervalId = setInterval(checkPendingOperations, 5 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (isOnline && pendingOperations > 0 && isSignedIn && isLoaded && !isSyncing) {
      syncNow();
    }
  }, [isOnline, pendingOperations, isSignedIn, isLoaded, isSyncing]);

  const syncNow = async (): Promise<boolean> => {
    if (isSyncing || !isOnline || !isSignedIn || !isLoaded) {
      return false;
    }

    try {
      setIsSyncing(true);
      setSyncStatus('syncing');

      const success = await syncManager.syncNow();

      if (success) {
        const time = await syncManager.getLastSyncTime();
        setLastSyncTime(time);

        const count = await syncManager.getPendingOperationsCount();
        setPendingOperations(count);

        setSyncStatus('success');
      } else {
        setSyncStatus('error');
      }

      return success;
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
