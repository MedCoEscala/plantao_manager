// app/components/ui/Input.tsx (modificado)
import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FieldWrapper } from '../form/FormField';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  leftIcon,
  rightIcon,
  onRightIconPress,
  required = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const inputContent = (
    <View
      className={`flex-row items-center overflow-hidden rounded-lg border
      ${error ? 'border-error' : isFocused ? 'border-primary' : 'border-gray-300'}
      ${props.multiline ? 'min-h-[100px]' : 'h-12'}`}>
      {leftIcon && (
        <View className="pl-3">
          <Ionicons name={leftIcon as any} size={20} color="#64748b" />
        </View>
      )}

      <TextInput
        className={`flex-1 px-3 text-text-dark ${leftIcon ? 'pl-2' : 'pl-3'}`}
        placeholderTextColor="#94a3b8"
        onFocus={handleFocus}
        onBlur={handleBlur}
        textAlignVertical={props.multiline ? 'top' : 'center'}
        {...props}
      />

      {rightIcon && (
        <TouchableOpacity className="pr-3" onPress={onRightIconPress} disabled={!onRightIconPress}>
          <Ionicons name={rightIcon as any} size={20} color="#64748b" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (!label) {
    return (
      <View className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {inputContent}
        {(error || helperText) && (
          <Text className={`mt-1 text-xs ${error ? 'text-error' : 'text-text-light'}`}>
            {error || helperText}
          </Text>
        )}
      </View>
    );
  }

  return (
    <FieldWrapper
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {inputContent}
    </FieldWrapper>
  );
};

export default Input;
