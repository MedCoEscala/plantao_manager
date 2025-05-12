// app/components/form/SwitchField.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FieldWrapper } from './FormField';

interface SwitchFieldProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  error?: string;
  helperText?: string;
  className?: string;
}

export function SwitchField({
  label,
  value,
  onValueChange,
  error,
  helperText,
  className = '',
}: SwitchFieldProps) {
  return (
    <FieldWrapper label="" error={error} helperText={helperText} className={className}>
      <TouchableOpacity
        className="flex-row items-center py-2"
        onPress={() => onValueChange(!value)}>
        <View
          className={`h-6 w-12 rounded-full ${value ? 'bg-primary' : 'bg-gray-300'} justify-center px-0.5`}>
          <View className={`h-5 w-5 rounded-full bg-white shadow ${value ? 'ml-6' : 'ml-0'}`} />
        </View>
        <Text className="ml-3 text-text-dark">{label}</Text>
      </TouchableOpacity>
    </FieldWrapper>
  );
}

export default SwitchField;
