import React, { memo } from 'react';
import { View, Text } from 'react-native';

import Card from '../../ui/Card';
import SectionHeader from '../../ui/SectionHeader';
import { formatCurrency, formatShiftDate, dateToLocalTimeString } from '../../../utils/formatters';

interface ShiftSummaryProps {
  date: Date;
  startTime: Date;
  endTime: Date;
  value: string;
  duration: string;
}

const ShiftSummary = memo<ShiftSummaryProps>(({ date, startTime, endTime, value, duration }) => {
  return (
    <Card className="mb-6">
      <SectionHeader
        title="Informações do Plantão"
        subtitle={`Duração: ${duration}`}
        icon="information-circle-outline"
      />
      <View className="space-y-3">
        <View className="flex-row justify-between">
          <Text className="text-sm text-gray-600">Data:</Text>
          <Text className="text-sm font-medium text-gray-900">
            {formatShiftDate(date, 'dd/MM/yyyy')}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-gray-600">Horário:</Text>
          <Text className="text-sm font-medium text-gray-900">
            {dateToLocalTimeString(startTime)} às {dateToLocalTimeString(endTime)}
          </Text>
        </View>
        {value && (
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Valor:</Text>
            <Text className="text-sm font-medium text-primary">
              {formatCurrency(parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0)}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
});

ShiftSummary.displayName = 'ShiftSummary';

export default ShiftSummary;
