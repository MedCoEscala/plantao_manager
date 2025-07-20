import { Ionicons } from '@expo/vector-icons';
import {
  format,
  addMonths,
  subMonths,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  getDate,
  isValid,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Dimensions,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface Shift {
  id: string;
  date: string;
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
  onMonthChange?: (month: Date) => void;
  currentMonth?: Date; // Opcional: mês controlado externamente
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Qi', 'S', 'S'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = Math.floor((SCREEN_WIDTH - 40) / 7);
const WEEK_ITEM_WIDTH = Math.floor((SCREEN_WIDTH - 64) / 5);

// Convertendo para StyleSheet para melhor performance
const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0,
    backgroundColor: 'white',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    marginRight: 8,
  },
  rightNavButton: {
    marginRight: 12,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18cb96',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  toggleButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  weekContainer: {
    paddingVertical: 12,
  },
  weekdayContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayLabel: {
    width: DAY_WIDTH,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
});

const CalendarComponent: React.FC<CalendarProps> = ({
  shifts,
  selectedDate,
  onSelectDate,
  onMonthChange,
  currentMonth: externalMonth,
}) => {
  // Use o mês externo se fornecido, caso contrário use state interno
  const [internalMonth, setInternalMonth] = useState(new Date());
  const currentMonth = externalMonth || internalMonth;

  // Para evitar chamadas desnecessárias ao onMonthChange
  const prevMonthRef = useRef<string>('');

  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { locale: ptBR })
  );

  // Gera as datas da semana a partir do início da semana atual (não centraliza na data selecionada)
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const monthDates = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { locale: ptBR });
    const endDate = endOfWeek(monthEnd, { locale: ptBR });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const nextMonth = useCallback(() => {
    const newMonth = addMonths(currentMonth, 1);
    const newMonthKey = `${newMonth.getFullYear()}-${newMonth.getMonth()}`;

    // Só notifica se o mês realmente mudou
    if (newMonthKey !== prevMonthRef.current) {
      prevMonthRef.current = newMonthKey;

      if (onMonthChange) {
        // Notificar o componente pai sobre a mudança, mas não atualizar internamente
        onMonthChange(newMonth);
      } else {
        // Se não estiver sendo controlado externamente, atualize o state interno
        setInternalMonth(newMonth);
      }
    }
  }, [currentMonth, onMonthChange]);

  const prevMonth = useCallback(() => {
    const newMonth = subMonths(currentMonth, 1);
    const newMonthKey = `${newMonth.getFullYear()}-${newMonth.getMonth()}`;

    // Só notifica se o mês realmente mudou
    if (newMonthKey !== prevMonthRef.current) {
      prevMonthRef.current = newMonthKey;

      if (onMonthChange) {
        // Notificar o componente pai sobre a mudança, mas não atualizar internamente
        onMonthChange(newMonth);
      } else {
        // Se não estiver sendo controlado externamente, atualize o state interno
        setInternalMonth(newMonth);
      }
    }
  }, [currentMonth, onMonthChange]);

  const nextWeek = useCallback(() => {
    setCurrentWeekStart((prevWeekStart) => addWeeks(prevWeekStart, 1));
  }, []);

  const prevWeek = useCallback(() => {
    setCurrentWeekStart((prevWeekStart) => subWeeks(prevWeekStart, 1));
  }, []);

  // Inicializa a referência do mês
  useEffect(() => {
    if (currentMonth) {
      prevMonthRef.current = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
    }
  }, []);

  // Memoize a contagem de shifts para reduzir cálculos
  const shiftCountByDate = useMemo(() => {
    const countMap = new Map<string, number>();

    if (!shifts || !Array.isArray(shifts)) return countMap;

    shifts.forEach((shift) => {
      try {
        if (!shift.date) return;

        let shiftDate: Date;

        if (!shift.date.includes('T') && !shift.date.includes('Z')) {
          const [year, month, day] = shift.date.split('-').map(Number);
          shiftDate = new Date(year, month - 1, day);
        } else {
          const dateOnly = shift.date.split('T')[0];
          const [year, month, day] = dateOnly.split('-').map(Number);
          shiftDate = new Date(year, month - 1, day);
        }

        if (!isValid(shiftDate)) return;

        const dateKey = format(shiftDate, 'yyyy-MM-dd');
        countMap.set(dateKey, (countMap.get(dateKey) || 0) + 1);
      } catch (error) {
        console.error('Erro ao processar data do plantão:', error);
      }
    });
    return countMap;
  }, [shifts]);

  const countShifts = useCallback(
    (date: Date) => {
      try {
        const dateKey = format(date, 'yyyy-MM-dd');
        return shiftCountByDate.get(dateKey) || 0;
      } catch {
        return 0;
      }
    },
    [shiftCountByDate]
  );

  function WeekDay({ item }: { item: Date }) {
    const isSelected = isSameDay(item, selectedDate);
    const isTodayDate = isToday(item);
    const shiftCount = countShifts(item);
    const hasShift = shiftCount > 0;
    const weekdayLetter = format(item, 'EEEEE', { locale: ptBR }).toUpperCase();

    // Classes Tailwind dinâmicas
    const containerClasses = useMemo(() => {
      const baseClasses = 'mx-1 w-20 h-20 rounded-2xl overflow-hidden justify-center items-center';

      if (isSelected) {
        return `${baseClasses} bg-primary shadow-lg`;
      } else if (isTodayDate) {
        return `${baseClasses} bg-white border-2 border-primary`;
      } else if (hasShift) {
        return `${baseClasses} bg-primary/20 border border-gray-200`;
      } else {
        return `${baseClasses} bg-white border border-gray-200`;
      }
    }, [isSelected, isTodayDate, hasShift]);

    const weekdayTextClasses = useMemo(() => {
      const baseClasses = 'text-xs font-bold mb-1';
      if (isSelected) return `${baseClasses} text-white`;
      if (isTodayDate) return `${baseClasses} text-primary`;
      return `${baseClasses} text-gray-500`;
    }, [isSelected, isTodayDate]);

    const dateTextClasses = useMemo(() => {
      const baseClasses = 'text-lg font-bold';
      if (isSelected) return `${baseClasses} text-white`;
      if (isTodayDate) return `${baseClasses} text-primary`;
      return `${baseClasses} text-text-dark`;
    }, [isSelected, isTodayDate]);

    const badgeContainerClasses = useMemo(() => {
      const baseClasses = 'mt-1 min-w-[18px] px-1.5 py-0.5 rounded-full items-center';
      return isSelected ? `${baseClasses} bg-white` : `${baseClasses} bg-primary`;
    }, [isSelected]);

    const badgeTextClasses = useMemo(() => {
      const baseClasses = 'text-[10px] font-bold';
      return isSelected ? `${baseClasses} text-primary` : `${baseClasses} text-white`;
    }, [isSelected]);

    return (
      <Pressable
        onPress={() => onSelectDate(item)}
        className={containerClasses}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}>
        <Text className={weekdayTextClasses}>{weekdayLetter}</Text>
        <Text className={dateTextClasses}>{getDate(item)}</Text>

        {hasShift && (
          <View className={badgeContainerClasses}>
            <Text className={badgeTextClasses}>{shiftCount}</Text>
          </View>
        )}
      </Pressable>
    );
  }

  // Memoize o componente WeekDay para evitar re-renders
  const MemoizedWeekDay = React.memo(WeekDay);

  const renderMonthDay = useCallback(
    (date: Date, index: number) => {
      const isSelected = isSameDay(date, selectedDate);
      const isTodayDate = isToday(date);
      const isCurrentMonth = isSameMonth(date, currentMonth);
      const shiftCount = countShifts(date);
      const hasShift = shiftCount > 0;

      // Usando tipos TypeScript corretos
      const dayContainerStyle: ViewStyle = {
        margin: 2,
        width: DAY_WIDTH,
        height: DAY_WIDTH,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isSelected
          ? '#18cb96'
          : hasShift && !isSelected
            ? '#18cb9620'
            : 'transparent',
        borderWidth: isTodayDate && !isSelected ? 1.5 : 0,
        borderColor: isTodayDate && !isSelected ? '#18cb96' : 'transparent',
        opacity: !isCurrentMonth ? 0.4 : 1,
      };

      const dateTextStyle: TextStyle = {
        fontSize: 12,
        fontWeight: isSelected || (isTodayDate && !isSelected) ? '700' : '500',
        color: isSelected
          ? 'white'
          : !isCurrentMonth
            ? '#64748b'
            : isTodayDate && !isSelected
              ? '#18cb96'
              : '#1e293b',
      };

      const badgeContainerStyle: ViewStyle = {
        position: 'absolute',
        bottom: 4,
        alignItems: 'center',
      };

      const badgeStyle: ViewStyle = {
        paddingHorizontal: 5,
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isSelected ? 'white' : '#18cb96',
      };

      const badgeTextStyle: TextStyle = {
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
        color: isSelected ? '#18cb96' : 'white',
      };

      return (
        <Pressable
          key={index}
          style={dayContainerStyle}
          onPress={() => onSelectDate(date)}
          android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', radius: DAY_WIDTH / 2 }}>
          <Text style={dateTextStyle}>{getDate(date)}</Text>

          {hasShift && (
            <View style={badgeContainerStyle}>
              <View style={badgeStyle}>
                <Text style={badgeTextStyle}>{shiftCount}</Text>
              </View>
            </View>
          )}
        </Pressable>
      );
    },
    [currentMonth, selectedDate, countShifts, onSelectDate]
  );

  const toggleCalendarView = useCallback(() => {
    setCalendarView(calendarView === 'week' ? 'month' : 'week');
  }, [calendarView]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>
          {calendarView === 'month'
            ? format(currentMonth, 'MMMM yyyy', { locale: ptBR })
            : 'Minha Agenda'}
        </Text>
        <View style={styles.buttonContainer}>
          {calendarView === 'month' && (
            <>
              <Pressable style={styles.navButton} onPress={prevMonth}>
                <Ionicons name="chevron-back" size={16} color="#1e293b" />
              </Pressable>
              <Pressable style={[styles.navButton, styles.rightNavButton]} onPress={nextMonth}>
                <Ionicons name="chevron-forward" size={16} color="#1e293b" />
              </Pressable>
            </>
          )}
          {calendarView === 'week' && (
            <>
              <Pressable style={styles.navButton} onPress={prevWeek}>
                <Ionicons name="chevron-back" size={16} color="#1e293b" />
              </Pressable>
              <Pressable style={[styles.navButton, styles.rightNavButton]} onPress={nextWeek}>
                <Ionicons name="chevron-forward" size={16} color="#1e293b" />
              </Pressable>
            </>
          )}
          <Pressable style={styles.toggleButton} onPress={toggleCalendarView}>
            <Ionicons
              name={calendarView === 'week' ? 'calendar-outline' : 'list-outline'}
              size={16}
              color="#fff"
            />
            <Text style={styles.toggleButtonText}>
              {calendarView === 'week' ? 'Mês' : 'Semana'}
            </Text>
          </Pressable>
        </View>
      </View>

      {calendarView === 'week' && (
        <View style={styles.weekContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12 }}
            data={weekDates}
            keyExtractor={(_, index) => `week-day-${index}`}
            renderItem={({ item, index }) => (
              <MemoizedWeekDay key={`week-day-${index}`} item={item} />
            )}
            initialNumToRender={7}
            maxToRenderPerBatch={7}
            windowSize={7}
          />
        </View>
      )}

      {calendarView === 'month' && (
        <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
          <View style={styles.weekdayContainer}>
            {WEEKDAYS.map((day, index) => (
              <View key={`weekday-${index}`} style={styles.weekdayLabel}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.monthGrid}>
            {monthDates.map((date, index) => renderMonthDay(date, index))}
          </View>
        </View>
      )}

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>
          {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
        </Text>
      </View>
    </View>
  );
};

export default CalendarComponent;
