import React, { useState } from "react";
import { View, TextInput, Text, TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  onFocus?: (e: any) => void;
  onBlur?: (e: any) => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = false,
  className = "",
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Função para gerar as classes do container
  const getContainerClasses = () => {
    let classes = "mb-4 ";

    if (fullWidth) {
      classes += "w-full ";
    }

    return classes + className;
  };

  // Função para gerar as classes do input
  const getInputClasses = () => {
    let classes = "border rounded-lg p-3 bg-white ";

    if (isFocused) {
      classes += "border-primary ";
    } else {
      classes += "border-gray-300 ";
    }

    if (error) {
      classes += "border-error ";
    }

    return classes;
  };

  // Função para gerar as classes do label
  const getLabelClasses = () => {
    let classes = "text-sm mb-1 ";

    if (error) {
      classes += "text-error ";
    } else {
      classes += "text-text-light ";
    }

    return classes;
  };

  // Função para gerar as classes da mensagem de erro
  const getErrorClasses = () => {
    return "text-error text-xs mt-1";
  };

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur && onBlur(e);
  };

  return (
    <View className={getContainerClasses()}>
      {label && <Text className={getLabelClasses()}>{label}</Text>}
      <TextInput
        className={getInputClasses()}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor="#A0AEC0"
        {...props}
      />
      {error && <Text className={getErrorClasses()}>{error}</Text>}
    </View>
  );
};

// Exportação default para expo-router
export default Input;
