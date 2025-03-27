import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = "info",
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
      case "success":
        return "checkmark-circle" as const;
      case "error":
        return "alert-circle" as const;
      case "warning":
        return "warning-outline" as const;
      case "info":
      default:
        return "information-circle" as const;
    }
  };

  const getIconColor = (): string => {
    switch (type) {
      case "success":
        return "#2A9D8F";
      case "error":
        return "#E76F51";
      case "warning":
        return "#E9C46A";
      case "info":
      default:
        return "#0077B6";
    }
  };

  const getBackgroundColor = (): string => {
    switch (type) {
      case "success":
        return "rgba(42, 157, 143, 0.1)";
      case "error":
        return "rgba(231, 111, 81, 0.1)";
      case "warning":
        return "rgba(233, 196, 106, 0.1)";
      case "info":
      default:
        return "rgba(0, 119, 182, 0.1)";
    }
  };

  const getBorderColor = (): string => {
    switch (type) {
      case "success":
        return "#2A9D8F";
      case "error":
        return "#E76F51";
      case "warning":
        return "#E9C46A";
      case "info":
      default:
        return "#0077B6";
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
      ]}
    >
      <Ionicons name={getIconName()} size={24} color={getIconColor()} />
      <Text style={styles.message}>{message}</Text>
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
  }>({
    showToast: () => {},
    hideToast: () => {},
  });

  const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    const [visible, setVisible] = React.useState(false);
    const [message, setMessage] = React.useState("");
    const [type, setType] = React.useState<ToastType>("info");
    const [duration, setDuration] = React.useState(3000);

    const showToast = (
      msg: string,
      toastType: ToastType = "info",
      toastDuration = 3000
    ) => {
      setMessage(msg);
      setType(toastType);
      setDuration(toastDuration);
      setVisible(true);
    };

    const hideToast = () => {
      setVisible(false);
    };

    return (
      <ToastContext.Provider value={{ showToast, hideToast }}>
        {children}
        <Toast
          visible={visible}
          message={message}
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

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 9999,
  },
  message: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
    fontSize: 14,
    color: "#2B2D42",
  },
});
