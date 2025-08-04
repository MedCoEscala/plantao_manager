import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import {
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isValid,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, useNotification } from '../../components';
import CalendarComponent from '../../components/CalendarComponent';
import ShiftFormModal from '../../components/shifts/ShiftFormModal';
import FloatingButton from '../../components/ui/FloatingButton';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { useDialog } from '../../contexts/DialogContext';
import { useNotificationsContext } from '../../contexts/NotificationContext';
import { useShiftsSync } from '../../contexts/ShiftsSyncContext';
import { useProfile } from '../../hooks/useProfile';
import { useShiftsApi, Shift } from '../../services/shifts-api';
import formatters, { formatDate, formatTime, formatCurrency } from '../../utils/formatters';

export default function ShiftsScreen() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<Date | null>(null);
  const prevMonthRef = useRef<string>('');
  const currentMonthRef = useRef<string>('');

  const { profile, loading: isProfileLoading } = useProfile();
  const { showDialog } = useDialog();
  const { showError, showSuccess } = useNotification();
  const { subscribeToRefresh } = useShiftsSync();
  const router = useRouter();
  const shiftsApi = useShiftsApi();
  const { sendTestNotification, isRegistered } = useNotificationsContext();

  const insets = useSafeAreaInsets();

  const userName = useMemo(() => {
    if (isProfileLoading || !profile) return 'Usuário';

    if (profile.name || profile.name?.trim()) {
      return profile.name.trim();
    }

    const firstName = profile.firstName?.trim() || '';
    const lastName = profile.lastName?.trim() || '';

    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }

    if (profile.email) {
      const emailName = profile.email.split('@')[0];
      return emailName || 'Usuário';
    }

    return 'Usuário';
  }, [profile, isProfileLoading]);

  const loadShifts = useCallback(
    async (forceRefresh = false) => {
      if ((isLoading && !forceRefresh) || isProfileLoading) return;
      const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

      if (!forceRefresh && monthKey === prevMonthRef.current && shifts.length > 0) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const firstDayVisible = startOfWeek(monthStart, { locale: ptBR });
        const lastDayVisible = endOfWeek(monthEnd, { locale: ptBR });

        const formattedStartDate = format(firstDayVisible, 'yyyy-MM-dd');
        const formattedEndDate = format(lastDayVisible, 'yyyy-MM-dd');

        const data = await shiftsApi.getShifts({
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        });

        setShifts(data);
        setIsDataLoaded(true);

        prevMonthRef.current = monthKey;
      } catch (error: any) {
        showError(`Erro ao carregar plantões: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [showError, shiftsApi, currentMonth, isLoading, shifts.length, isProfileLoading]
  );

  useEffect(() => {
    if (!isProfileLoading && !isDataLoaded) {
      setIsDataLoaded(true);
      loadShifts(true).catch(() => {
        setTimeout(() => {
          if (!isProfileLoading) {
            setIsDataLoaded(false);
          }
        }, 10000);
      });
    }
  }, [isProfileLoading, isDataLoaded, loadShifts]);

  const loadingMonthRef = useRef(false);

  useEffect(() => {
    const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

    if (
      !isProfileLoading &&
      isDataLoaded &&
      monthKey !== currentMonthRef.current &&
      !loadingMonthRef.current
    ) {
      loadingMonthRef.current = true;

      currentMonthRef.current = monthKey;

      loadShifts().finally(() => {
        loadingMonthRef.current = false;
      });
    }
  }, [currentMonth, isProfileLoading, isDataLoaded, loadShifts]);

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(() => {
      loadShifts(true);
    });

    return unsubscribe;
  }, [subscribeToRefresh, loadShifts]);

  const shiftsForSelectedDate = useMemo(() => {
    if (!shifts || shifts.length === 0) return [];

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

    const filteredShifts = shifts.filter((shift) => {
      if (!shift.date) return false;

      try {
        const shiftDate = formatters.normalizeToLocalDate(shift.date);
        if (!isValid(shiftDate)) return false;

        const shiftDateStr = format(shiftDate, 'yyyy-MM-dd');
        return shiftDateStr === selectedDateStr;
      } catch (error) {
        return false;
      }
    });

    return filteredShifts;
  }, [shifts, selectedDate]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadShifts(true);
      showSuccess('Dados atualizados com sucesso!');
    } catch (error) {
    } finally {
      setIsRefreshing(false);
    }
  }, [loadShifts, showSuccess]);

  const navigateToAddShift = useCallback(
    (useSpecificDate?: Date) => {
      const dateToUse = useSpecificDate || selectedDate;

      setModalInitialDate(dateToUse);
      setIsAddModalVisible(true);
    },
    [selectedDate]
  );

  const navigateToAddShiftOnDate = useCallback(() => {
    navigateToAddShift(selectedDate);
  }, [selectedDate, navigateToAddShift]);

  const navigateToShiftDetails = useCallback(
    (shift: Shift) => {
      if (!shift || !shift.id) {
        showError('Informações do plantão incompletas');
        return;
      }

      try {
        router.push({
          pathname: `/shifts/${shift.id}`,
        });
      } catch (error) {
        showError('Erro ao abrir detalhes do plantão');
      }
    },
    [router, showError]
  );

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleMonthChange = useCallback(
    (month: Date) => {
      if (
        month.getMonth() !== currentMonth.getMonth() ||
        month.getFullYear() !== currentMonth.getFullYear()
      ) {
        setCurrentMonth(month);
      }
    },
    [currentMonth]
  );

  const handleAddSuccess = useCallback(() => {
    showSuccess('Plantão adicionado com sucesso!');
    setIsAddModalVisible(false);

    loadShifts(true);
  }, [showSuccess, loadShifts]);

  const handleCloseModal = useCallback(() => {
    setIsAddModalVisible(false);
  }, []);

  const getLocationInfo = (shift: Shift) => {
    if (shift.location) {
      return {
        name: shift.location.name || 'Local sem nome',
        color: shift.location.color || '#64748b',
      };
    }

    return {
      name: 'Local não informado',
      color: '#64748b',
    };
  };

  const renderShiftItem = useCallback(
    ({ item }: { item: Shift }) => {
      if (!item || !item.id) {
        return null;
      }

      const formatShiftDate = () => {
        try {
          if (!item.date) return 'Data inválida';
          return formatDate(item.date, "dd 'de' MMMM");
        } catch (error) {
          return 'Data inválida';
        }
      };

      const formatValue = () => {
        try {
          return formatCurrency(item.value);
        } catch (error) {
          return 'R$ --';
        }
      };

      const getStatusInfo = () => {
        const status =
          item.status && typeof item.status === 'string' ? item.status.toLowerCase() : 'agendado';

        switch (status) {
          case 'agendado':
            return { label: 'Agendado', color: '#18cb96' };
          case 'confirmado':
            return { label: 'Confirmado', color: '#10b981' };
          case 'cancelado':
            return { label: 'Cancelado', color: '#ef4444' };
          case 'concluído':
          case 'concluido':
            return { label: 'Concluído', color: '#64748b' };
          default:
            return { label: item.status || 'Agendado', color: '#64748b' };
        }
      };

      const statusInfo = getStatusInfo();
      const locationInfo = getLocationInfo(item);

      return (
        <TouchableOpacity
          key={item.id}
          className="mb-3 overflow-hidden rounded-xl bg-white shadow-sm"
          activeOpacity={0.7}
          onPress={() => navigateToShiftDetails(item)}>
          <View className="p-4">
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-base font-bold text-text-dark">{formatShiftDate()}</Text>
                <Text className="mt-2 text-sm text-text-light">
                  {item.startTime
                    ? `${formatTime(item.startTime)}${item.endTime ? ` - ${formatTime(item.endTime)}` : ''}`
                    : 'Horário não definido'}
                </Text>
                <View className="mt-3 flex-row items-center">
                  <View
                    className="mr-2 h-3 w-3 rounded-full"
                    style={{ backgroundColor: locationInfo.color }}
                  />
                  <Text className="text-sm text-text-light">{locationInfo.name}</Text>
                </View>
              </View>
              <View className="items-end justify-between">
                <View
                  className="rounded-full px-3 py-1"
                  style={{ backgroundColor: `${statusInfo.color}20` }}>
                  <Text className="text-xs font-semibold" style={{ color: statusInfo.color }}>
                    {statusInfo.label}
                  </Text>
                </View>
                <Text className="mt-2 text-base font-semibold text-primary">{formatValue()}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [navigateToShiftDetails, getLocationInfo]
  );

  const renderEmptyShiftsForDate = useCallback(
    () => (
      <View className="mt-4 items-center justify-center rounded-xl bg-white p-5 shadow-sm">
        <Ionicons name="calendar-outline" size={40} color="#cbd5e1" />
        <Text className="mt-2 text-center text-sm font-medium text-text-dark">
          Nenhum plantão para esta data
        </Text>
        <Text className="mb-3 text-center text-xs text-text-light">
          Você não tem plantões agendados para{' '}
          {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}.
        </Text>
        <TouchableOpacity
          className="flex-row items-center rounded-lg bg-primary px-3 py-1.5"
          activeOpacity={0.8}
          onPress={navigateToAddShiftOnDate}>
          <Ionicons name="add-circle-outline" size={16} color="#ffffff" />
          <Text className="ml-1 text-xs font-semibold text-white">Adicionar Plantão</Text>
        </TouchableOpacity>
      </View>
    ),
    [selectedDate, navigateToAddShiftOnDate]
  );

  const renderEmptyContent = useCallback(
    () => (
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="calendar-outline" size={70} color="#cbd5e1" />
        <Text className="mb-2 mt-4 text-center text-lg font-bold text-text-dark">
          Sem plantões agendados
        </Text>
        <Text className="mb-6 text-center text-sm text-text-light">
          Você ainda não tem plantões agendados. Adicione seu primeiro plantão para começar a
          gerenciar sua agenda.
        </Text>
        <TouchableOpacity
          className="flex-row items-center rounded-xl bg-primary px-5 py-2.5 shadow-sm"
          activeOpacity={0.8}
          onPress={() => navigateToAddShift()}>
          <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
          <Text className="ml-2 font-semibold text-white">Adicionar Plantão</Text>
        </TouchableOpacity>
      </View>
    ),
    [navigateToAddShift]
  );

  const getFloatingButtonPosition = () => {
    if (Platform.OS === 'android') {
      const tabBarHeight = 60;
      const navigationBarHeight = Math.max(insets.bottom, 10);
      const spacing = 20;

      return {
        bottom: tabBarHeight + navigationBarHeight + spacing,
        right: 24,
      };
    }
    return {
      bottom: 60 + insets.bottom + 24,
      right: 24,
    };
  };

  const getContentPadding = () => {
    if (Platform.OS === 'android') {
      const tabBarHeight = 60;
      const navigationBarHeight = Math.max(insets.bottom, 10);
      const fabSpace = 80;
      return tabBarHeight + navigationBarHeight + fabSpace;
    }
    return 80 + insets.bottom;
  };

  return (
    <ScreenWrapper className="flex-1 bg-background">
      <View className="bg-white">
        <View className="flex-row items-center justify-between px-4 py-2">
          <View>
            <Text className="text-xl font-bold text-text-dark">{userName}</Text>
            <Text className="text-sm text-text-light">Seus plantões</Text>
          </View>
          <View className="flex-row items-center">
            {/* Botão de Teste de Notificação */}
            {/* <TouchableOpacity
              className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-background-100"
              onPress={sendTestNotification}
              disabled={!isRegistered}>
              <Ionicons
                name="notifications-outline"
                size={18}
                color={!isRegistered ? '#cbd5e1' : '#1e293b'}
              />
            </TouchableOpacity> */}

            {/* Botão de Refresh (Existente) */}
            <TouchableOpacity
              className="h-9 w-9 items-center justify-center rounded-full bg-background-100"
              onPress={handleRefresh}
              disabled={isRefreshing}>
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#18cb96" />
              ) : (
                <Ionicons name="refresh-outline" size={18} color="#1e293b" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <CalendarComponent
        shifts={shifts.map((shift) => ({
          ...shift,
          locationId: shift.locationId ?? '',
          startTime: shift.startTime ?? '',
          endTime: shift.endTime ?? '',
          status: shift.status ?? '',
        }))}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        onMonthChange={handleMonthChange}
        currentMonth={currentMonth}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#18cb96" />
          <Text className="mt-4 text-text-light">Carregando plantões...</Text>
        </View>
      ) : shifts.length === 0 && !isRefreshing ? (
        renderEmptyContent()
      ) : (
        <FlatList
          className="flex-1"
          contentContainerClassName="px-4"
          contentContainerStyle={{ paddingBottom: getContentPadding() }}
          data={shiftsForSelectedDate}
          keyExtractor={(item) => item.id}
          renderItem={renderShiftItem}
          ListHeaderComponent={() => (
            <View className="mb-2 mt-3">
              <Text className="text-base font-bold text-text-dark">
                Plantões em {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </Text>
            </View>
          )}
          ListEmptyComponent={renderEmptyShiftsForDate}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#18cb96"
              colors={['#18cb96']}
            />
          }
        />
      )}

      <FloatingButton
        onPress={() => navigateToAddShift()}
        selectedDate={selectedDate}
        style={getFloatingButtonPosition()}
      />

      <ShiftFormModal
        visible={isAddModalVisible}
        onClose={handleCloseModal}
        initialDate={modalInitialDate}
        onSuccess={handleAddSuccess}
      />
    </ScreenWrapper>
  );
}
