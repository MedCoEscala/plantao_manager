// app/components/form/ColorField.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FieldWrapper } from './FormField';

interface ColorOption {
  color: string;
  name: string;
}

export interface ColorFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: ColorOption[];
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ColorField({
  label,
  value,
  onValueChange,
  options,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
}: ColorFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedColor = options.find((option) => option.color === value);

  return (
    <FieldWrapper
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      className={className}>
      <TouchableOpacity
        className={`h-12 flex-row items-center justify-between rounded-lg border ${
          disabled ? 'border-gray-200 bg-gray-100 opacity-70' : 'border-gray-300'
        } px-3`}
        onPress={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}>
        <View className="flex-row items-center">
          <View
            className="mr-2 h-6 w-6 rounded-full"
            style={{ backgroundColor: value || '#CCCCCC' }}
          />
          <Text className={`${disabled ? 'text-gray-400' : 'text-text-dark'}`}>
            {selectedColor?.name || 'Selecione uma cor'}
          </Text>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={disabled ? '#a0aec0' : '#64748b'}
        />
      </TouchableOpacity>

      {isOpen && !disabled && (
        <View className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row flex-wrap">
              {options.map((option) => (
                <TouchableOpacity
                  key={option.color}
                  className="m-1"
                  onPress={() => {
                    onValueChange(option.color);
                    setIsOpen(false);
                  }}>
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-full border-2 ${
                      option.color === value ? 'border-text-dark' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: option.color }}>
                    {option.color === value && (
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </FieldWrapper>
  );
}

export default ColorField;
