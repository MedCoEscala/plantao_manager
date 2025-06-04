import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';

interface MonthYearPickerProps {
  visible: boolean;
  currentDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
  minDate?: Date;
  maxDate?: Date;
}

const months = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export default function MonthYearPicker({
  visible,
  currentDate,
  onSelect,
  onClose,
  minDate,
  maxDate,
}: MonthYearPickerProps) {
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());

  // Gerar array de anos (últimos 5 anos até o próximo ano)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    onSelect(newDate);
  };

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
  };

  const handleYearChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedYear > years[0]) {
      setSelectedYear(selectedYear - 1);
    } else if (direction === 'next' && selectedYear < years[years.length - 1]) {
      setSelectedYear(selectedYear + 1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity className="flex-1 bg-black/50" activeOpacity={1} onPress={onClose}>
        <View className="flex-1 items-center justify-center px-6">
          <TouchableOpacity
            activeOpacity={1}
            className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
            onPress={() => {}}>
            {/* Header */}
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-text-dark">Selecionar Mês</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Year Selector */}
            <View className="mb-4 flex-row items-center justify-center">
              <TouchableOpacity onPress={() => handleYearChange('prev')} className="p-2">
                <Ionicons name="chevron-back" size={24} color="#18cb96" />
              </TouchableOpacity>

              <Text className="mx-4 text-xl font-bold text-primary">{selectedYear}</Text>

              <TouchableOpacity onPress={() => handleYearChange('next')} className="p-2">
                <Ionicons name="chevron-forward" size={24} color="#18cb96" />
              </TouchableOpacity>
            </View>

            {/* Months Grid */}
            <View className="mb-4">
              {Array.from({ length: 4 }, (_, rowIndex) => (
                <View key={rowIndex} className="mb-2 flex-row justify-between">
                  {Array.from({ length: 3 }, (_, colIndex) => {
                    const monthIndex = rowIndex * 3 + colIndex;
                    const isSelected = monthIndex === selectedMonth;
                    const isCurrentMonth =
                      monthIndex === new Date().getMonth() &&
                      selectedYear === new Date().getFullYear();

                    return (
                      <TouchableOpacity
                        key={monthIndex}
                        onPress={() => handleMonthSelect(monthIndex)}
                        className={`mx-1 flex-1 rounded-lg p-3 ${
                          isSelected
                            ? 'bg-primary'
                            : isCurrentMonth
                              ? 'bg-primary/10'
                              : 'bg-background-100'
                        }`}>
                        <Text
                          className={`text-center text-sm font-medium ${
                            isSelected
                              ? 'text-white'
                              : isCurrentMonth
                                ? 'text-primary'
                                : 'text-text-dark'
                          }`}>
                          {months[monthIndex].substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity onPress={onClose} className="rounded-lg px-4 py-2">
                <Text className="font-medium text-text-light">Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleConfirm} className="rounded-lg bg-primary px-4 py-2">
                <Text className="font-medium text-white">Confirmar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
