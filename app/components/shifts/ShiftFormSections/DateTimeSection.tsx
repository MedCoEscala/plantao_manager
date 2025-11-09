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
      if (!startTime || !endTime || !date)
        return { duration: '0h', is24Plus: false, crossesMidnight: false };

      try {
        const startDateTime = new Date(date);
        startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

        const endDateTime = new Date(date);
        endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

        const crossesMidnight =
          endTime.getHours() < startTime.getHours() ||
          (endTime.getHours() === startTime.getHours() &&
            endTime.getMinutes() <= startTime.getMinutes());

        if (crossesMidnight) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }

        const diffMs = endDateTime.getTime() - startDateTime.getTime();
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return {
          duration: `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`,
          is24Plus: hours >= 24,
          crossesMidnight,
        };
      } catch (error) {
        return { duration: '0h', is24Plus: false, crossesMidnight: false };
      }
    }, [startTime, endTime, date]);

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
            ⏱️ Duração: {duration || localDuration.duration}
          </Text>

          {localDuration.is24Plus ? (
            <Text className="mt-1 text-center text-xs font-medium text-orange-600">
              ⚠️ Plantão com 24 horas ou mais!
            </Text>
          ) : (
            localDuration.crossesMidnight && (
              <Text className="mt-1 text-center text-xs text-blue-600">
                🌙 Plantão atravessa a meia-noite.
              </Text>
            )
          )}
        </View>

        {startTime &&
          endTime &&
          startTime.getHours() === endTime.getHours() &&
          startTime.getMinutes() === endTime.getMinutes() && (
            <View className="mt-2 rounded-xl bg-red-50 p-3">
              <Text className="text-center text-sm font-medium text-red-600">
                ⚠️ Horário de início e fim são iguais. Duração será de 24h.
              </Text>
            </View>
          )}
      </Card>
    );
  }
);

DateTimeSection.displayName = 'DateTimeSection';

export default DateTimeSection;
