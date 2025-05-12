import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, FlatList, Dimensions } from 'react-native';
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
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Qi', 'S', 'S'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = Math.floor((SCREEN_WIDTH - 40) / 7);
const WEEK_ITEM_WIDTH = Math.floor((SCREEN_WIDTH - 64) / 5);

const CalendarComponent: React.FC<CalendarProps> = ({ shifts, selectedDate, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');

  const weekDates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 21 }, (_, i) => addDays(today, i - 10));
  }, []);

  const monthDates = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { locale: ptBR });
    const endDate = endOfWeek(monthEnd, { locale: ptBR });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const nextMonth = useCallback(() => {
    setCurrentMonth(addMonths(currentMonth, 1));
  }, [currentMonth]);

  const prevMonth = useCallback(() => {
    setCurrentMonth(subMonths(currentMonth, 1));
  }, [currentMonth]);

  const countShifts = useCallback(
    (date: Date) => {
      return shifts.filter((shift) => {
        const shiftDate = parseISO(shift.date);
        return isSameDay(shiftDate, date);
      }).length;
    },
    [shifts]
  );

  function WeekDay({ item }: { item: Date }) {
    const isSelected = isSameDay(item, selectedDate);
    const isTodayDate = isToday(item);
    const shiftCount = countShifts(item);
    const hasShift = shiftCount > 0;
    const weekdayLetter = format(item, 'EEEEE', { locale: ptBR }).toUpperCase();

    return (
      <Pressable
        onPress={() => onSelectDate(item)}
        style={{
          marginHorizontal: 4,
          width: WEEK_ITEM_WIDTH,
          height: 80,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: isSelected
            ? '#18cb96'
            : isTodayDate
              ? 'white'
              : hasShift
                ? '#18cb9620'
                : 'white',
          borderWidth: isTodayDate && !isSelected ? 1.5 : hasShift ? 0 : 1,
          borderColor: isTodayDate && !isSelected ? '#18cb96' : '#e5e7eb',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: isSelected ? '#18cb96' : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: isSelected ? 3 : 0,
        }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            marginBottom: 4,
            color: isSelected ? 'white' : isTodayDate ? '#18cb96' : '#64748b',
          }}>
          {weekdayLetter}
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: isSelected ? 'white' : isTodayDate ? '#18cb96' : '#1e293b',
          }}>
          {getDate(item)}
        </Text>

        {hasShift && (
          <View
            style={{
              marginTop: 4,
              minWidth: 18,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 10,
              backgroundColor: isSelected ? 'white' : '#18cb96',
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: isSelected ? '#18cb96' : 'white',
              }}>
              {shiftCount}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  const renderMonthDay = useCallback(
    (date: Date, index: number) => {
      const isSelected = isSameDay(date, selectedDate);
      const isTodayDate = isToday(date);
      const isCurrentMonth = isSameMonth(date, currentMonth);
      const shiftCount = countShifts(date);
      const hasShift = shiftCount > 0;

      return (
        <Pressable
          key={index}
          style={{
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
          }}
          onPress={() => onSelectDate(date)}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: isSelected || (isTodayDate && !isSelected) ? '700' : '500',
              color: isSelected
                ? 'white'
                : !isCurrentMonth
                  ? '#64748b'
                  : isTodayDate && !isSelected
                    ? '#18cb96'
                    : '#1e293b',
            }}>
            {getDate(date)}
          </Text>

          {hasShift && (
            <View style={{ position: 'absolute', bottom: 4, alignItems: 'center' }}>
              <View
                style={{
                  paddingHorizontal: 5,
                  borderRadius: 10,
                  minWidth: 16,
                  height: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: isSelected ? 'white' : '#18cb96',
                }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    textAlign: 'center',
                    color: isSelected ? '#18cb96' : 'white',
                  }}>
                  {shiftCount}
                </Text>
              </View>
            </View>
          )}
        </Pressable>
      );
    },
    [currentMonth, selectedDate, countShifts, onSelectDate]
  );

  const toggleCalendarView = () => {
    setCalendarView(calendarView === 'week' ? 'month' : 'week');
  };

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: 'white' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>
          {calendarView === 'month'
            ? format(currentMonth, 'MMMM yyyy', { locale: ptBR })
            : 'Minha Agenda'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {calendarView === 'month' && (
            <>
              <Pressable
                style={{
                  marginRight: 8,
                  height: 32,
                  width: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 16,
                  backgroundColor: '#f8fafc',
                }}
                onPress={prevMonth}>
                <Ionicons name="chevron-back" size={16} color="#1e293b" />
              </Pressable>
              <Pressable
                style={{
                  marginRight: 12,
                  height: 32,
                  width: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 16,
                  backgroundColor: '#f8fafc',
                }}
                onPress={nextMonth}>
                <Ionicons name="chevron-forward" size={16} color="#1e293b" />
              </Pressable>
            </>
          )}
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#18cb96',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
            }}
            onPress={toggleCalendarView}>
            <Ionicons
              name={calendarView === 'week' ? 'calendar-outline' : 'list-outline'}
              size={16}
              color="#fff"
            />
            <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: '500', color: 'white' }}>
              {calendarView === 'week' ? 'Mês' : 'Semana'}
            </Text>
          </Pressable>
        </View>
      </View>

      {calendarView === 'week' && (
        <View style={{ paddingVertical: 12 }}>
          <FlatList
            data={weekDates}
            renderItem={({ item }) => <WeekDay item={item} />}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12 }}
            keyExtractor={(item) => item.toISOString()}
            getItemLayout={(data, index) => ({
              length: WEEK_ITEM_WIDTH + 8,
              offset: (WEEK_ITEM_WIDTH + 8) * index,
              index,
            })}
            initialScrollIndex={10}
          />
        </View>
      )}

      {calendarView === 'month' && (
        <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            {WEEKDAYS.map((day, index) => (
              <View
                key={`weekday-${index}`}
                style={{
                  width: DAY_WIDTH,
                  alignItems: 'center',
                  paddingVertical: 8,
                }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748b' }}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {monthDates.map((date, index) => renderMonthDay(date, index))}
          </View>
        </View>
      )}

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>
          {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
        </Text>
      </View>
    </View>
  );
};

export default CalendarComponent;
