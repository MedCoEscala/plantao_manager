import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TimePickerModalProps {
  visible: boolean;
  title: string;
  initialTime: string;
  onConfirm: (time: string) => void;
  onCancel: () => void;
}

const { width } = Dimensions.get('window');

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  title,
  initialTime,
  onConfirm,
  onCancel,
}) => {
  const [selectedHour, setSelectedHour] = useState(() => {
    const [hour] = initialTime.split(':');
    return parseInt(hour, 10);
  });

  const [selectedMinute, setSelectedMinute] = useState(() => {
    const [, minute] = initialTime.split(':');
    return parseInt(minute, 10);
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i).filter((i) => i % 5 === 0);

  const handleConfirm = useCallback(() => {
    const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onConfirm(timeString);
  }, [selectedHour, selectedMinute, onConfirm]);

  const renderTimeSelector = (
    value: number,
    options: number[],
    onSelect: (value: number) => void,
    label: string
  ) => (
    <View className="flex-1">
      <Text className="mb-3 text-center text-base font-semibold text-gray-900">{label}</Text>
      <ScrollView
        className="h-48"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 20 }}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => onSelect(option)}
            className={`mx-2 mb-2 rounded-lg py-3 ${
              value === option ? 'bg-primary' : 'bg-gray-100'
            }`}>
            <Text
              className={`text-center text-lg font-medium ${
                value === option ? 'text-white' : 'text-gray-700'
              }`}>
              {option.toString().padStart(2, '0')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}>
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-200 px-6 py-4">
          <TouchableOpacity onPress={onCancel}>
            <Text className="text-base font-medium text-gray-600">Cancelar</Text>
          </TouchableOpacity>

          <Text className="text-lg font-bold text-gray-900">{title}</Text>

          <TouchableOpacity onPress={handleConfirm}>
            <Text className="text-base font-semibold text-primary">Confirmar</Text>
          </TouchableOpacity>
        </View>

        {/* Time Display */}
        <View className="items-center bg-gray-50 py-6">
          <View className="flex-row items-center">
            <View className="rounded-lg bg-white px-4 py-2 shadow-sm">
              <Text className="text-2xl font-bold text-primary">
                {selectedHour.toString().padStart(2, '0')}
              </Text>
            </View>
            <Text className="mx-3 text-2xl font-bold text-gray-400">:</Text>
            <View className="rounded-lg bg-white px-4 py-2 shadow-sm">
              <Text className="text-2xl font-bold text-primary">
                {selectedMinute.toString().padStart(2, '0')}
              </Text>
            </View>
          </View>
        </View>

        {/* Time Selectors */}
        <View className="flex-1 flex-row px-4">
          {renderTimeSelector(selectedHour, hours, setSelectedHour, 'Horas')}

          <View className="mx-4 w-px bg-gray-200" />

          {renderTimeSelector(selectedMinute, minutes, setSelectedMinute, 'Minutos')}
        </View>

        {/* Quick Time Buttons */}
        <View className="border-t border-gray-200 p-4">
          <Text className="mb-3 text-center text-sm font-medium text-gray-600">
            Horários comuns
          </Text>
          <View className="flex-row flex-wrap justify-center space-x-2">
            {[
              { hour: 8, minute: 0, label: '08:00' },
              { hour: 9, minute: 0, label: '09:00' },
              { hour: 12, minute: 0, label: '12:00' },
              { hour: 18, minute: 0, label: '18:00' },
              { hour: 20, minute: 0, label: '20:00' },
            ].map((time) => (
              <TouchableOpacity
                key={time.label}
                onPress={() => {
                  setSelectedHour(time.hour);
                  setSelectedMinute(time.minute);
                }}
                className="mb-2 rounded-lg border border-gray-300 px-4 py-2">
                <Text className="text-sm font-medium text-gray-700">{time.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
