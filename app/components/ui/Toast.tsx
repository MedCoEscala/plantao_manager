import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
}

interface ToastOptions {
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  title,
  type = 'info',
  duration = 3000,
  onDismiss,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) {
        onDismiss();
      }
    });
  };

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle' as const;
      case 'error':
        return 'alert-circle' as const;
      case 'warning':
        return 'warning-outline' as const;
      case 'info':
      default:
        return 'information-circle' as const;
    }
  };

  const getIconColor = (): string => {
    switch (type) {
      case 'success':
        return '#2A9D8F';
      case 'error':
        return '#E76F51';
      case 'warning':
        return '#E9C46A';
      case 'info':
      default:
        return '#0077B6';
    }
  };

  const getContainerClasses = (): string => {
    const classes =
      'absolute top-[50px] left-4 right-4 p-4 rounded-lg border flex-row items-center z-50 shadow-md ';

    switch (type) {
      case 'success':
        return classes + 'bg-success/10 border-success';
      case 'error':
        return classes + 'bg-error/10 border-error';
      case 'warning':
        return classes + 'bg-warning/10 border-warning';
      case 'info':
      default:
        return classes + 'bg-primary/10 border-primary';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }],
      }}
      className={getContainerClasses()}>
      <Ionicons name={getIconName()} size={24} color={getIconColor()} />
      <View className="ml-3 mr-3 flex-1">
        {title && <Text className="mb-1 font-bold text-text-dark">{title}</Text>}
        <Text className="text-sm text-text-dark">{message}</Text>
      </View>
      <TouchableOpacity onPress={hideToast}>
        <Ionicons name="close" size={20} color="#8D99AE" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Context para gerenciar o estado do Toast globalmente
export const createToastContext = () => {
  const ToastContext = React.createContext<{
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    hideToast: () => void;
    show: (options: ToastOptions) => void;
  }>({
    showToast: () => {},
    hideToast: () => {},
    show: () => {},
  });

  const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [visible, setVisible] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [title, setTitle] = React.useState<string | undefined>(undefined);
    const [type, setType] = React.useState<ToastType>('info');
    const [duration, setDuration] = React.useState(3000);

    const showToast = (msg: string, toastType: ToastType = 'info', toastDuration = 3000) => {
      setMessage(msg);
      setTitle(undefined);
      setType(toastType);
      setDuration(toastDuration);
      setVisible(true);
    };

    const show = (options: ToastOptions) => {
      setMessage(options.message);
      setTitle(options.title);
      setType(options.type || 'info');
      setDuration(options.duration || 3000);
      setVisible(true);
    };

    const hideToast = () => {
      setVisible(false);
    };

    return (
      <ToastContext.Provider value={{ showToast, hideToast, show }}>
        {children}
        <Toast
          visible={visible}
          message={message}
          title={title}
          type={type}
          duration={duration}
          onDismiss={hideToast}
        />
      </ToastContext.Provider>
    );
  };

  const useToast = () => React.useContext(ToastContext);

  return { ToastProvider, useToast };
};

// Exportando o contexto global de Toast
export const { ToastProvider, useToast } = createToastContext();

// Exportando por padrão para atender requisitos do expo-router
export default ToastProvider;
