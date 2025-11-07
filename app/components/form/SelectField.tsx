// app/components/form/SelectField.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';

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
  const [dropdownLayout, setDropdownLayout] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<TouchableOpacity>(null);
  const isMountedRef = useRef(true);

  const safeOptions = options || [];
  const selectedOption = safeOptions.find((option) => option.value === value);

  // Cleanup ao desmontar
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      setIsOpen(false);
    };
  }, []);

  const handleOpen = () => {
    if (!isLoading && buttonRef.current && isMountedRef.current) {
      buttonRef.current.measureInWindow((x, y, width, height) => {
        // Validar se as coordenadas são válidas e o componente ainda está montado
        if (isMountedRef.current && y > 0 && height > 0 && width > 0) {
          setDropdownLayout({
            top: y + height + 4,
            left: x,
            width: width,
          });
          setIsOpen(true);
        }
      });
    }
  };

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <>
      <FieldWrapper
        label={label}
        error={error}
        helperText={helperText}
        required={required}
        className={className}>
        <TouchableOpacity
          ref={buttonRef}
          className={`h-12 flex-row items-center justify-between rounded-lg border px-3 ${error ? 'border-error' : 'border-gray-300'} bg-white`}
          onPress={handleOpen}
          disabled={isLoading}>
          <View className="flex-1 flex-row items-center">
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
              <Text className={value ? 'text-text-dark' : 'text-gray-400'} numberOfLines={1}>
                {selectedOption ? selectedOption.label : placeholder}
              </Text>
            )}
          </View>
          {!isLoading && (
            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
          )}
        </TouchableOpacity>
      </FieldWrapper>

      {/* Dropdown posicionado logo abaixo do campo */}
      {isOpen && !isLoading && (
        <Modal visible={true} transparent animationType="none" onRequestClose={() => setIsOpen(false)}>
          <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
            <View style={{ flex: 1 }}>
              <TouchableWithoutFeedback>
                <View
                  style={{
                    position: 'absolute',
                    top: dropdownLayout.top,
                    left: dropdownLayout.left,
                    width: dropdownLayout.width,
                    backgroundColor: '#ffffff',
                    borderRadius: 8,
                    maxHeight: 240,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 5,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                  }}>
                  <ScrollView
                    style={{ maxHeight: 240 }}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}>
                    {safeOptions.map((item, index) => (
                      <TouchableOpacity
                        key={item.value}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          backgroundColor: item.value === value ? '#f0fdf4' : '#ffffff',
                          borderBottomWidth: index < safeOptions.length - 1 ? 1 : 0,
                          borderBottomColor: '#f3f4f6',
                        }}
                        onPress={() => handleSelect(item.value)}>
                        {item.icon && (
                          <Ionicons
                            name={item.icon as any}
                            size={20}
                            color={item.color || '#64748b'}
                            style={{ marginRight: 8 }}
                          />
                        )}
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 14,
                            color: item.value === value ? '#18cb96' : '#1e293b',
                            fontWeight: item.value === value ? '600' : '400',
                          }}>
                          {item.label}
                        </Text>
                        {item.value === value && (
                          <Ionicons name="checkmark-circle" size={18} color="#18cb96" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </>
  );
}

export default SelectField;
