import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  TextInputProps,
  StyleSheet,
  Platform,
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
  showPasswordStrength?: boolean;
}

const calculatePasswordStrength = (password: string) => {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) {
    score += 25;
  } else {
    feedback.push('Mín. 8 caracteres');
  }

  if (/[a-z]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Letra minúscula');
  }

  if (/[A-Z]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Letra maiúscula');
  }

  if (/[0-9]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Número');
  }

  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Caractere especial');
  }

  return { score, feedback };
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: Platform.OS === 'android' ? '#F9FAFB' : 'rgba(120,120,128,0.05)',
    minHeight: 52,
    paddingHorizontal: 12,
    borderColor: '#D1D5DB',
  },
  inputFocused: {
    borderColor: '#18cb96',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  leftIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    paddingVertical: 0,
    minHeight: Platform.OS === 'android' ? 52 : 48,
    textAlignVertical: 'center',
    includeFontPadding: Platform.OS === 'android' ? false : undefined,
    lineHeight: 20,
    marginRight: 8,
  },
  rightIconTouchable: {
    padding: 8,
    borderRadius: 20,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginTop: 5,
    marginLeft: 2,
    fontWeight: '500',
  },
  helperText: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 4,
    marginLeft: 2,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#e5e5e5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthProgress: {
    height: '100%',
    borderRadius: 2,
  },
  strengthFeedback: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  strengthItem: {
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  strengthItemMet: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  strengthItemUnmet: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  strengthWeak: {
    color: '#dc2626',
  },
  strengthFair: {
    color: '#ea580c',
  },
  strengthGood: {
    color: '#ca8a04',
  },
  strengthStrong: {
    color: '#16a34a',
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
  showPasswordStrength = false,
  ...props
}: AuthInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const showPasswordToggle = secureTextEntry;
  const finalRightIcon = showPasswordToggle ? (isPasswordVisible ? 'eye-off' : 'eye') : rightIcon;
  const finalRightIconPress = showPasswordToggle
    ? () => setIsPasswordVisible((prev) => !prev)
    : onRightIconPress;

  const inputStyles = [
    styles.inputWrapper,
    isFocused && styles.inputFocused,
    error && styles.inputError,
  ];

  const passwordStrength =
    showPasswordStrength && secureTextEntry && value ? calculatePasswordStrength(value) : null;

  const getStrengthColor = (score: number) => {
    if (score < 25) return '#dc2626';
    if (score < 50) return '#ea580c';
    if (score < 75) return '#ca8a04';
    return '#16a34a';
  };

  const getStrengthLabel = (score: number) => {
    if (score < 25) return 'Muito fraca';
    if (score < 50) return 'Fraca';
    if (score < 75) return 'Boa';
    return 'Forte';
  };

  const getStrengthLabelStyle = (score: number) => {
    if (score < 25) return styles.strengthWeak;
    if (score < 50) return styles.strengthFair;
    if (score < 75) return styles.strengthGood;
    return styles.strengthStrong;
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={{ color: '#FF3B30' }}>*</Text>}
        </Text>
      )}
      <View style={inputStyles}>
        {leftIcon && (
          <Ionicons
            name={leftIcon as any}
            size={20}
            color={error ? '#FF3B30' : isFocused ? '#18cb96' : '#6B7280'}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        {finalRightIcon && (
          <TouchableOpacity
            style={styles.rightIconTouchable}
            onPress={finalRightIconPress}
            disabled={!finalRightIconPress || disabled}
            activeOpacity={0.7}>
            <Ionicons
              name={finalRightIcon as any}
              size={20}
              color={error ? '#FF3B30' : isFocused ? '#18cb96' : '#6B7280'}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}

      {passwordStrength && !error && (
        <View style={styles.strengthContainer}>
          <Text style={[styles.strengthLabel, getStrengthLabelStyle(passwordStrength.score)]}>
            Força da senha: {getStrengthLabel(passwordStrength.score)}
          </Text>

          <View style={styles.strengthBar}>
            <View
              style={[
                styles.strengthProgress,
                {
                  width: `${Math.max(passwordStrength.score, 10)}%`,
                  backgroundColor: getStrengthColor(passwordStrength.score),
                },
              ]}
            />
          </View>

          {passwordStrength.feedback.length > 0 && (
            <View style={styles.strengthFeedback}>
              {passwordStrength.feedback.map((item, index) => (
                <Text key={index} style={[styles.strengthItem, styles.strengthItemUnmet]}>
                  {item}
                </Text>
              ))}
            </View>
          )}

          {passwordStrength.score >= 75 && (
            <View style={styles.strengthFeedback}>
              <Text style={[styles.strengthItem, styles.strengthItemMet]}>✓ Senha forte</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
