import { format, addWeeks, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';

import SelectField from './SelectField';
import SwitchField from './SwitchField';

import Input from '@/components/ui/Input';

const RECURRENCE_OPTIONS = [
  { label: 'Semanalmente', value: 'weekly', icon: 'repeat-outline' },
  { label: 'Quinzenalmente', value: 'biweekly', icon: 'calendar-number-outline' },
  { label: 'Mensalmente', value: 'monthly', icon: 'calendar-clear-outline' },
];

interface RecurrenceSelectorProps {
  isRecurring: boolean;
  onRecurringChange: (value: boolean) => void;
  recurrenceType: string;
  onRecurrenceTypeChange: (value: string) => void;
  recurrenceCount: string;
  onRecurrenceCountChange: (value: string) => void;
  startDate: Date;
  errors?: {
    recurrenceType?: string;
    recurrenceCount?: string;
  };
}

export default function RecurrenceSelector({
  isRecurring,
  onRecurringChange,
  recurrenceType,
  onRecurrenceTypeChange,
  recurrenceCount,
  onRecurrenceCountChange,
  startDate,
  errors = {},
}: RecurrenceSelectorProps) {
  // Gerar preview das datas de recorrência
  const generatePreviewDates = useMemo(() => {
    if (!isRecurring) return [];

    const dates: Date[] = [];
    const count = parseInt(recurrenceCount) || 1;
    let currentDate = new Date(startDate);

    for (let i = 0; i < Math.min(count, 8); i++) {
      dates.push(new Date(currentDate));

      if (i < count - 1) {
        switch (recurrenceType) {
          case 'weekly':
            currentDate = addWeeks(currentDate, 1);
            break;
          case 'biweekly':
            currentDate = addWeeks(currentDate, 2);
            break;
          case 'monthly':
            currentDate = addMonths(currentDate, 1);
            break;
        }
      }
    }

    return dates;
  }, [isRecurring, recurrenceType, recurrenceCount, startDate]);

  const totalCount = parseInt(recurrenceCount) || 1;

  return (
    <View>
      <View className="mb-4">
        <SwitchField
          label="Criar múltiplos registros"
          value={isRecurring}
          onValueChange={onRecurringChange}
          helperText="Ative para criar vários registros de uma vez"
        />
      </View>

      {isRecurring && (
        <>
          <View className="mb-4">
            <SelectField
              label="Frequência"
              value={recurrenceType}
              onValueChange={onRecurrenceTypeChange}
              options={RECURRENCE_OPTIONS}
              required
              error={errors.recurrenceType}
            />
          </View>

          <View className="mb-4">
            <Input
              label="Quantidade de registros"
              value={recurrenceCount}
              onChangeText={(text) => onRecurrenceCountChange(text.replace(/\D/g, ''))}
              placeholder="4"
              keyboardType="numeric"
              required
              error={errors.recurrenceCount}
              helperText="Número total de registros a serem criados (máximo 52)"
            />
          </View>

          {/* Preview das datas */}
          {generatePreviewDates.length > 0 && (
            <View className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Preview das datas ({totalCount} {totalCount === 1 ? 'registro' : 'registros'}):
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {generatePreviewDates.slice(0, 6).map((date, index) => (
                  <View
                    key={index}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
                    <Text className="text-xs font-medium text-gray-800">
                      {format(date, 'dd/MM')}
                    </Text>
                  </View>
                ))}
                {totalCount > 6 && (
                  <View className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2">
                    <Text className="text-xs font-medium text-primary">+{totalCount - 6}</Text>
                  </View>
                )}
              </View>

              {totalCount > 8 && (
                <Text className="mt-2 text-xs text-gray-500">
                  Mostrando apenas os primeiros 6 de {totalCount} registros
                </Text>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}
