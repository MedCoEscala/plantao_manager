import React, { useState } from "react";
import { View, TextInput, Text, TextInputProps } from "react-native";
import { twMerge } from "tailwind-merge";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = false,
  className,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Estilo base para o container
  const containerStyle = twMerge("mb-4", fullWidth ? "w-full" : "", className);

  // Estilo para o input
  const inputStyle = twMerge(
    "border rounded-lg p-3 bg-white",
    isFocused ? "border-primary" : "border-gray-300",
    error ? "border-error" : ""
  );

  // Estilos para o label
  const labelStyle = twMerge(
    "text-sm mb-1",
    error ? "text-error" : "text-text-light"
  );

  // Estilos para mensagem de erro
  const errorStyle = "text-error text-xs mt-1";

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur && onBlur(e);
  };

  return (
    <View className={containerStyle}>
      {label && <Text className={labelStyle}>{label}</Text>}
      <TextInput
        className={inputStyle}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor="#A0AEC0"
        {...props}
      />
      {error && <Text className={errorStyle}>{error}</Text>}
    </View>
  );
};

// Exportação default para expo-router
export default Input;
