import React from 'react';
import { View, ViewProps, Platform } from 'react-native';

import { cn } from '../../utils/cn';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const elevatedStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  android: {
    elevation: 4,
  },
});

export default function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  className,
  style,
  ...props
}: CardProps) {
  const baseStyles = 'bg-white rounded-2xl';

  const variantStyles = {
    default: '',
    outlined: 'border border-gray-200',
    elevated: '',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <View
      className={cn(baseStyles, variantStyles[variant], paddingStyles[padding], className)}
      style={[variant === 'elevated' && elevatedStyle, style]}
      {...props}>
      {children}
    </View>
  );
}
