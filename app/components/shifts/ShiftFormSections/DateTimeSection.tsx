import React, { memo } from 'react';
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
          onChange={onDateChange}
          mode="date"
          required
          className="mb-4"
          error={errors.date}
        />

        <View className="mb-4 flex-row space-x-4">
          <DateField
            label="Início"
            value={startTime}
            onChange={onStartTimeChange}
            mode="time"
            required
            className="flex-1"
            error={errors.startTime}
          />

          <DateField
            label="Término"
            value={endTime}
            onChange={onEndTimeChange}
            mode="time"
            required
            error={errors.endTime}
            className="flex-1"
          />
        </View>

        <View className="rounded-xl bg-blue-50 p-4">
          <Text className="text-center text-sm font-semibold text-blue-700">
            ⏱️ Duração: {duration}
          </Text>
        </View>
      </Card>
    );
  }
);

DateTimeSection.displayName = 'DateTimeSection';

export default DateTimeSection;
