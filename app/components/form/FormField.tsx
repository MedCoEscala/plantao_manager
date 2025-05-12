// app/components/form/Field.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export function FieldWrapper({
  label,
  error,
  helperText,
  required = false,
  className = '',
  children,
}: FieldProps & { children: React.ReactNode }) {
  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <View className="mb-1.5 flex-row items-center">
          <Text className="text-sm font-medium text-text-dark">{label}</Text>
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
