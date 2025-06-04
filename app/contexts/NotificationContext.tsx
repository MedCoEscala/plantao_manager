import React, { createContext, useContext, useState, ReactNode } from 'react';

import NotificationModal from '../components/ui/NotificationModal';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationOptions {
  type?: NotificationType;
  title?: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
  autoClose?: boolean;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (options: NotificationOptions) => void;
  showSuccess: (message: string, title?: string, onConfirm?: () => void) => void;
  showError: (message: string, title?: string, onConfirm?: () => void) => void;
  showInfo: (message: string, title?: string, onConfirm?: () => void) => void;
  showWarning: (message: string, title?: string, onConfirm?: () => void) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<NotificationOptions>({
    type: 'info',
    message: '',
    title: '',
    autoClose: false,
  });

  const showNotification = (notificationOptions: NotificationOptions) => {
    setOptions(notificationOptions);
    setVisible(true);

    // Auto close se especificado
    if (notificationOptions.autoClose) {
      const duration = notificationOptions.duration || 3000;
      setTimeout(() => {
        hideNotification();
      }, duration);
    }
  };

  const showSuccess = (message: string, title?: string, onConfirm?: () => void) => {
    showNotification({
      type: 'success',
      title: title || 'Sucesso',
      message,
      onConfirm,
      confirmText: 'OK',
    });
  };

  const showError = (message: string, title?: string, onConfirm?: () => void) => {
    showNotification({
      type: 'error',
      title: title || 'Erro',
      message,
      onConfirm,
      confirmText: 'OK',
    });
  };

  const showInfo = (message: string, title?: string, onConfirm?: () => void) => {
    showNotification({
      type: 'info',
      title: title || 'Informação',
      message,
      onConfirm,
      confirmText: 'OK',
    });
  };

  const showWarning = (message: string, title?: string, onConfirm?: () => void) => {
    showNotification({
      type: 'warning',
      title: title || 'Atenção',
      message,
      onConfirm,
      confirmText: 'OK',
    });
  };

  const hideNotification = () => {
    setVisible(false);
  };

  const handleConfirm = () => {
    if (options.onConfirm) {
      options.onConfirm();
    }
    hideNotification();
  };

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        hideNotification,
      }}>
      {children}
      <NotificationModal
        visible={visible}
        type={options.type || 'info'}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText || 'OK'}
        onConfirm={handleConfirm}
        onClose={hideNotification}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }

  return context;
};

export default NotificationProvider;
