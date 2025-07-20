import React, { createContext, useContext, useCallback, useRef } from 'react';

interface ShiftsSyncContextType {
  triggerShiftsRefresh: () => void;
  subscribeToRefresh: (callback: () => void) => () => void;
}

const ShiftsSyncContext = createContext<ShiftsSyncContextType | undefined>(undefined);

export function ShiftsSyncProvider({ children }: { children: React.ReactNode }) {
  const refreshCallbacks = useRef<Set<() => void>>(new Set());

  const triggerShiftsRefresh = useCallback(() => {
    console.log('🔄 Triggering shifts refresh for', refreshCallbacks.current.size, 'subscribers');
    refreshCallbacks.current.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('Error in shifts refresh callback:', error);
      }
    });
  }, []);

  const subscribeToRefresh = useCallback((callback: () => void) => {
    refreshCallbacks.current.add(callback);

    // Retorna função para cancelar inscrição
    return () => {
      refreshCallbacks.current.delete(callback);
    };
  }, []);

  return (
    <ShiftsSyncContext.Provider value={{ triggerShiftsRefresh, subscribeToRefresh }}>
      {children}
    </ShiftsSyncContext.Provider>
  );
}

export function useShiftsSync() {
  const context = useContext(ShiftsSyncContext);
  if (!context) {
    throw new Error('useShiftsSync must be used within a ShiftsSyncProvider');
  }
  return context;
}
