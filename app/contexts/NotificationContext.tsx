import React, { createContext, useContext, useEffect } from 'react';

import { useNotifications, UseNotificationsReturn } from '../hooks/useNotifications';

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

export default NotificationsProvider;
