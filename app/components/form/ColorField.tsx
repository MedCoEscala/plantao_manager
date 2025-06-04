import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

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
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedColor = options.find((option) => option.color === value);

  const handleColorSelect = (color: string) => {
    onValueChange(color);
    setIsExpanded(false);
  };

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      {/* Label */}
      <View style={styles.labelContainer}>
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      {/* Current Selection */}
      <TouchableOpacity
        style={[
          styles.selector,
          error ? styles.selectorError : styles.selectorNormal,
          disabled && styles.selectorDisabled,
        ]}
        onPress={() => !disabled && setIsExpanded(!isExpanded)}
        disabled={disabled}
        activeOpacity={0.7}>
        <View style={styles.selectorContent}>
          <View style={styles.colorPreview}>
            <View style={[styles.colorCircle, { backgroundColor: value || '#CCCCCC' }]} />
            <Text style={[styles.colorName, disabled && styles.colorNameDisabled]}>
              {selectedColor?.name || 'Selecione uma cor'}
            </Text>
          </View>

          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={disabled ? '#a0aec0' : '#64748b'}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && !disabled && (
        <View style={styles.colorGrid}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.gridContainer}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.color}
                  style={[styles.colorOption, index % 4 !== 3 && styles.colorOptionMargin]}
                  onPress={() => handleColorSelect(option.color)}
                  activeOpacity={0.7}>
                  <View
                    style={[
                      styles.colorOptionCircle,
                      { backgroundColor: option.color },
                      option.color === value && styles.selectedColorOption,
                    ]}>
                    {option.color === value && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color="#FFFFFF"
                        style={styles.checkmark}
                      />
                    )}
                  </View>

                  <Text style={styles.colorOptionName} numberOfLines={1}>
                    {option.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Helper Text / Error */}
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>{error || helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  disabled: {
    opacity: 0.7,
  },
  labelContainer: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  labelDisabled: {
    color: '#9CA3AF',
  },
  required: {
    color: '#EF4444',
  },
  selector: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectorNormal: {
    borderColor: '#D1D5DB',
  },
  selectorError: {
    borderColor: '#EF4444',
  },
  selectorDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  colorName: {
    fontSize: 16,
    color: '#374151',
  },
  colorNameDisabled: {
    color: '#9CA3AF',
  },
  colorGrid: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    maxHeight: 200,
  },
  scrollContent: {
    padding: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorOptionMargin: {
    marginRight: '4%',
  },
  colorOptionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedColorOption: {
    borderColor: '#374151',
    borderWidth: 3,
  },
  checkmark: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  colorOptionName: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  errorText: {
    color: '#EF4444',
  },
});

export default ColorField;
