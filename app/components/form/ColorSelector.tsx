import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ColorOption {
  color: string;
  name?: string;
}

interface ColorSelectorProps {
  label?: string;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  colors: ColorOption[];
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
}

const DEFAULT_COLORS: ColorOption[] = [
  { color: '#0077B6', name: 'Azul' },
  { color: '#EF476F', name: 'Rosa' },
  { color: '#06D6A0', name: 'Verde-água' },
  { color: '#FFD166', name: 'Amarelo' },
  { color: '#073B4C', name: 'Azul escuro' },
  { color: '#118AB2', name: 'Azul claro' },
  { color: '#9381FF', name: 'Roxo' },
  { color: '#FF6B35', name: 'Laranja' },
];

const ColorSelector: React.FC<ColorSelectorProps> = ({
  label,
  selectedColor,
  onSelectColor,
  colors = DEFAULT_COLORS,
  required = false,
  error,
  helperText,
  disabled = false,
}) => {
  return (
    <View className="mb-4">
      {label && (
        <View className="mb-1.5 flex-row items-center">
          <Text className="text-sm font-medium text-gray-700">
            {label}
            {required && <Text className="text-error"> *</Text>}
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="py-2">
        <View className="flex-row space-x-3">
          {colors.map((colorOption) => (
            <TouchableOpacity
              key={colorOption.color}
              className={`h-12 w-12 items-center justify-center rounded-full ${
                disabled ? 'opacity-50' : ''
              }`}
              style={{ backgroundColor: colorOption.color }}
              onPress={() => !disabled && onSelectColor(colorOption.color)}
              disabled={disabled}>
              {selectedColor === colorOption.color && (
                <Ionicons
                  name="checkmark"
                  size={24}
                  color={isColorDark(colorOption.color) ? '#fff' : '#000'}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {(error || helperText) && (
        <Text className={`mt-1 text-xs ${error ? 'text-error' : 'text-gray-500'}`}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

function isColorDark(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');

  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance < 0.5;
}

export default ColorSelector;
