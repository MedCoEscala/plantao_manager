import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  TextInputProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface AuthInputProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  required?: boolean;
  disabled?: boolean;
  secureTextEntry?: boolean;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  required: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'rgba(120, 120, 128, 0.05)',
    minHeight: 52,
  },
  inputContainerNormal: {
    borderColor: 'rgba(120, 120, 128, 0.3)',
  },
  inputContainerFocused: {
    borderColor: '#18cb96',
    backgroundColor: 'rgba(24, 203, 150, 0.05)',
  },
  inputContainerError: {
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
  },
  inputContainerDisabled: {
    opacity: 0.5,
  },
  inputContainerMultiline: {
    minHeight: 100,
    alignItems: 'flex-start',
  },
  leftIconContainer: {
    paddingLeft: 16,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    paddingVertical: 16,
  },
  textInputWithLeftIcon: {
    paddingLeft: 8,
  },
  rightIconContainer: {
    paddingRight: 16,
  },
  errorContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
  },
  helperText: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(60, 60, 67, 0.7)',
  },
});

export default function AuthInput({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  required = false,
  disabled = false,
  secureTextEntry = false,
  ...props
}: AuthInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const finalRightIcon = secureTextEntry ? (isPasswordVisible ? 'eye-off' : 'eye') : rightIcon;
  const finalRightIconPress = secureTextEntry ? togglePasswordVisibility : onRightIconPress;

  const getInputContainerStyle = (): ViewStyle[] => {
    const containerStyles: ViewStyle[] = [styles.inputContainer];

    if (error) {
      containerStyles.push(styles.inputContainerError);
    } else if (isFocused) {
      containerStyles.push(styles.inputContainerFocused);
    } else {
      containerStyles.push(styles.inputContainerNormal);
    }

    if (disabled) {
      containerStyles.push(styles.inputContainerDisabled);
    }

    if (props.multiline) {
      containerStyles.push(styles.inputContainerMultiline);
    }

    return containerStyles;
  };

  const getIconColor = () => {
    if (disabled) return 'rgba(60, 60, 67, 0.3)';
    if (error) return '#FF3B30';
    if (isFocused) return '#18cb96';
    return 'rgba(60, 60, 67, 0.6)';
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}

      {/* Input Container */}
      <View style={getInputContainerStyle()}>
        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Ionicons name={leftIcon as any} size={20} color={getIconColor()} />
          </View>
        )}

        {/* Text Input */}
        <TextInput
          style={[styles.textInput, leftIcon && styles.textInputWithLeftIcon]}
          placeholder={placeholder}
          placeholderTextColor="rgba(60, 60, 67, 0.6)"
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          textAlignVertical={props.multiline ? 'top' : 'center'}
          editable={!disabled}
          {...props}
        />

        {/* Right Icon */}
        {finalRightIcon && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={finalRightIconPress}
            disabled={!finalRightIconPress || disabled}
            activeOpacity={0.7}>
            <Ionicons name={finalRightIcon as any} size={20} color={getIconColor()} />
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Helper Text */}
      {!error && helperText && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
}
