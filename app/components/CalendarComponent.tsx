// app/components/CalendarComponent.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  format,
  addMonths,
  subMonths,
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  getDate,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Define o tipo para um plantão (shift)
interface Shift {
  id: string;
  date: string; // ISO date string
  locationId: string;
  startTime: string;
  endTime: string;
  value: number;
  status: string;
}

interface CalendarProps {
  shifts: Shift[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Qi', 'S', 'S']; // Iniciais dos dias da semana
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = Math.floor((SCREEN_WIDTH - 32) / 7); // 32 = padding horizontal total
const WEEK_ITEM_WIDTH = Math.floor((SCREEN_WIDTH - 48) / 5); // 5 dias visíveis por vez, com padding

// Constantes para cores
const COLORS = {
  primary: '#18cb96',
  white: '#FFFFFF',
  light: '#f8f9fa',
  selected: '#18cb96',
  today: '#18cb96',
  textDark: '#1e293b',
  textLight: '#64748b',
  hasShifts: {
    bg: '#18cb9620', // Cor de fundo para dias com plantões (com 20% de opacidade)
    dot: '#18cb96', // Cor do marcador/indicador de plantões
  },
};

const CalendarComponent: React.FC<CalendarProps> = ({ shifts, selectedDate, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');

  // Calcula as datas para a visualização semanal
  const weekDates = useMemo(() => {
    const today = new Date();
    const dates = [];
    for (let i = -3; i < 11; i++) {
      dates.push(addDays(today, i));
    }
    return dates;
  }, []);

  // Calcula as datas para a visualização mensal
  const monthDates = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { locale: ptBR });
    const endDate = endOfWeek(monthEnd, { locale: ptBR });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Navega para o próximo mês
  const nextMonth = useCallback(() => {
    setCurrentMonth(addMonths(currentMonth, 1));
  }, [currentMonth]);

  // Navega para o mês anterior
  const prevMonth = useCallback(() => {
    setCurrentMonth(subMonths(currentMonth, 1));
  }, [currentMonth]);

  // Verifica se uma data tem plantões
  const hasShifts = useCallback(
    (date: Date) => {
      return shifts.some((shift) => {
        const shiftDate = parseISO(shift.date);
        return isSameDay(shiftDate, date);
      });
    },
    [shifts]
  );

  // Conta o número de plantões em uma data
  const countShifts = useCallback(
    (date: Date) => {
      return shifts.filter((shift) => {
        const shiftDate = parseISO(shift.date);
        return isSameDay(shiftDate, date);
      }).length;
    },
    [shifts]
  );

  // Renderiza um dia na visualização semanal
  const renderWeekDay = useCallback(
    ({ item }: { item: Date }) => {
      const isSelected = isSameDay(item, selectedDate);
      const isTodayDate = isToday(item);
      const shiftCount = countShifts(item);
      const hasShift = shiftCount > 0;
      const weekdayLetter = format(item, 'EEEEE', { locale: ptBR }).toUpperCase();

      return (
        <Pressable
          className={`mx-1 overflow-hidden rounded-2xl ${
            isSelected
              ? 'bg-primary shadow-sm shadow-primary/30'
              : isTodayDate
                ? 'border-[1.5px] border-primary'
                : hasShift
                  ? 'bg-[#18cb9620]' // Fundo verde claro para dias com plantões
                  : ''
          }`}
          style={{ width: WEEK_ITEM_WIDTH }}
          onPress={() => onSelectDate(item)}>
          <View className={`items-center justify-center py-2 ${isSelected ? 'bg-primary' : ''}`}>
            {/* Dia da semana (iniciais) */}
            <Text
              className={`mb-1 text-xs font-bold ${
                isSelected ? 'text-white' : isTodayDate ? 'text-primary' : 'text-text-light'
              }`}>
              {weekdayLetter}
            </Text>

            {/* Número do dia */}
            <Text
              className={`text-lg font-bold ${
                isSelected ? 'text-white' : isTodayDate ? 'text-primary' : 'text-text-dark'
              }`}>
              {getDate(item)}
            </Text>

            {/* Indicador de plantões */}
            {hasShift && (
              <View
                className={`mt-1 min-w-[18px] items-center rounded-full px-2 py-0.5 ${
                  isSelected ? 'bg-white' : 'bg-primary'
                }`}>
                <Text className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-white'}`}>
                  {shiftCount}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      );
    },
    [selectedDate, countShifts, onSelectDate]
  );

  // Renderiza um dia na visualização mensal
  const renderMonthDay = useCallback(
    (date: Date, index: number) => {
      const isSelected = isSameDay(date, selectedDate);
      const isTodayDate = isToday(date);
      const isCurrentMonth = isSameMonth(date, currentMonth);
      const hasShift = hasShifts(date);

      return (
        <TouchableOpacity
          key={index}
          className={`m-0.5 items-center justify-center rounded-md ${
            isSelected
              ? 'bg-primary'
              : isTodayDate && !isSelected
                ? 'border-[1.5px] border-primary'
                : ''
          } ${!isCurrentMonth ? 'opacity-40' : ''}`}
          style={{
            width: DAY_WIDTH,
            height: DAY_WIDTH,
            backgroundColor: hasShift && !isSelected ? COLORS.hasShifts.bg : undefined,
          }}
          activeOpacity={0.7}
          onPress={() => onSelectDate(date)}>
          <Text
            className={`text-xs font-medium ${
              isSelected
                ? 'text-white'
                : !isCurrentMonth
                  ? 'text-text-light'
                  : isTodayDate && !isSelected
                    ? 'font-bold text-primary'
                    : 'text-text-dark'
            }`}>
            {getDate(date)}
          </Text>

          {/* Indicador de plantão (ponto abaixo do dia) */}
          {hasShift && (
            <View
              className={`absolute bottom-1 h-1 w-1 rounded-full ${
                isSelected ? 'bg-white' : 'bg-primary'
              }`}
            />
          )}
        </TouchableOpacity>
      );
    },
    [currentMonth, selectedDate, hasShifts, onSelectDate]
  );

  // Alternância entre visualizações semanal e mensal
  const toggleCalendarView = () => {
    setCalendarView(calendarView === 'week' ? 'month' : 'week');
  };

  return (
    <View className="border-b border-background-300 bg-white">
      {/* Cabeçalho do calendário */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Text className="text-sm font-semibold text-text-dark">
          {calendarView === 'month'
            ? format(currentMonth, 'MMMM yyyy', { locale: ptBR })
            : 'Minha Agenda'}
        </Text>
        <View className="flex-row items-center">
          {calendarView === 'month' && (
            <>
              <TouchableOpacity
                className="mr-1 h-7 w-7 items-center justify-center rounded-full bg-background-100"
                onPress={prevMonth}>
                <Ionicons name="chevron-back" size={16} color="#1e293b" />
              </TouchableOpacity>
              <TouchableOpacity
                className="mr-1.5 h-7 w-7 items-center justify-center rounded-full bg-background-100"
                onPress={nextMonth}>
                <Ionicons name="chevron-forward" size={16} color="#1e293b" />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            className="flex-row items-center rounded-xl bg-primary px-2 py-1"
            onPress={toggleCalendarView}>
            <Ionicons
              name={calendarView === 'week' ? 'calendar-outline' : 'list-outline'}
              size={14}
              color="#fff"
            />
            <Text className="ml-1 text-xs font-medium text-white">
              {calendarView === 'week' ? 'Mês' : 'Semana'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Visualização semanal */}
      {calendarView === 'week' && (
        <View className="py-1.5">
          <FlatList
            data={weekDates}
            renderItem={renderWeekDay}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={WEEK_ITEM_WIDTH}
            decelerationRate="fast"
            contentContainerClassName="px-2"
            keyExtractor={(item) => item.toISOString()}
            getItemLayout={(data, index) => ({
              length: WEEK_ITEM_WIDTH,
              offset: WEEK_ITEM_WIDTH * index,
              index,
            })}
          />
        </View>
      )}

      {/* Visualização mensal */}
      {calendarView === 'month' && (
        <View className="px-1 pb-1.5">
          {/* Dias da semana */}
          <View className="mb-1 flex-row">
            {WEEKDAYS.map((day, index) => (
              <View
                key={`weekday-${index}`}
                className="items-center py-1.5"
                style={{ width: DAY_WIDTH }}>
                <Text className="text-xs font-medium text-text-light">{day}</Text>
              </View>
            ))}
          </View>

          {/* Grid de dias */}
          <View className="flex-row flex-wrap">
            {monthDates.map((date, index) => renderMonthDay(date, index))}
          </View>
        </View>
      )}

      {/* Data selecionada */}
      <View className="border-t border-background-100 px-4 py-1.5">
        <Text className="text-sm font-semibold text-text-dark">
          {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
        </Text>
      </View>
    </View>
  );
};

export default CalendarComponent;
