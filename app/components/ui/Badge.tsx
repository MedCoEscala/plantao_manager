import React from "react";
import { View, Text, ViewProps } from "react-native";

interface BadgeProps extends ViewProps {
  variant?: "primary" | "secondary" | "success" | "error" | "warning" | "info";
  size?: "sm" | "md" | "lg";
  rounded?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "primary",
  size = "md",
  rounded = false,
  children,
  className = "",
  ...props
}) => {
  // Função para gerar as classes CSS com base nas props
  const getContainerClasses = () => {
    let classes = "items-center justify-center ";

    // Variantes
    switch (variant) {
      case "primary":
        classes += "bg-primary-100 ";
        break;
      case "secondary":
        classes += "bg-secondary-100 ";
        break;
      case "success":
        classes += "bg-success-100 ";
        break;
      case "error":
        classes += "bg-error-100 ";
        break;
      case "warning":
        classes += "bg-warning-100 ";
        break;
      case "info":
      default:
        classes += "bg-primary-50 ";
        break;
    }

    // Tamanhos
    switch (size) {
      case "sm":
        classes += "px-2 py-0.5 ";
        break;
      case "lg":
        classes += "px-3 py-1.5 ";
        break;
      case "md":
      default:
        classes += "px-2.5 py-1 ";
        break;
    }

    // Arredondamento
    if (rounded) {
      classes += "rounded-full ";
    } else {
      classes += "rounded-md ";
    }

    return classes + className;
  };

  // Função para gerar as classes do texto com base nas props
  const getTextClasses = () => {
    let classes = "font-medium ";

    // Tamanho do texto
    switch (size) {
      case "sm":
        classes += "text-xs ";
        break;
      case "lg":
        classes += "text-sm ";
        break;
      case "md":
      default:
        classes += "text-xs ";
        break;
    }

    // Cor do texto
    switch (variant) {
      case "primary":
        classes += "text-primary-700 ";
        break;
      case "secondary":
        classes += "text-secondary-700 ";
        break;
      case "success":
        classes += "text-success-700 ";
        break;
      case "error":
        classes += "text-error-700 ";
        break;
      case "warning":
        classes += "text-warning-700 ";
        break;
      case "info":
      default:
        classes += "text-primary-700 ";
        break;
    }

    return classes;
  };

  return (
    <View className={getContainerClasses()} {...props}>
      <Text className={getTextClasses()}>{children}</Text>
    </View>
  );
};

// Exportação default para o expo-router
export default Badge;
