import React from 'react';
import { View, ViewProps } from 'react-native';

import { cn } from '../../utils/cn';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  className,
  ...props
}: CardProps) {
  const baseStyles = 'bg-white rounded-2xl';

  const variantStyles = {
    default: '',
    outlined: 'border border-gray-200',
    elevated: 'shadow-sm shadow-gray-100',
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
      {...props}>
      {children}
    </View>
  );
}
