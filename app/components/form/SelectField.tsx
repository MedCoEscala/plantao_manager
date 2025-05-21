// app/components/form/SelectField.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FieldWrapper } from './FormField';

interface SelectOption {
  label: string;
  value: string;
  icon?: string;
  color?: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  isLoading?: boolean;
}

export function SelectField({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Selecione uma opção',
  error,
  helperText,
  required = false,
  className = '',
  isLoading = false,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <FieldWrapper
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      className={className}>
      <TouchableOpacity
        className={`h-12 flex-row items-center justify-between rounded-lg border px-3
          ${error ? 'border-error' : 'border-gray-300'}
        `}
        onPress={() => setIsOpen(!isOpen)}
        disabled={isLoading}>
        <View className="flex-row items-center">
          {selectedOption?.icon && !isLoading && (
            <Ionicons
              name={selectedOption.icon as any}
              size={20}
              color={selectedOption.color || '#64748b'}
              style={{ marginRight: 8 }}
            />
          )}
          {isLoading ? (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#18cb96" style={{ marginRight: 8 }} />
              <Text className="text-gray-400">Carregando...</Text>
            </View>
          ) : (
            <Text className={value ? 'text-text-dark' : 'text-gray-400'}>
              {selectedOption ? selectedOption.label : placeholder}
            </Text>
          )}
        </View>
        {!isLoading && (
          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
        )}
      </TouchableOpacity>

      {isOpen && !isLoading && (
        <View className="z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-sm">
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              className={`flex-row items-center border-b border-gray-100 p-3 ${
                option.value === value ? 'bg-gray-50' : ''
              }`}
              onPress={() => {
                onValueChange(option.value);
                setIsOpen(false);
              }}>
              {option.icon && (
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={option.color || '#64748b'}
                  style={{ marginRight: 8 }}
                />
              )}
              <Text
                className={`flex-1 ${option.value === value ? 'font-medium text-primary' : 'text-text-dark'}`}>
                {option.label}
              </Text>
              {option.value === value && <Ionicons name="checkmark" size={20} color="#18cb96" />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </FieldWrapper>
  );
}

export default SelectField;
