import React, { createContext, useContext, useEffect } from 'react';

import { useNotifications, UseNotificationsReturn } from '../hooks/useNotifications';
import { useToast } from '../components/ui/Toast';

const NotificationsContext = createContext<UseNotificationsReturn | undefined>(undefined);

interface NotificationsProviderProps {
  children: React.ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const notifications = useNotifications();

  useEffect(() => {
    if (__DEV__) {
      console.log('🔔 [NotificationsContext] Status:', {
        hasToken: !!notifications.expoPushToken,
        isRegistered: notifications.isRegistered,
        hasPermissions: notifications.hasPermissions,
        isLoading: notifications.isLoading,
        hasConfig: !!notifications.config,
      });
    }
  }, [
    notifications.expoPushToken,
    notifications.isRegistered,
    notifications.hasPermissions,
    notifications.isLoading,
    notifications.config,
  ]);

  return (
    <NotificationsContext.Provider value={notifications}>{children}</NotificationsContext.Provider>
  );
};

export const useNotificationsContext = (): UseNotificationsReturn => {
  const context = useContext(NotificationsContext);

  if (context === undefined) {
    throw new Error('useNotificationsContext deve ser usado dentro de NotificationsProvider');
  }

  return context;
};

export const useNotificationStatus = () => {
  const { hasPermissions, isRegistered, isLoading, expoPushToken } = useNotificationsContext();

  return {
    hasPermissions,
    isRegistered,
    isLoading,
    hasToken: !!expoPushToken,
    isEnabled: hasPermissions && isRegistered && !!expoPushToken,
  };
};

export const useNotificationConfig = () => {
  const { config, isConfigLoading, updateConfig, refreshConfig } = useNotificationsContext();

  return {
    config,
    isLoading: isConfigLoading,
    updateConfig,
    refreshConfig,
  };
};

// Hook para notificações de toast (showError, showSuccess, etc.)
export const useNotification = () => {
  const { showToast } = useToast();

  return {
    showError: (message: string) => showToast(message, 'error'),
    showSuccess: (message: string) => showToast(message, 'success'),
    showInfo: (message: string) => showToast(message, 'info'),
    showWarning: (message: string) => showToast(message, 'warning'),
  };
};

export default NotificationsProvider;
