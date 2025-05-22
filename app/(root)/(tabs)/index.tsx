import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDialog } from '@/contexts/DialogContext';
import { format, isSameDay, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CalendarComponent from '@/components/CalendarComponent';
import { useProfile } from '@/hooks/useProfile';
import ShiftFormModal from '@/components/shifts/ShiftFormModal';
import { useToast } from '@/components';
import { useShiftsApi, Shift } from '@/services/shifts-api';
import { formatDate, formatTime, formatCurrency } from '@/utils/formatters';

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

  const { profile, isLoading: isProfileLoading } = useProfile();
  const { showDialog } = useDialog();
  const { showToast } = useToast();
  const router = useRouter();
  const shiftsApi = useShiftsApi();

  const userName = useMemo(() => {
    if (isProfileLoading || !profile) return 'Usuário';

    if (profile.firstName || profile.lastName) {
      return ((profile.firstName || '') + ' ' + (profile.lastName || '')).trim();
    }

    if (profile.name) {
      return profile.name;
    }

    return 'Usuário';
  }, [profile, isProfileLoading]);

  const loadShifts = useCallback(
    async (forceRefresh = false) => {
      if ((isLoading && !forceRefresh) || isProfileLoading) return;

      setIsLoading(true);
      try {
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

        if (!forceRefresh && monthKey === prevMonthRef.current && shifts.length > 0) {
          console.log(`Mês ${monthKey} já carregado, pulando requisição`);
          setIsLoading(false);
          return;
        }

        const formattedStartDate = format(firstDay, 'yyyy-MM-dd');
        const formattedEndDate = format(lastDay, 'yyyy-MM-dd');

        console.log(`Buscando plantões de ${formattedStartDate} até ${formattedEndDate}`);

        const data = await shiftsApi.getShifts({
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        });

        console.log(`Plantões carregados: ${data.length}`);
        setShifts(data);
        setIsDataLoaded(true);

        prevMonthRef.current = monthKey;
      } catch (error: any) {
        console.error('Erro ao carregar plantões:', error);
        showToast(`Erro ao carregar plantões: ${error.message}`, 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [showToast, shiftsApi, currentMonth, isLoading, shifts.length, isProfileLoading]
  );

  useEffect(() => {
    if (!isProfileLoading && !isDataLoaded) {
      console.log('Iniciando carregamento inicial de plantões...');
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
      console.log(`Mês alterado para ${format(currentMonth, 'yyyy-MM')}, recarregando dados...`);

      loadingMonthRef.current = true;

      currentMonthRef.current = monthKey;

      loadShifts().finally(() => {
        loadingMonthRef.current = false;
      });
    }
  }, [currentMonth, isProfileLoading, isDataLoaded, loadShifts]);

  const shiftsForSelectedDate = useMemo(() => {
    if (!shifts || shifts.length === 0) return [];

    console.log(
      `Filtrando ${shifts.length} plantões para data: ${format(selectedDate, 'yyyy-MM-dd')}`
    );

    const filteredShifts = shifts.filter((shift) => {
      if (!shift.date) {
        console.log('Plantão sem data descartado');
        return false;
      }

      try {
        const shiftDate = parseISO(shift.date);
        if (!isValid(shiftDate)) {
          console.log(`Data inválida descartada: ${shift.date}`);
          return false;
        }

        const isSame = isSameDay(shiftDate, selectedDate);

        if (isSame) {
          console.log(`Plantão incluído: ${shift.id} - ${format(shiftDate, 'yyyy-MM-dd')}`);
        }

        return isSame;
      } catch (error) {
        console.error(`Erro ao comparar datas para shift ${shift.id}:`, error);
        return false;
      }
    });

    console.log(`Total de plantões filtrados: ${filteredShifts.length}`);
    return filteredShifts;
  }, [shifts, selectedDate]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadShifts(true);
      showToast('Dados atualizados com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar plantões:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadShifts, showToast]);

  const navigateToAddShift = useCallback(() => {
    console.log('Abrindo modal para adicionar plantão sem data específica');
    setModalInitialDate(null);
    setIsAddModalVisible(true);
  }, []);

  const navigateToAddShiftOnDate = useCallback(() => {
    console.log(`Abrindo modal para adicionar plantão em ${selectedDate.toISOString()}`);
    setModalInitialDate(selectedDate);
    setIsAddModalVisible(true);
  }, [selectedDate]);

  const navigateToShiftDetails = useCallback(
    (shift: Shift) => {
      if (!shift || !shift.id) {
        showToast('Informações do plantão incompletas', 'error');
        return;
      }

      try {
        router.push({
          pathname: `/shifts/${shift.id}`,
        });
      } catch (error) {
        console.error('Erro ao navegar para detalhes do plantão:', error);
        showToast('Erro ao abrir detalhes do plantão', 'error');
      }
    },
    [router, showToast]
  );

  const handleSelectDate = useCallback((date: Date) => {
    console.log(`Data selecionada: ${date.toISOString()}`);
    setSelectedDate(date);
  }, []);

  const handleMonthChange = useCallback(
    (month: Date) => {
      console.log(`Mês alterado para: ${format(month, 'MMMM yyyy', { locale: ptBR })}`);
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
    console.log('Plantão adicionado com sucesso, fechando modal');
    showToast('Plantão adicionado com sucesso!', 'success');
    setIsAddModalVisible(false);

    loadShifts(true);
  }, [showToast, loadShifts]);

  const handleCloseModal = useCallback(() => {
    console.log('Fechando modal');
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
        console.error('Tentativa de renderizar um plantão inválido');
        return null;
      }

      const formatShiftDate = () => {
        try {
          if (!item.date) return 'Data inválida';
          return formatDate(item.date, "dd 'de' MMMM");
        } catch (error) {
          console.error('Erro ao formatar data:', error);
          return 'Data inválida';
        }
      };

      const formatValue = () => {
        try {
          return formatCurrency(item.value);
        } catch (error) {
          console.error('Erro ao formatar valor:', error);
          return 'R$ --';
        }
      };

      const getStatusInfo = () => {
        const status =
          item.status && typeof item.status === 'string' ? item.status.toLowerCase() : 'agendado';

        switch (status) {
          case 'agendado':
            return { label: 'Agendado', color: '#18cb96' }; // primary
          case 'confirmado':
            return { label: 'Confirmado', color: '#10b981' }; // success
          case 'cancelado':
            return { label: 'Cancelado', color: '#ef4444' }; // error
          case 'concluído':
          case 'concluido':
            return { label: 'Concluído', color: '#64748b' }; // text-light
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
                  style={{ backgroundColor: `${statusInfo.color}20` }} // 20% opacity
                >
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
          onPress={navigateToAddShift}>
          <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
          <Text className="ml-2 font-semibold text-white">Adicionar Plantão</Text>
        </TouchableOpacity>
      </View>
    ),
    [navigateToAddShift]
  );

  if (isProfileLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#18cb96" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      <View className="border-b border-background-300 bg-white">
        <View className="flex-row items-center justify-between px-4 py-2">
          <View>
            <Text className="text-xl font-bold text-text-dark">{userName}</Text>
            <Text className="text-sm text-text-light">Seus plantões</Text>
          </View>
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
          contentContainerClassName="px-4 pb-16"
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

      <TouchableOpacity
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
        style={{ elevation: 4 }}
        activeOpacity={0.9}
        onPress={navigateToAddShift}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <ShiftFormModal
        visible={isAddModalVisible}
        onClose={handleCloseModal}
        initialDate={modalInitialDate}
        onSuccess={handleAddSuccess}
      />
    </SafeAreaView>
  );
}
