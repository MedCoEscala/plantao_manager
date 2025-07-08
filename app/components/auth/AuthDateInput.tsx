import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface AuthDateInputProps {
  label?: string;
  value: string | null;
  onPress: () => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
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
  rightIcon: {
    marginLeft: 'auto',
  },
  valueText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    minHeight: Platform.OS === 'android' ? 52 : 48,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'center',
    includeFontPadding: Platform.OS === 'android' ? false : undefined,
    lineHeight: Platform.OS === 'android' ? 20 : 20,
    marginRight: 8,
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    minHeight: Platform.OS === 'android' ? 52 : 48,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'center',
    includeFontPadding: Platform.OS === 'android' ? false : undefined,
    lineHeight: Platform.OS === 'android' ? 20 : 20,
    marginRight: 8,
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
});

export default function AuthDateInput({
  label,
  value,
  onPress,
  placeholder = 'Selecionar data',
  error,
  helperText,
  required = false,
  disabled = false,
}: AuthDateInputProps) {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={{ color: '#FF3B30' }}>*</Text>}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.inputWrapper,
          error && styles.inputError,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Ionicons name="calendar-outline" size={20} color={error ? '#FF3B30' : '#18cb96'} style={styles.leftIcon} />
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" style={styles.rightIcon} />
      </TouchableOpacity>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
} 