// app/components/form/DateField.tsx
import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FieldWrapper } from './FormField';

interface DateFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  mode?: 'date' | 'time' | 'datetime';
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Selecione uma data',
  error,
  helperText,
  required = false,
  mode = 'date',
  className = '',
  minDate,
  maxDate,
}: DateFieldProps) {
  const [isPickerVisible, setPickerVisible] = useState(false);

  const formatDisplayValue = () => {
    if (!value) return '';

    switch (mode) {
      case 'date':
        return format(value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      case 'time':
        return format(value, 'HH:mm', { locale: ptBR });
      case 'datetime':
        return format(value, 'dd/MM/yyyy HH:mm', { locale: ptBR });
      default:
        return value.toISOString();
    }
  };

  return (
    <FieldWrapper
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      className={className}>
      <TouchableOpacity
        className={`h-12 flex-row items-center justify-between rounded-lg border px-3
          ${error ? 'border-error' : 'border-gray-300'}
        `}
        onPress={() => setPickerVisible(true)}>
        <Text className={value ? 'text-text-dark' : 'text-gray-400'}>
          {value ? formatDisplayValue() : placeholder}
        </Text>
        <Ionicons
          name={mode === 'time' ? 'time-outline' : 'calendar-outline'}
          size={20}
          color="#64748b"
        />
      </TouchableOpacity>

      <DateTimePicker
        isVisible={isPickerVisible}
        mode={mode}
        date={value || new Date()}
        onConfirm={(date) => {
          onChange(date);
          setPickerVisible(false);
        }}
        onCancel={() => setPickerVisible(false)}
        minimumDate={minDate}
        maximumDate={maxDate}
      />
    </FieldWrapper>
  );
}

export default DateField;
