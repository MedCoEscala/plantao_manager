import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value: string;
  onSelect: (value: string) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  fullWidth?: boolean;
}

const Select: React.FC<SelectProps> = ({
  label,
  placeholder = 'Selecione uma opção',
  options,
  value,
  onSelect,
  icon,
  error,
  fullWidth = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (selectedValue: string) => {
    onSelect(selectedValue);
    setIsVisible(false);
  };

  return (
    <View className={fullWidth ? 'w-full' : ''}>
      {label && <Text className="mb-2 text-sm font-medium text-gray-700">{label}</Text>}

      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        className={`flex-row items-center justify-between rounded-lg border px-3 py-3 ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
        }`}>
        <View className="flex-1 flex-row items-center">
          {icon && <Ionicons name={icon} size={20} color="#666" style={{ marginRight: 8 }} />}
          <Text
            className={`flex-1 ${selectedOption ? 'text-gray-800' : 'text-gray-400'}`}
            numberOfLines={1}>
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      {error && <Text className="mt-1 text-sm text-red-600">{error}</Text>}

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}>
        <TouchableOpacity
          className="flex-1 justify-center bg-black/50 px-4"
          activeOpacity={1}
          onPress={() => setIsVisible(false)}>
          <TouchableOpacity
            className="max-h-96 rounded-xl bg-white"
            activeOpacity={1}
            onPress={() => {}}>
            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
              <Text className="text-lg font-semibold text-gray-900">{label || 'Selecione'}</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)} className="p-1">
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item.value)}
                  className={`px-4 py-3 ${
                    index !== options.length - 1 ? 'border-b border-gray-100' : ''
                  }`}>
                  <Text
                    className={`text-base ${
                      value === item.value ? 'font-medium text-blue-600' : 'text-gray-800'
                    }`}>
                    {item.label}
                  </Text>
                  {value === item.value && (
                    <View className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Ionicons name="checkmark" size={20} color="#2563eb" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Select;
