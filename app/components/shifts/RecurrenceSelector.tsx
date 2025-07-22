import { Ionicons } from '@expo/vector-icons';
import { format, addMonths, getDay, startOfDay, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  RecurrenceConfig,
  RecurrenceType,
  RecurrencePattern,
  WEEKDAYS,
  WEEK_NUMBERS,
} from '../../types/recurrence';
import { cn } from '../../utils/cn';
import { formatShiftDate, dateToLocalDateString } from '../../utils/formatters';
import { RecurrenceCalculator } from '../../utils/recurrence';
import DateField from '../form/DateField';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';

interface RecurrenceSelectorProps {
  startDate: Date;
  onRecurrenceChange: (config: RecurrenceConfig | null) => void;
}

const RECURRENCE_OPTIONS = [
  {
    type: 'none' as const,
    title: 'Plantão Único',
    description: 'Apenas uma data',
    icon: 'calendar-outline' as const,
    color: '#6b7280',
  },
  {
    type: 'weekly' as const,
    title: 'Repetir Semanalmente',
    description: 'Mesmos dias da semana',
    icon: 'refresh-outline' as const,
    color: '#3b82f6',
  },
  {
    type: 'monthly-weekday' as const,
    title: 'Repetir Mensalmente',
    description: 'Ex: toda 2ª segunda',
    icon: 'calendar-number-outline' as const,
    color: '#8b5cf6',
  },
  {
    type: 'monthly-specific' as const,
    title: 'Dias Específicos',
    description: 'Ex: todo dia 15',
    icon: 'today-outline' as const,
    color: '#f59e0b',
  },
];

