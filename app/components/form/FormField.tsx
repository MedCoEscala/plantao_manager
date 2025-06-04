// app/components/form/Field.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

export interface FieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FieldWrapper({
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  children,
}: FieldProps & { children: React.ReactNode }) {
  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <View className="mb-1.5 flex-row items-center">
          <Text className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-text-dark'}`}>
            {label}
          </Text>
          {required && <Text className="ml-0.5 text-error">*</Text>}
        </View>
      )}

      {children}

      {(error || helperText) && (
        <Text className={`mt-1 text-xs ${error ? 'text-error' : 'text-text-light'}`}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

// Default export para resolver warning do React Router
export default FieldWrapper;
