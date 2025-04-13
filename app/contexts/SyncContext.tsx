import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

type AppStateStatus = 'active' | 'background' | 'inactive' | 'unknown' | 'extension';

interface Subscription {
  remove: () => void;
}

interface AppStateInterface {
  addEventListener(type: 'change', listener: (state: AppStateStatus) => void): Subscription;
}

const AppState: AppStateInterface = require('react-native').AppState;

const LAST_SYNC_TIME_KEY = 'last_sync_time';
const PENDING_OPS_KEY = 'pending_operations';

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

  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    const loadLastSyncTime = async () => {
      try {
        const timeStr = await SecureStore.getItemAsync(LAST_SYNC_TIME_KEY);
        if (timeStr) {
          setLastSyncTime(new Date(parseInt(timeStr)));
        }

        const pendingOpsStr = await SecureStore.getItemAsync(PENDING_OPS_KEY);
        if (pendingOpsStr) {
          setPendingOperations(parseInt(pendingOpsStr));
        }
      } catch (error) {
        console.error('Erro ao carregar dados de sincronização:', error);
      }
    };

    loadLastSyncTime();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });

    NetInfo.fetch().then((state) => {
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
    if (isSyncing || !isOnline || !isSignedIn || !isLoaded) {
      return false;
    }

    try {
      setIsSyncing(true);
      setSyncStatus('syncing');

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newLastSyncTime = new Date();
      setLastSyncTime(newLastSyncTime);

      await SecureStore.setItemAsync(LAST_SYNC_TIME_KEY, newLastSyncTime.getTime().toString());

      setPendingOperations(0);
      await SecureStore.setItemAsync(PENDING_OPS_KEY, '0');

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