export default function RecurrenceSelector({
  startDate,
  onRecurrenceChange,
}: RecurrenceSelectorProps) {
  // Normalizar startDate para evitar problemas de timezone
  const normalizedStartDate = useMemo(() => {
    return startOfDay(isValid(startDate) ? startDate : new Date());
  }, [startDate]);

  const [selectedType, setSelectedType] = useState<RecurrenceType | 'none'>('none');
  const [endDate, setEndDate] = useState<Date>(() => addMonths(normalizedStartDate, 3));
  const [showModal, setShowModal] = useState(false);

  // Estados de configuração otimizados
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [weekNumbers, setWeekNumbers] = useState<number[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState<number>(() => getDay(normalizedStartDate));
  const [monthDays, setMonthDays] = useState<string[]>([]);

  // ✅ CORREÇÃO: Validação mais robusta da configuração
  const validateRecurrenceConfig = useCallback(
    (type: RecurrenceType): boolean => {
      switch (type) {
        case 'weekly':
          return weekdays.length > 0 && weekdays.every((day) => day >= 0 && day <= 6);
        case 'monthly-weekday':
          return (
            weekNumbers.length > 0 &&
            weekNumbers.every((week) => week >= 1 && week <= 5) &&
            dayOfWeek >= 0 &&
            dayOfWeek <= 6
          );
        case 'monthly-specific':
          return (
            monthDays.length > 0 &&
            monthDays.every((day) => {
              const dayNum = parseInt(day);
              return !isNaN(dayNum) && dayNum >= 1 && dayNum <= 31;
            })
          );
        default:
          return false;
      }
    },
    [weekdays, weekNumbers, dayOfWeek, monthDays]
  );

  // Sincronizar configurações quando startDate muda
  useEffect(() => {
    const dayOfWeekFromStart = getDay(normalizedStartDate);
    setDayOfWeek(dayOfWeekFromStart);

    // Reset configurations when start date changes
    if (selectedType === 'weekly') {
      setWeekdays([dayOfWeekFromStart]);
    } else if (selectedType === 'monthly-specific') {
      setMonthDays([normalizedStartDate.getDate().toString()]);
    }
  }, [normalizedStartDate, selectedType]);

  // Calcular configuração de recorrência de forma otimizada
  const recurrenceConfig = useMemo((): RecurrenceConfig | null => {
    if (selectedType === 'none') return null;

    // ✅ CORREÇÃO: Validação antes de criar o config
    if (!validateRecurrenceConfig(selectedType as RecurrenceType)) {
      console.warn('Configuração de recorrência inválida:', {
        type: selectedType,
        weekdays,
        weekNumbers,
        dayOfWeek,
        monthDays,
      });
      return null;
    }

    let pattern: RecurrencePattern | null = null;

    try {
      switch (selectedType) {
        case 'weekly':
          pattern = { type: 'weekly', daysOfWeek: [...weekdays].sort() };
          break;

        case 'monthly-weekday':
          pattern = {
            type: 'monthly-weekday',
            weekNumber: [...weekNumbers].sort(),
            dayOfWeek,
          };
          break;

        case 'monthly-specific':
          const validDays = monthDays
            .map((d) => parseInt(d))
            .filter((d) => !isNaN(d) && d >= 1 && d <= 31)
            .sort((a, b) => a - b);

          if (validDays.length === 0) return null;
          pattern = { type: 'monthly-specific', days: validDays };
          break;
      }

      if (!pattern) return null;

      const config: RecurrenceConfig = {
        pattern,
        startDate: normalizedStartDate,
        endDate,
        exceptions: [],
      };

      // ✅ CORREÇÃO: Validar o padrão usando RecurrenceCalculator
      const validation = RecurrenceCalculator.validatePattern(pattern);
      if (!validation.isValid) {
        console.error('Padrão de recorrência inválido:', validation.errors);
        return null;
      }

      return config;
    } catch (error) {
      console.error('Erro ao calcular configuração de recorrência:', error);
      return null;
    }
  }, [
    selectedType,
    weekdays,
    weekNumbers,
    dayOfWeek,
    monthDays,
    normalizedStartDate,
    endDate,
    validateRecurrenceConfig,
  ]);

  // Calcular preview de datas de forma segura
  const previewDates = useMemo(() => {
    if (!recurrenceConfig) return [];

    try {
      const dates = RecurrenceCalculator.calculateDates(recurrenceConfig);
      console.log('📅 Preview calculado:', dates.length, 'datas');
      // Limitar preview para melhor performance
      return dates.slice(0, 10);
    } catch (error) {
      console.error('Erro ao calcular datas de preview:', error);
      return [];
    }
  }, [recurrenceConfig]);

  // Notificar mudanças de forma otimizada
  useEffect(() => {
    // ✅ CORREÇÃO: Debounce para evitar muitas chamadas e validar antes de enviar
    const timeoutId = setTimeout(() => {
      console.log('🔄 Enviando configuração de recorrência:', recurrenceConfig);
      onRecurrenceChange(recurrenceConfig);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [recurrenceConfig, onRecurrenceChange]);

  const handleTypeSelect = useCallback(
    (type: RecurrenceType | 'none') => {
      console.log('🎯 Selecionando tipo de recorrência:', type);
      setSelectedType(type);

      // Configurações padrão baseadas na data inicial
      switch (type) {
        case 'weekly':
          const currentDayOfWeek = getDay(normalizedStartDate);
          setWeekdays([currentDayOfWeek]);
          console.log('📅 Configuração semanal:', [currentDayOfWeek]);
          break;
        case 'monthly-weekday':
          setWeekNumbers([1]);
          setDayOfWeek(getDay(normalizedStartDate));
          console.log('📅 Configuração mensal por dia da semana:', { weekNumbers: [1], dayOfWeek });
          break;
        case 'monthly-specific':
          const dayOfMonth = normalizedStartDate.getDate().toString();
          setMonthDays([dayOfMonth]);
          console.log('📅 Configuração mensal por dia específico:', [dayOfMonth]);
          break;
        default:
          setWeekdays([]);
          setWeekNumbers([]);
          setMonthDays([]);
      }

      if (type !== 'none') {
        setShowModal(true);
      }
    },
    [normalizedStartDate]
  );

  const toggleWeekday = useCallback((day: number) => {
    setWeekdays((prev) => {
      const newWeekdays = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      console.log('📅 Dias da semana atualizados:', newWeekdays.sort());
      return newWeekdays.sort();
    });
  }, []);

  const toggleWeekNumber = useCallback((num: number) => {
    setWeekNumbers((prev) => {
      const newNumbers = prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num];
      console.log('📅 Semanas do mês atualizadas:', newNumbers.sort());
      return newNumbers.sort();
    });
  }, []);

  const toggleMonthDay = useCallback((day: string) => {
    const dayNum = parseInt(day);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return;

    setMonthDays((prev) => {
      const newDays = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      const sortedDays = newDays.sort((a, b) => parseInt(a) - parseInt(b));
      console.log('📅 Dias do mês atualizados:', sortedDays);
      return sortedDays;
    });
  }, []);

  const getSummary = useCallback(() => {
    if (selectedType === 'none') {
      return 'Plantão único selecionado';
    }

    if (!recurrenceConfig) {
      return 'Configure a recorrência';
    }

    try {
      const description = RecurrenceCalculator.getRecurrenceDescription(recurrenceConfig.pattern);
      const totalDates = RecurrenceCalculator.calculateDates(recurrenceConfig).length;
      return `${description} • ${totalDates} plantão${totalDates > 1 ? 's' : ''}`;
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      return 'Configuração inválida';
    }
  }, [selectedType, recurrenceConfig]);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleEndDateChange = useCallback(
    (date: Date) => {
      if (isValid(date) && date >= normalizedStartDate) {
        console.log('📅 Data final atualizada:', date.toDateString());
        setEndDate(date);
      }
    },
    [normalizedStartDate]
  );

  return (
    <>
      <Card className="mb-6">
        <SectionHeader
          title="Tipo de Plantão"
          subtitle="Escolha como o plantão será repetido"
          icon="refresh-outline"
        />

        <View className="space-y-3">
          {RECURRENCE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.type}
              onPress={() => handleTypeSelect(option.type)}
              className={cn(
                'flex-row items-center rounded-xl border-2 p-4 transition-colors',
                selectedType === option.type
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 bg-gray-50'
              )}
              activeOpacity={0.7}>
              <View
                className="mr-4 h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: option.color + '20' }}>
                <Ionicons name={option.icon} size={20} color={option.color} />
              </View>

              <View className="flex-1">
                <Text
                  className={cn(
                    'text-base font-semibold',
                    selectedType === option.type ? 'text-primary' : 'text-gray-900'
                  )}>
                  {option.title}
                </Text>
                <Text className="mt-1 text-sm text-gray-600">{option.description}</Text>
              </View>

              {selectedType === option.type && (
                <Ionicons name="checkmark-circle" size={24} color="#18cb96" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {selectedType !== 'none' && (
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            className="mt-6 flex-row items-center justify-between rounded-xl bg-primary/10 p-4"
            activeOpacity={0.7}>
            <View className="flex-1">
              <Text className="text-sm font-medium text-primary">{getSummary()}</Text>
              <Text className="mt-1 text-xs text-gray-600">
                Até {formatShiftDate(endDate, "dd 'de' MMMM")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#18cb96" />
          </TouchableOpacity>
        )}

        {/* Preview das próximas datas */}
        {previewDates.length > 0 && (
          <View className="mt-4 rounded-xl bg-blue-50 p-4">
            <Text className="mb-3 text-sm font-semibold text-blue-700">
              📅 Próximas datas ({previewDates.length}
              {previewDates.length === 10 ? '+' : ''}):
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {previewDates.map((date, index) => (
                <View key={index} className="rounded-lg bg-blue-100 px-3 py-1">
                  <Text className="text-xs font-medium text-blue-800">
                    {formatShiftDate(date, 'dd/MM')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ✅ CORREÇÃO: Mostrar erro se configuração inválida */}
        {selectedType !== 'none' && !recurrenceConfig && (
          <View className="mt-4 rounded-xl bg-red-50 p-4">
            <Text className="text-sm font-medium text-red-700">
              ⚠️ Configuração incompleta ou inválida
            </Text>
            <Text className="mt-1 text-xs text-red-600">
              Configure ao menos uma opção para continuar
            </Text>
          </View>
        )}
      </Card>

      {/* Modal de Configuração */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleModalClose}>
        <SafeAreaView className="flex-1 bg-white">
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {/* Header do Modal */}
            <View className="flex-row items-center justify-between border-b border-gray-200 px-6 py-4">
              <TouchableOpacity onPress={handleModalClose} activeOpacity={0.7}>
                <Text className="text-base font-medium text-gray-600">Cancelar</Text>
              </TouchableOpacity>
              <Text className="text-lg font-bold text-gray-900">Configurar Recorrência</Text>
              <TouchableOpacity onPress={handleModalClose} activeOpacity={0.7}>
                <Text className="text-base font-semibold text-primary">Concluir</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
              {/* Data de Término */}
              <View className="py-6">
                <Text className="mb-4 text-lg font-semibold text-gray-900">Data de Término</Text>
                <DateField
                  label="Repetir até"
                  value={endDate}
                  onChange={handleEndDateChange}
                  mode="date"
                  minDate={normalizedStartDate}
                  className="mb-4"
                />
              </View>

              {/* Configurações Específicas por Tipo */}
              {selectedType === 'weekly' && (
                <View className="pb-6">
                  <Text className="mb-4 text-lg font-semibold text-gray-900">Dias da Semana</Text>
                  <View className="flex-row flex-wrap gap-3">
                    {WEEKDAYS.map((weekday) => (
                      <TouchableOpacity
                        key={weekday.value}
                        onPress={() => toggleWeekday(weekday.value)}
                        className={cn(
                          'min-w-[100px] flex-1 rounded-xl border-2 p-3',
                          weekdays.includes(weekday.value)
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 bg-gray-50'
                        )}
                        activeOpacity={0.7}>
                        <Text
                          className={cn(
                            'text-center text-sm font-medium',
                            weekdays.includes(weekday.value) ? 'text-primary' : 'text-gray-700'
                          )}>
                          {weekday.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {/* ✅ CORREÇÃO: Feedback se nenhum dia selecionado */}
                  {weekdays.length === 0 && (
                    <Text className="mt-2 text-sm text-red-500">
                      Selecione pelo menos um dia da semana
                    </Text>
                  )}
                </View>
              )}

              {selectedType === 'monthly-weekday' && (
                <View className="pb-6">
                  <Text className="mb-4 text-lg font-semibold text-gray-900">Semanas do Mês</Text>
                  <View className="mb-6 flex-row flex-wrap gap-3">
                    {WEEK_NUMBERS.map((week) => (
                      <TouchableOpacity
                        key={week.value}
                        onPress={() => toggleWeekNumber(week.value)}
                        className={cn(
                          'min-w-[80px] flex-1 rounded-xl border-2 p-3',
                          weekNumbers.includes(week.value)
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 bg-gray-50'
                        )}
                        activeOpacity={0.7}>
                        <Text
                          className={cn(
                            'text-center text-sm font-medium',
                            weekNumbers.includes(week.value) ? 'text-primary' : 'text-gray-700'
                          )}>
                          {week.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text className="mb-4 text-lg font-semibold text-gray-900">Dia da Semana</Text>
                  <View className="flex-row flex-wrap gap-3">
                    {WEEKDAYS.map((weekday) => (
                      <TouchableOpacity
                        key={weekday.value}
                        onPress={() => setDayOfWeek(weekday.value)}
                        className={cn(
                          'min-w-[100px] flex-1 rounded-xl border-2 p-3',
                          dayOfWeek === weekday.value
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 bg-gray-50'
                        )}
                        activeOpacity={0.7}>
                        <Text
                          className={cn(
                            'text-center text-sm font-medium',
                            dayOfWeek === weekday.value ? 'text-primary' : 'text-gray-700'
                          )}>
                          {weekday.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {/* ✅ CORREÇÃO: Feedback se configuração incompleta */}
                  {weekNumbers.length === 0 && (
                    <Text className="mt-2 text-sm text-red-500">
                      Selecione pelo menos uma semana do mês
                    </Text>
                  )}
                </View>
              )}

              {selectedType === 'monthly-specific' && (
                <View className="pb-6">
                  <Text className="mb-4 text-lg font-semibold text-gray-900">Dias do Mês</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {Array.from({ length: 31 }, (_, i) => {
                      const day = (i + 1).toString();
                      return (
                        <TouchableOpacity
                          key={day}
                          onPress={() => toggleMonthDay(day)}
                          className={cn(
                            'h-12 w-12 items-center justify-center rounded-lg border-2',
                            monthDays.includes(day)
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200 bg-gray-50'
                          )}
                          activeOpacity={0.7}>
                          <Text
                            className={cn(
                              'text-sm font-medium',
                              monthDays.includes(day) ? 'text-primary' : 'text-gray-700'
                            )}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {/* ✅ CORREÇÃO: Feedback se nenhum dia selecionado */}
                  {monthDays.length === 0 && (
                    <Text className="mt-2 text-sm text-red-500">
                      Selecione pelo menos um dia do mês
                    </Text>
                  )}
                </View>
              )}

              {/* Preview no Modal */}
              {previewDates.length > 0 && (
                <View className="mb-6 rounded-xl bg-blue-50 p-4">
                  <Text className="mb-3 text-sm font-semibold text-blue-700">
                    Preview das próximas datas:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {previewDates.map((date, index) => (
                        <View key={index} className="rounded-lg bg-blue-100 px-3 py-2">
                          <Text className="text-xs font-medium text-blue-800">
                            {formatShiftDate(date, 'dd/MM/yyyy')}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
