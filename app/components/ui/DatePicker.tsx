import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal } from 'react-native';

interface DatePickerProps {
  label?: string;
  placeholder?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
  fullWidth?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  placeholder = 'Selecionar data',
  value,
  onChange,
  minimumDate,
  maximumDate = new Date(),
  error,
  fullWidth = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date());

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        onChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempDate(value || new Date());
    setShowPicker(false);
  };

  const handleClear = () => {
    onChange(null);
    setShowPicker(false);
  };

  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return placeholder;
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <View className={fullWidth ? 'w-full' : ''}>
      {label && <Text className="mb-2 text-sm font-medium text-gray-700">{label}</Text>}

      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className={`flex-row items-center justify-between rounded-lg border px-3 py-3 ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
        }`}>
        <View className="flex-1 flex-row items-center">
          <Ionicons name="calendar-outline" size={20} color="#666" style={{ marginRight: 8 }} />
          <Text className={`flex-1 ${value ? 'text-gray-800' : 'text-gray-400'}`} numberOfLines={1}>
            {formatDisplayDate(value)}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      {error && <Text className="mt-1 text-sm text-red-600">{error}</Text>}

      {/* Android DatePicker */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {/* iOS DatePicker Modal */}
      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide" onRequestClose={handleCancel}>
          <View className="flex-1 justify-end bg-black/50">
            <View className="rounded-t-xl bg-white">
              {/* Header */}
              <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
                <TouchableOpacity onPress={handleCancel}>
                  <Text className="font-medium text-blue-600">Cancelar</Text>
                </TouchableOpacity>

                <Text className="text-lg font-semibold text-gray-900">
                  {label || 'Selecionar Data'}
                </Text>

                <TouchableOpacity onPress={handleConfirm}>
                  <Text className="font-medium text-blue-600">Confirmar</Text>
                </TouchableOpacity>
              </View>

              {/* DatePicker */}
              <View className="p-4">
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  locale="pt-BR"
                />
              </View>

              {/* Actions */}
              <View className="border-t border-gray-200 p-4">
                <TouchableOpacity
                  onPress={handleClear}
                  className="flex-row items-center justify-center py-3">
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color="#ef4444"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="font-medium text-red-500">Limpar Data</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default DatePicker;
