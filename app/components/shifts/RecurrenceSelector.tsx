import React, { useState, useCallback, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { format, addMonths, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DateField from '@/components/form/DateField';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import {
  RecurrenceConfig,
  RecurrenceType,
  RecurrencePattern,
  WEEKDAYS,
  WEEK_NUMBERS,
} from '@/types/recurrence';
import { RecurrenceCalculator } from '@/utils/recurrence';
import { cn } from '@/utils/cn';

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
  const [selectedType, setSelectedType] = useState<RecurrenceType | 'none'>('none');
  const [endDate, setEndDate] = useState<Date>(() => addMonths(startDate, 3));
  const [showModal, setShowModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Estados de configuração
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [weekNumbers, setWeekNumbers] = useState<number[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState<number>(getDay(startDate));
  const [monthDays, setMonthDays] = useState<string[]>([]);

  // Calcular configuração de recorrência
  const recurrenceConfig = useMemo((): RecurrenceConfig | null => {
    if (selectedType === 'none') return null;

    let pattern: RecurrencePattern | null = null;

    switch (selectedType) {
      case 'weekly':
        if (weekdays.length === 0) return null;
        pattern = { type: 'weekly', daysOfWeek: weekdays };
        break;

      case 'monthly-weekday':
        if (weekNumbers.length === 0) return null;
        pattern = { type: 'monthly-weekday', weekNumber: weekNumbers, dayOfWeek };
        break;

      case 'monthly-specific':
        if (monthDays.length === 0) return null;
        pattern = {
          type: 'monthly-specific',
          days: monthDays.map((d) => parseInt(d)).filter((d) => !isNaN(d)),
        };
        break;
    }

    if (!pattern) return null;

    return {
      pattern,
      startDate,
      endDate,
      exceptions: [],
    };
  }, [selectedType, weekdays, weekNumbers, dayOfWeek, monthDays, startDate, endDate]);

  // Calcular preview de datas
  const previewDates = useMemo(() => {
    if (!recurrenceConfig) return [];
    try {
      return RecurrenceCalculator.calculateDates(recurrenceConfig);
    } catch {
      return [];
    }
  }, [recurrenceConfig]);

  // Notificar mudanças
  React.useEffect(() => {
    onRecurrenceChange(recurrenceConfig);
  }, [recurrenceConfig, onRecurrenceChange]);

  const handleTypeSelect = useCallback(
    (type: RecurrenceType | 'none') => {
      setSelectedType(type);

      // Configurações padrão
      switch (type) {
        case 'weekly':
          setWeekdays([getDay(startDate)]);
          break;
        case 'monthly-weekday':
          setWeekNumbers([1]);
          setDayOfWeek(getDay(startDate));
          break;
        case 'monthly-specific':
          setMonthDays([startDate.getDate().toString()]);
          break;
        default:
          setWeekdays([]);
          setWeekNumbers([]);
          setMonthDays([]);
      }

      // Aguardar um frame para garantir que o estado foi atualizado
      if (type !== 'none') {
        setIsInitialized(true);
        setTimeout(() => {
          setShowModal(true);
        }, 100);
      }
    },
    [startDate]
  );

  const toggleWeekday = useCallback((day: number) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }, []);

  const toggleWeekNumber = useCallback((num: number) => {
    setWeekNumbers((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num].sort()
    );
  }, []);

  const toggleMonthDay = useCallback((day: string) => {
    setMonthDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => parseInt(a) - parseInt(b))
    );
  }, []);

  const getSummary = useCallback(() => {
    if (selectedType === 'none') {
      return 'Plantão único selecionado';
    }

    if (!recurrenceConfig) {
      return 'Configure a recorrência';
    }

    const description = RecurrenceCalculator.getRecurrenceDescription(recurrenceConfig.pattern);
    return `${description} • ${previewDates.length} plantões`;
  }, [selectedType, recurrenceConfig, previewDates.length]);

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
              )}>
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
            className="mt-6 flex-row items-center justify-between rounded-xl bg-primary/10 p-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-primary">{getSummary()}</Text>
              <Text className="mt-1 text-xs text-gray-600">
                Até {format(endDate, "dd 'de' MMMM", { locale: ptBR })}
              </Text>
            </View>
            <Ionicons name="settings-outline" size={20} color="#18cb96" />
          </TouchableOpacity>
        )}
      </Card>

      <Modal
        visible={showModal && isInitialized}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}>
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {/* Header */}
            <View className="border-b border-gray-200 bg-white pb-4">
              <View className="flex-row items-center justify-between px-6 pt-4">
                <View className="flex-1">
                  <Text className="text-xl font-bold text-text-dark">Configurar Recorrência</Text>
                  <Text className="mt-1 text-sm text-text-light">
                    {RECURRENCE_OPTIONS.find((opt) => opt.type === selectedType)?.title}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setShowModal(false);
                    setIsInitialized(false);
                  }}
                  className="h-10 w-10 items-center justify-center rounded-xl bg-background-100"
                  activeOpacity={0.7}>
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            <ScrollView
              className="flex-1"
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingVertical: 20,
                paddingBottom: 40,
              }}
              showsVerticalScrollIndicator={false}>
              {/* Data Final */}
              <Card className="mb-6 rounded-2xl p-5">
                <Text className="mb-4 text-lg font-semibold text-text-dark">Data Final</Text>
                <DateField
                  label="Repetir até"
                  value={endDate}
                  onChange={setEndDate}
                  mode="date"
                  minDate={startDate}
                  required
                />
              </Card>

              {/* Configurações por Tipo */}
              {selectedType === 'weekly' && (
                <Card className="mb-6 rounded-2xl p-5">
                  <Text className="mb-4 text-lg font-semibold text-text-dark">Dias da Semana</Text>
                  <Text className="mb-4 text-sm text-text-light">
                    Selecione os dias que o plantão irá se repetir
                  </Text>
                  <View className="flex-row flex-wrap gap-3">
                    {WEEKDAYS.map((day) => (
                      <TouchableOpacity
                        key={day.value}
                        onPress={() => toggleWeekday(day.value)}
                        className={cn(
                          'min-w-[90px] flex-1 items-center rounded-xl border-2 px-4 py-3',
                          weekdays.includes(day.value)
                            ? 'border-primary bg-primary'
                            : 'border-gray-300 bg-white'
                        )}
                        activeOpacity={0.7}>
                        <Text
                          className={cn(
                            'text-sm font-medium',
                            weekdays.includes(day.value) ? 'text-white' : 'text-text-dark'
                          )}>
                          {day.short}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Card>
              )}

              {selectedType === 'monthly-weekday' && (
                <>
                  <Card className="mb-6 rounded-2xl p-5">
                    <Text className="mb-4 text-lg font-semibold text-text-dark">Semana do Mês</Text>
                    <Text className="mb-4 text-sm text-text-light">
                      Escolha em qual semana do mês
                    </Text>
                    <View className="flex-row flex-wrap gap-3">
                      {WEEK_NUMBERS.map((week) => (
                        <TouchableOpacity
                          key={week.value}
                          onPress={() => toggleWeekNumber(week.value)}
                          className={cn(
                            'min-w-[120px] flex-1 items-center rounded-xl border-2 px-4 py-3',
                            weekNumbers.includes(week.value)
                              ? 'border-primary bg-primary'
                              : 'border-gray-300 bg-white'
                          )}
                          activeOpacity={0.7}>
                          <Text
                            className={cn(
                              'text-center text-sm font-medium',
                              weekNumbers.includes(week.value) ? 'text-white' : 'text-text-dark'
                            )}>
                            {week.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Card>

                  <Card className="mb-6 rounded-2xl p-5">
                    <Text className="mb-4 text-lg font-semibold text-text-dark">Dia da Semana</Text>
                    <Text className="mb-4 text-sm text-text-light">Escolha o dia da semana</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="mx-[-8px]">
                      <View className="flex-row gap-3 px-2">
                        {WEEKDAYS.map((day) => (
                          <TouchableOpacity
                            key={day.value}
                            onPress={() => setDayOfWeek(day.value)}
                            className={cn(
                              'min-w-[85px] items-center rounded-xl border-2 px-4 py-3',
                              dayOfWeek === day.value
                                ? 'border-primary bg-primary'
                                : 'border-gray-300 bg-white'
                            )}
                            activeOpacity={0.7}>
                            <Text
                              className={cn(
                                'text-sm font-medium',
                                dayOfWeek === day.value ? 'text-white' : 'text-text-dark'
                              )}>
                              {day.short}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </Card>
                </>
              )}

              {selectedType === 'monthly-specific' && (
                <Card className="mb-6 rounded-2xl p-5">
                  <Text className="mb-4 text-lg font-semibold text-text-dark">Dias do Mês</Text>
                  <Text className="mb-4 text-sm text-text-light">
                    Selecione os dias específicos do mês
                  </Text>
                  <View className="flex-row flex-wrap justify-start gap-2">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                      const dayStr = day.toString();
                      const isSelected = monthDays.includes(dayStr);

                      return (
                        <TouchableOpacity
                          key={day}
                          onPress={() => toggleMonthDay(dayStr)}
                          className={cn(
                            'mb-1 h-12 w-12 items-center justify-center rounded-xl border-2',
                            isSelected ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
                          )}
                          activeOpacity={0.7}>
                          <Text
                            className={cn(
                              'text-sm font-medium',
                              isSelected ? 'text-white' : 'text-text-dark'
                            )}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Card>
              )}

              {/* Preview */}
              {previewDates.length > 0 && (
                <Card className="rounded-2xl p-5">
                  <View className="mb-4 flex-row items-center">
                    <View className="mr-3 h-8 w-8 items-center justify-center rounded-xl bg-primary/20">
                      <Ionicons name="calendar-outline" size={18} color="#18cb96" />
                    </View>
                    <Text className="text-lg font-semibold text-text-dark">
                      {previewDates.length} plantões serão criados
                    </Text>
                  </View>
                  <ScrollView className="max-h-48" showsVerticalScrollIndicator={true}>
                    {previewDates.slice(0, 20).map((date, index) => (
                      <View key={index} className="mb-2 flex-row items-center">
                        <View className="mr-3 h-2 w-2 rounded-full bg-primary" />
                        <Text className="text-sm text-text-light">
                          {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </Text>
                      </View>
                    ))}
                    {previewDates.length > 20 && (
                      <Text className="mt-2 text-sm font-medium text-primary">
                        ... e mais {previewDates.length - 20} plantões
                      </Text>
                    )}
                  </ScrollView>
                </Card>
              )}
            </ScrollView>

            {/* Footer com padding extra para garantir que não seja cortado */}
            <View className="border-t border-gray-200 bg-white">
              <SafeAreaView edges={['bottom']}>
                <View className="px-6 pb-12 pt-5">
                  <TouchableOpacity
                    onPress={() => {
                      setShowModal(false);
                      setIsInitialized(false);
                    }}
                    className="h-12 w-full items-center justify-center rounded-xl bg-primary"
                    activeOpacity={0.8}>
                    <Text className="text-base font-semibold text-white">
                      Confirmar Configuração
                    </Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
