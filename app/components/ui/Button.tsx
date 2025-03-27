import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from "react-native";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends TouchableOpacityProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  loading = false,
  size = "md",
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}) => {
  // Estilos base do botão
  const baseStyle = "rounded-lg items-center justify-center";

  // Estilos de variantes
  const variantStyles = {
    primary: "bg-primary text-white",
    secondary: "bg-secondary text-text-dark",
    outline: "bg-transparent border border-primary text-primary",
    ghost: "bg-transparent text-primary",
  };

  // Estilos de tamanhos
  const sizeStyles = {
    sm: "py-1 px-3",
    md: "py-2 px-4",
    lg: "py-3 px-6",
  };

  // Estilos para largura total
  const widthStyle = fullWidth ? "w-full" : "";

  // Estilos para estado desabilitado
  const disabledStyle = disabled || loading ? "opacity-60" : "";

  // Combinando todos os estilos
  const buttonStyle = twMerge(
    baseStyle,
    variantStyles[variant],
    sizeStyles[size],
    widthStyle,
    disabledStyle,
    className
  );

  // Estilos do texto
  const textSizeStyles = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const textColorStyles = {
    primary: "text-white",
    secondary: "text-text-dark",
    outline: "text-primary",
    ghost: "text-primary",
  };

  const textStyle = twMerge(
    "font-medium",
    textSizeStyles[size],
    textColorStyles[variant]
  );

  return (
    <TouchableOpacity
      className={buttonStyle}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#ffffff" : "#0077B6"}
        />
      ) : (
        <Text className={textStyle}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

// Exportação default para o expo-router
export default Button;
