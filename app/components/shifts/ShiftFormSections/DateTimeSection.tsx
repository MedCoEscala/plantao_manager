import React, { memo, useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';

import { dateToLocalTimeString } from '../../../utils/formatters';
import DateField from '../../form/DateField';
import Card from '../../ui/Card';
import SectionHeader from '../../ui/SectionHeader';

interface DateTimeSectionProps {
  date: Date;
  startTime: Date;
  endTime: Date;
  duration: string;
  onDateChange: (date: Date) => void;
  onStartTimeChange: (time: Date) => void;
  onEndTimeChange: (time: Date) => void;
  errors: Record<string, string>;
}

const DateTimeSection = memo<DateTimeSectionProps>(
  ({
    date,
    startTime,
    endTime,
    duration,
    onDateChange,
    onStartTimeChange,
    onEndTimeChange,
    errors,
  }) => {
    const [lastUpdate, setLastUpdate] = useState(Date.now());

    const memoizedValues = useMemo(
      () => ({
        date: date?.toDateString(),
        startTime: startTime
          ? `${startTime.getHours()}:${startTime.getMinutes().toString().padStart(2, '0')}`
          : 'undefined',
        endTime: endTime
          ? `${endTime.getHours()}:${endTime.getMinutes().toString().padStart(2, '0')}`
          : 'undefined',
        duration,
      }),
      [date, startTime, endTime, duration]
    );

    useEffect(() => {
      setLastUpdate(Date.now());
    }, [memoizedValues]);

    const localDuration = useMemo(() => {
      if (!startTime || !endTime) return '0h';

      try {
        const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
        const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

        let durationMinutes: number;
        if (endMinutes >= startMinutes) {
          durationMinutes = endMinutes - startMinutes;
        } else {
          durationMinutes = 24 * 60 - startMinutes + endMinutes;
        }

        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
      } catch (error) {
        console.warn('❌ Erro ao calcular duração local:', error);
        return '0h';
      }
    }, [startTime, endTime]);

    const handleDateChange = (newDate: Date) => {
      onDateChange(newDate);
    };

    const handleStartTimeChange = (newTime: Date) => {
      onStartTimeChange(newTime);
    };

    const handleEndTimeChange = (newTime: Date) => {
      onEndTimeChange(newTime);
    };

    return (
      <Card className="m-6 mb-4">
        <SectionHeader
          title="Data e Horário"
          subtitle="Defina quando será o plantão"
          icon="calendar-outline"
        />

        <DateField
          label="Data do Plantão"
          value={date}
          onChange={handleDateChange}
          mode="date"
          required
          className="mb-4"
          error={errors.date}
        />

        <View className="mb-4 flex-row space-x-4">
          <DateField
            label="Início"
            value={startTime}
            onChange={handleStartTimeChange}
            mode="time"
            required
            className="flex-1"
            error={errors.startTime}
          />

          <DateField
            label="Término"
            value={endTime}
            onChange={handleEndTimeChange}
            mode="time"
            required
            error={errors.endTime}
            className="flex-1"
          />
        </View>

        <View key={`duration-${lastUpdate}`} className="rounded-xl bg-blue-50 p-4">
          <Text className="text-center text-sm font-semibold text-blue-700">
            ⏱️ Duração: {duration || localDuration}
          </Text>

          {duration !== localDuration && (
            <Text className="mt-1 text-center text-xs text-orange-600">
              ⚠️ Recalculando... ({localDuration})
            </Text>
          )}

          {__DEV__ && (
            <View className="mt-2 border-t border-blue-200 pt-2">
              <Text className="text-center text-xs text-blue-600">
                🐛 {startTime ? dateToLocalTimeString(startTime) : 'N/A'} -{' '}
                {endTime ? dateToLocalTimeString(endTime) : 'N/A'}
              </Text>
              <Text className="text-center text-xs text-blue-500">
                Última atualização: {new Date(lastUpdate).toLocaleTimeString()}
              </Text>
              <Text className="text-center text-xs text-blue-500">
                Local: {localDuration} | Props: {duration}
              </Text>
            </View>
          )}
        </View>

        {startTime &&
          endTime &&
          startTime.getHours() === endTime.getHours() &&
          startTime.getMinutes() === endTime.getMinutes() && (
            <View className="mt-2 rounded-xl bg-red-50 p-3">
              <Text className="text-center text-sm font-medium text-red-600">
                ⚠️ Horário de início e fim são iguais
              </Text>
            </View>
          )}
      </Card>
    );
  }
);

DateTimeSection.displayName = 'DateTimeSection';

export default DateTimeSection;
