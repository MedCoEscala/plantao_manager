import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { TouchableOpacity, Text, View, TouchableOpacityProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ModernButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onPress,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          colors: ['#18cb96', '#16a085'] as const,
          textColor: '#FFFFFF',
        };
      case 'secondary':
        return {
          colors: ['#3b82f6', '#1e40af'] as const,
          textColor: '#FFFFFF',
        };
      case 'success':
        return {
          colors: ['#10b981', '#059669'] as const,
          textColor: '#FFFFFF',
        };
      case 'warning':
        return {
          colors: ['#f59e0b', '#d97706'] as const,
          textColor: '#FFFFFF',
        };
      case 'danger':
        return {
          colors: ['#ef4444', '#dc2626'] as const,
          textColor: '#FFFFFF',
        };
      case 'outline':
        return {
          colors: ['#f8fafc', '#f1f5f9'] as const,
          textColor: '#374151',
          border: true,
        };
      default:
        return {
          colors: ['#18cb96', '#16a085'] as const,
          textColor: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: 'py-2 px-4',
          textSize: 'text-sm',
          iconSize: 16,
          height: 'h-10',
        };
      case 'md':
        return {
          padding: 'py-3 px-6',
          textSize: 'text-base',
          iconSize: 18,
          height: 'h-12',
        };
      case 'lg':
        return {
          padding: 'py-4 px-8',
          textSize: 'text-lg',
          iconSize: 20,
          height: 'h-14',
        };
      default:
        return {
          padding: 'py-3 px-6',
          textSize: 'text-base',
          iconSize: 18,
          height: 'h-12',
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const isDisabled = disabled || loading;

  const buttonClass = `
    overflow-hidden rounded-2xl shadow-lg
    ${fullWidth ? 'w-full' : ''}
    ${isDisabled ? 'opacity-50' : ''}
    ${className}
  `.trim();

  const contentClass = `
    flex-row items-center justify-center
    ${sizeStyles.padding}
    ${variantStyles.border ? 'border border-gray-200' : ''}
  `.trim();

  const textClass = `
    font-semibold
    ${sizeStyles.textSize}
    ${iconPosition === 'left' && icon ? 'ml-2' : ''}
    ${iconPosition === 'right' && icon ? 'mr-2' : ''}
  `.trim();

  const renderIcon = () => {
    if (loading) {
      return (
        <View className="mr-2 animate-spin">
          <Ionicons
            name="refresh-outline"
            size={sizeStyles.iconSize}
            color={variantStyles.textColor}
          />
        </View>
      );
    }

    if (icon) {
      return <Ionicons name={icon} size={sizeStyles.iconSize} color={variantStyles.textColor} />;
    }

    return null;
  };

  return (
    <TouchableOpacity
      className={buttonClass}
      onPress={isDisabled ? undefined : onPress}
      activeOpacity={isDisabled ? 1 : 0.9}
      {...props}>
      <LinearGradient
        colors={variantStyles.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className={contentClass}>
        {iconPosition === 'left' && renderIcon()}
        <Text className={textClass} style={{ color: variantStyles.textColor }}>
          {title}
        </Text>
        {iconPosition === 'right' && renderIcon()}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default ModernButton;
