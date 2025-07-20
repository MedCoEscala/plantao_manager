import React, { memo, useMemo, useEffect, useState } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';

import { formatCurrency, formatShiftDate, dateToLocalTimeString } from '../../../utils/formatters';
import Card from '../../ui/Card';
import SectionHeader from '../../ui/SectionHeader';

interface ShiftSummaryProps {
  date: Date;
  startTime: Date;
  endTime: Date;
  value: string;
  duration: string;
}

const ShiftSummary = memo<ShiftSummaryProps>(({ date, startTime, endTime, value, duration }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const formattedData = useMemo(() => {
    const data = {
      date: date ? formatShiftDate(date, 'dd/MM/yyyy') : 'Data não definida',
      startTime: startTime ? dateToLocalTimeString(startTime) : 'N/A',
      endTime: endTime ? dateToLocalTimeString(endTime) : 'N/A',
      timeRange: '',
      value: '',
      duration: duration || '0h',
    };

    if (data.startTime !== 'N/A' && data.endTime !== 'N/A') {
      data.timeRange = `${data.startTime} às ${data.endTime}`;
    } else {
      data.timeRange = 'Horário não definido';
    }

    if (value && value.trim()) {
      try {
        const numericValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
        data.value = formatCurrency(numericValue);
      } catch (error) {
        data.value = 'Valor inválido';
      }
    } else {
      data.value = 'Valor não informado';
    }

    return data;
  }, [date, startTime, endTime, value, duration]);

  useEffect(() => {
    setIsUpdating(true);
    setLastUpdate(Date.now());

    const timer = setTimeout(() => {
      setIsUpdating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [formattedData]);

  const valueColor = useMemo(() => {
    if (!value || !value.trim()) return 'text-gray-500';

    try {
      const numericValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
      if (numericValue > 0) return 'text-primary';
      return 'text-gray-500';
    } catch {
      return 'text-red-500';
    }
  }, [value]);

  const durationIndicator = useMemo(() => {
    if (!duration || duration === '0h') return '⚠️';

    const hours = parseInt(duration.split('h')[0]);
    if (hours >= 12) return '🌙';
    if (hours >= 8) return '⏰';
    if (hours >= 4) return '⏱️';
    return '⚡';
  }, [duration]);

  return (
    <Card
      key={`summary-${lastUpdate}`}
      className={`mb-6 transition-all duration-300 ${isUpdating ? 'scale-[1.02]' : 'scale-100'}`}
      style={isUpdating ? styles.shadowLg : null}
      variant="default">
      <SectionHeader
        title="Resumo do Plantão"
        subtitle={`${durationIndicator} ${formattedData.duration}`}
        icon="information-circle-outline"
      />

      <View className="space-y-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">📅 Data:</Text>
          <Text className="text-sm font-medium text-gray-900">{formattedData.date}</Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">🕐 Horário:</Text>
          <Text className="text-sm font-medium text-gray-900">{formattedData.timeRange}</Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">⏱️ Duração:</Text>
          <Text className="text-sm font-medium text-gray-900">{formattedData.duration}</Text>
        </View>

        {formattedData.value !== 'Valor não informado' && (
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-600">💰 Valor:</Text>
            <Text className={`text-sm font-medium ${valueColor}`}>{formattedData.value}</Text>
          </View>
        )}

        {isUpdating && (
          <View className="mt-2 flex-row justify-center">
            <View className="rounded-full bg-blue-100 px-3 py-1">
              <Text className="text-xs font-medium text-blue-600">🔄 Atualizando...</Text>
            </View>
          </View>
        )}

        {__DEV__ && (
          <View className="mt-3 border-t border-gray-200 pt-3">
            <Text className="text-center text-xs text-gray-500">
              🐛 Última atualização: {new Date(lastUpdate).toLocaleTimeString()}
            </Text>
            <Text className="text-center text-xs text-gray-500">
              Horários: {formattedData.startTime} - {formattedData.endTime}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  shadowLg:
    Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.37,
        shadowRadius: 7.49,
      },
      android: {
        elevation: 12,
      },
    }) || {},
});

ShiftSummary.displayName = 'ShiftSummary';

export default ShiftSummary;
