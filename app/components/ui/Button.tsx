import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'default';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  title?: string;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  size = 'md',
  fullWidth = false,
  children,
  title,
  className = '',
  disabled,
  ...props
}) => {
  // Função para gerar as classes CSS com base nas props
  const getButtonClasses = () => {
    let classes = 'rounded-xl items-center justify-center ';

    // Variantes
    switch (variant) {
      case 'primary':
        classes += 'bg-primary ';
        break;
      case 'secondary':
        classes += 'bg-secondary ';
        break;
      case 'outline':
        classes += 'bg-transparent border border-primary ';
        break;
      case 'ghost':
        classes += 'bg-transparent ';
        break;
    }

    // Tamanhos
    switch (size) {
      case 'sm':
        classes += 'py-1 px-3 ';
        break;
      case 'md':
        classes += 'py-2 px-4 ';
        break;
      case 'lg':
        classes += 'py-3 px-6 ';
        break;
    }

    // Largura total
    if (fullWidth) {
      classes += 'w-full ';
    }

    // Estado desabilitado
    if (disabled || loading) {
      classes += 'opacity-60 ';
    }

    return classes + className;
  };

  // Função para gerar as classes do texto com base nas props
  const getTextClasses = () => {
    let classes = 'font-medium ';

    // Tamanho do texto
    switch (size) {
      case 'sm':
        classes += 'text-sm ';
        break;
      case 'md':
        classes += 'text-base ';
        break;
      case 'lg':
        classes += 'text-lg ';
        break;
    }

    // Cor do texto
    switch (variant) {
      case 'primary':
        classes += 'text-white ';
        break;
      case 'secondary':
        classes += 'text-text-dark ';
        break;
      case 'outline':
      case 'ghost':
        classes += 'text-primary ';
        break;
    }

    return classes;
  };

  return (
    <TouchableOpacity className={getButtonClasses()} disabled={disabled || loading} {...props}>
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#ffffff' : '#18cb96'} />
      ) : (
        <Text className={getTextClasses()}>{title || children}</Text>
      )}
    </TouchableOpacity>
  );
};

// Exportação default para o expo-router
export default Button;
