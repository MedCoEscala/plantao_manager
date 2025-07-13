import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from 'react-native-modal-datetime-picker';

interface BaseFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  className?: string;
}

export interface TextFieldProps extends BaseFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  helperText,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  autoCapitalize = 'none',
  leftIcon,
  rightIcon,
  onRightIconPress,
  className = '',
}: TextFieldProps) {
  return (
    <View className={`mb-4 ${className}`}>
      <View className="mb-1.5 flex-row items-center">
        <Text className="text-sm font-medium text-text-dark">{label}</Text>
        {required && <Text className="ml-0.5 text-error">*</Text>}
      </View>

      <View
        className={`flex-row items-center overflow-hidden rounded-lg border border-gray-300 bg-white ${error ? 'border-error' : 'border-gray-300'} ${multiline ? 'h-32 py-2' : 'h-12'}`}>
        {leftIcon && (
          <View className="pl-3">
            <Ionicons name={leftIcon as any} size={20} color="#64748b" />
          </View>
        )}

        <TextInput
          className={`flex-1 px-3 text-text-dark ${leftIcon ? 'pl-2' : 'pl-3'}`}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          autoCapitalize={autoCapitalize}
          textAlignVertical={multiline ? 'top' : 'center'}
        />

        {rightIcon && (
          <TouchableOpacity
            className="pr-3"
            onPress={onRightIconPress}
            disabled={!onRightIconPress}>
            <Ionicons name={rightIcon as any} size={20} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {(error || helperText) && (
        <Text className={`mt-1 text-xs ${error ? 'text-error' : 'text-text-light'}`}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

export interface DateFieldProps extends BaseFieldProps {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  mode?: 'date' | 'time' | 'datetime';
  minDate?: Date;
  maxDate?: Date;
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Selecione uma data',
  error,
  required = false,
  helperText,
  mode = 'date',
  minDate,
  maxDate,
  className = '',
}: DateFieldProps) {
  const [isPickerVisible, setPickerVisible] = useState(false);

  const formatDisplayValue = () => {
    if (!value) return '';

    switch (mode) {
      case 'date':
        return format(value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      case 'time':
        return format(value, 'HH:mm', { locale: ptBR });
      case 'datetime':
        return format(value, 'dd/MM/yyyy HH:mm', { locale: ptBR });
      default:
        return value.toISOString();
    }
  };

  return (
    <View className={`mb-4 ${className}`}>
      <View className="mb-1.5 flex-row items-center">
        <Text className="text-sm font-medium text-text-dark">{label}</Text>
        {required && <Text className="ml-0.5 text-error">*</Text>}
      </View>

      <TouchableOpacity
        className={`h-12 flex-row items-center justify-between rounded-lg border px-3 ${error ? 'border-error' : 'border-gray-300'} `}
        onPress={() => setPickerVisible(true)}>
        <Text className={value ? 'text-text-dark' : 'text-gray-400'}>
          {value ? formatDisplayValue() : placeholder}
        </Text>
        <Ionicons
          name={mode === 'time' ? 'time-outline' : 'calendar-outline'}
          size={20}
          color="#64748b"
        />
      </TouchableOpacity>

      <DateTimePicker
        isVisible={isPickerVisible}
        mode={mode}
        date={value || new Date()}
        onConfirm={(date) => {
          onChange(date);
          setPickerVisible(false);
        }}
        onCancel={() => setPickerVisible(false)}
        minimumDate={minDate}
        maximumDate={maxDate}
      />

      {(error || helperText) && (
        <Text className={`mt-1 text-xs ${error ? 'text-error' : 'text-text-light'}`}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

export interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string; icon?: string; color?: string }[];
  placeholder?: string;
}

export function SelectField({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Selecione uma opção',
  error,
  required = false,
  helperText,
  className = '',
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <View className={`mb-4 ${className}`}>
      <View className="mb-1.5 flex-row items-center">
        <Text className="text-sm font-medium text-text-dark">{label}</Text>
        {required && <Text className="ml-0.5 text-error">*</Text>}
      </View>

      <TouchableOpacity
        className={`h-12 flex-row items-center justify-between rounded-lg border px-3 ${error ? 'border-error' : 'border-gray-300'} `}
        onPress={() => setIsOpen(!isOpen)}>
        <View className="flex-row items-center">
          {selectedOption?.icon && (
            <Ionicons
              name={selectedOption.icon as any}
              size={20}
              color={selectedOption.color || '#64748b'}
              style={{ marginRight: 8 }}
            />
          )}
          <Text className={value ? 'text-text-dark' : 'text-gray-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
        </View>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
      </TouchableOpacity>

      {isOpen && (
        <View className="mt-1 rounded-lg border border-gray-200 bg-white shadow-sm">
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

      {(error || helperText) && (
        <Text className={`mt-1 text-xs ${error ? 'text-error' : 'text-text-light'}`}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

export interface SwitchFieldProps extends BaseFieldProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
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
    <View className={`mb-4 ${className}`}>
      <TouchableOpacity className="flex-row items-center" onPress={() => onValueChange(!value)}>
        <View
          className={`h-6 w-12 rounded-full ${value ? 'bg-primary' : 'bg-gray-300'} justify-center px-0.5`}>
          <View className={`h-5 w-5 rounded-full bg-white shadow ${value ? 'ml-6' : 'ml-0'}`} />
        </View>
        <Text className="ml-3 text-text-dark">{label}</Text>
      </TouchableOpacity>

      {(error || helperText) && (
        <Text className={`mt-1 text-xs ${error ? 'text-error' : 'text-text-light'}`}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

export interface ColorFieldProps extends BaseFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { color: string; name: string }[];
}

export function ColorField({
  label,
  value,
  onValueChange,
  options,
  error,
  required = false,
  helperText,
  className = '',
}: ColorFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedColor = options.find((option) => option.color === value);

  return (
    <View className={`mb-4 ${className}`}>
      <View className="mb-1.5 flex-row items-center">
        <Text className="text-sm font-medium text-text-dark">{label}</Text>
        {required && <Text className="ml-0.5 text-error">*</Text>}
      </View>

      <TouchableOpacity
        className="h-12 flex-row items-center justify-between rounded-lg border border-gray-300 px-3"
        onPress={() => setIsOpen(!isOpen)}>
        <View className="flex-row items-center">
          <View
            className="mr-2 h-6 w-6 rounded-full"
            style={{ backgroundColor: value || '#CCCCCC' }}
          />
          <Text className="text-text-dark">{selectedColor?.name || 'Selecione uma cor'}</Text>
        </View>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
      </TouchableOpacity>

      {isOpen && (
        <View className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3">
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
        </View>
      )}

      {(error || helperText) && (
        <Text className={`mt-1 text-xs ${error ? 'text-error' : 'text-text-light'}`}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

export interface ButtonGroupProps extends BaseFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
}

export function ButtonGroup({
  label,
  value,
  onValueChange,
  options,
  error,
  required = false,
  helperText,
  className = '',
}: ButtonGroupProps) {
  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <View className="mb-1.5 flex-row items-center">
          <Text className="text-sm font-medium text-text-dark">{label}</Text>
          {required && <Text className="ml-0.5 text-error">*</Text>}
        </View>
      )}

      <View className="flex-row flex-wrap">
        {options.map((option, index) => (
          <TouchableOpacity
            key={option.value}
            className={`mb-2 mr-2 rounded-full border px-4 py-2 ${
              option.value === value ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
            }`}
            onPress={() => onValueChange(option.value)}>
            <Text className={option.value === value ? 'font-medium text-white' : 'text-text-dark'}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {(error || helperText) && (
        <Text className={`mt-1 text-xs ${error ? 'text-error' : 'text-text-light'}`}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

// Default export para resolver warning do React Router
const FormFields = {
  TextField,
  DateField,
  SelectField,
  SwitchField,
  ColorField,
  ButtonGroup,
};

export default FormFields;
