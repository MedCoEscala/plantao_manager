// app/components/form/DateField.tsx
import { Ionicons } from '@expo/vector-icons';
import { format, startOfDay, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState, useCallback, useMemo } from 'react';
import { TouchableOpacity, Text, Platform } from 'react-native';
import DateTimePicker from 'react-native-modal-datetime-picker';

import { FieldWrapper } from './FormField';
import { TimePickerModal } from '../ui/TimePickerModal';

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

  // Normalizar valor para evitar problemas de timezone
  const normalizedValue = useMemo(() => {
    if (!value || !isValid(value)) return null;

    if (mode === 'date') {
      return startOfDay(value);
    }

    return value;
  }, [value, mode]);

  const formatDisplayValue = useCallback(() => {
    if (!normalizedValue) return '';

    try {
      switch (mode) {
        case 'date':
          return format(normalizedValue, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        case 'time':
          return format(normalizedValue, 'HH:mm', { locale: ptBR });
        case 'datetime':
          return format(normalizedValue, 'dd/MM/yyyy HH:mm', { locale: ptBR });
        default:
          return format(normalizedValue, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      }
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  }, [normalizedValue, mode]);

  const handlePickerConfirm = useCallback(
    (selectedDate: Date) => {
      setPickerVisible(false);

      if (!selectedDate || !isValid(selectedDate)) {
        console.warn('Data selecionada inválida');
        return;
      }

      let processedDate = selectedDate;

      // Para modo date, sempre usar startOfDay para consistência
      if (mode === 'date') {
        // Criar data local para evitar problemas de timezone
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const day = selectedDate.getDate();
        processedDate = new Date(year, month, day, 0, 0, 0, 0);
      } else if (mode === 'time') {
        // Para modo time, criar uma nova data local mantendo apenas hora e minuto
        // Usar a data atual ou a data base do valor existente
        const baseDate = normalizedValue || new Date();
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();
        const day = baseDate.getDate();

        // Extrair hora e minuto do selectedDate considerando timezone local
        const hours = selectedDate.getHours();
        const minutes = selectedDate.getMinutes();

        // Criar nova data local com a data base e horário selecionado
        processedDate = new Date(year, month, day, hours, minutes, 0, 0);
      }

      onChange(processedDate);
    },
    [mode, normalizedValue, onChange]
  );

  const handlePickerCancel = useCallback(() => {
    setPickerVisible(false);
  }, []);

  const handlePress = useCallback(() => {
    setPickerVisible(true);
  }, []);

  // Definir data padrão para o picker
  const pickerDate = useMemo(() => {
    if (normalizedValue && isValid(normalizedValue)) {
      return normalizedValue;
    }

    // Usar data atual como fallback
    const now = new Date();
    if (mode === 'date') {
      return startOfDay(now);
    }
    return now;
  }, [normalizedValue, mode]);

  // Configurações específicas do picker por plataforma
  const pickerProps = useMemo(() => {
    const baseProps = {
      isVisible: isPickerVisible,
      mode,
      date: pickerDate,
      onConfirm: handlePickerConfirm,
      onCancel: handlePickerCancel,
      locale: 'pt_BR',
      confirmTextIOS: 'Confirmar',
      cancelTextIOS: 'Cancelar',
      // Configurações específicas para iOS
      display: Platform.OS === 'ios' ? 'spinner' : 'default',
      is24Hour: true,
      // Configurações para melhor apresentação visual no iOS
      modalStyleIOS: {
        backgroundColor: 'transparent',
      },
      pickerContainerStyleIOS: {
        backgroundColor: 'transparent',
        paddingTop: 20,
        paddingBottom: 20,
      },
      // Configurações para modal mais compacto
      presentationStyle: Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen',
      animationType: Platform.OS === 'ios' ? 'slide' : 'fade',
    };

    // Configurações específicas por modo
    if (mode === 'date') {
      return {
        ...baseProps,
        minimumDate: minDate,
        maximumDate: maxDate,
      };
    }

    // Para modo time, não definir minuteInterval para permitir seleção livre
    return baseProps;
  }, [
    isPickerVisible,
    mode,
    pickerDate,
    handlePickerConfirm,
    handlePickerCancel,
    minDate,
    maxDate,
  ]);

  const getIconName = () => {
    switch (mode) {
      case 'time':
        return 'time-outline';
      case 'datetime':
        return 'calendar-clear-outline';
      default:
        return 'calendar-outline';
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
        className={`h-12 flex-row items-center justify-between rounded-lg border px-3 ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
        }`}
        onPress={handlePress}
        activeOpacity={0.7}>
        <Text
          className={`flex-1 ${normalizedValue ? 'text-gray-900' : 'text-gray-400'}`}
          numberOfLines={1}>
          {normalizedValue ? formatDisplayValue() : placeholder}
        </Text>
        <Ionicons name={getIconName()} size={20} color={normalizedValue ? '#18cb96' : '#64748b'} />
      </TouchableOpacity>

      {mode === 'time' ? (
        <TimePickerModal
          visible={isPickerVisible}
          title={label}
          initialTime={pickerDate}
          onConfirm={handlePickerConfirm}
          onCancel={handlePickerCancel}
        />
      ) : (
        <DateTimePicker {...pickerProps} />
      )}
    </FieldWrapper>
  );
}

export default DateField;
