import React, { useState, useEffect, useRef } from "react";
import { Text, Animated, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

// Estado global do toast
let toastState: ToastState = {
  visible: false,
  message: "",
  type: "info",
};

// Função para atualizar o estado do toast
let updateToastState: (state: ToastState) => void = () => {};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<ToastState>({
    visible: false,
    message: "",
    type: "info",
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Atualiza a função de estado global
  updateToastState = setState;

  // Atualiza o estado global
  toastState = state;

  useEffect(() => {
    if (state.visible) {
      // Mostra o toast
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Esconde após 3 segundos
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setState((prevState) => ({ ...prevState, visible: false }));
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [state.visible, fadeAnim]);

  // Corrigindo retorno de tipo específico para evitar erros com Ionicons
  const getIconName = (type: ToastType): any => {
    switch (type) {
      case "success":
        return "checkmark-circle" as const;
      case "error":
        return "alert-circle" as const;
      case "warning":
        return "warning-outline" as const;
      default:
        return "information-circle" as const;
    }
  };

  const getBackgroundColor = (type: ToastType): string => {
    switch (type) {
      case "success":
        return "#4caf50";
      case "error":
        return "#f44336";
      case "warning":
        return "#ff9800";
      default:
        return "#2196f3";
    }
  };

  return (
    <>
      {children}
      {state.visible && (
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              backgroundColor: getBackgroundColor(state.type),
            },
          ]}
        >
          <View style={styles.content}>
            <Ionicons name={getIconName(state.type)} size={24} color="white" />
            <Text style={styles.message}>{state.message}</Text>
          </View>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 80,
    left: "5%",
    right: "5%",
    borderRadius: 8,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  message: {
    color: "white",
    marginLeft: 8,
    fontWeight: "500",
    fontSize: 16,
  },
});

// Função para mostrar o toast
export const showToast = (message: string, type: ToastType = "info") => {
  updateToastState({
    visible: true,
    message,
    type,
  });
};

export default ToastProvider;
