import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDialog } from '@/contexts/DialogContext';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CalendarComponent from '@/components/CalendarComponent';
import { useProfile } from '@/hooks/useProfile';
import ShiftFormModal from '@/components/shifts/ShiftFormModal';
import { useToast } from '@/components';
import { useShiftsApi, Shift } from '@/services/shifts-api';

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

  const { profile, isLoading: isProfileLoading } = useProfile();
  const { showDialog } = useDialog();
  const { showToast } = useToast();
  const router = useRouter();
  const shiftsApi = useShiftsApi();

  // Extract user name from profile
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

  // Carrega os plantões do backend
  const loadShifts = useCallback(
    async (forceRefresh = false) => {
      if ((isLoading && !forceRefresh) || isProfileLoading) return; // Evita chamadas concorrentes ou se o perfil ainda estiver carregando

      setIsLoading(true);
      try {
        // Calcular a data do primeiro dia e do último dia do mês selecionado
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        // Formatar o mês atual para verificação
        const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

        // Apenas pula requisição se não for refresh forçado e já tivermos dados
        if (!forceRefresh && monthKey === prevMonthRef.current && shifts.length > 0) {
          console.log(`Mês ${monthKey} já carregado, pulando requisição`);
          setIsLoading(false);
          return;
        }

        console.log(
          `Buscando plantões de ${format(firstDay, 'yyyy-MM-dd')} até ${format(lastDay, 'yyyy-MM-dd')}`
        );

        const data = await shiftsApi.getShifts({
          startDate: format(firstDay, 'yyyy-MM-dd'),
          endDate: format(lastDay, 'yyyy-MM-dd'),
        });

        console.log(`Plantões carregados: ${data.length}`);
        setShifts(data);
        setIsDataLoaded(true); // Marca que os dados foram carregados com sucesso

        // Atualiza o mês de referência
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

  // Efeito para carregar dados iniciais quando o componente montar
  useEffect(() => {
    if (!isProfileLoading && !isDataLoaded) {
      console.log('Iniciando carregamento inicial de plantões...');
      loadShifts(true);
    }
  }, [isProfileLoading, isDataLoaded, loadShifts]);

  // Efeito para reagir a mudanças de mês
  useEffect(() => {
    // Evitamos o primeiro carregamento (já coberto pelo efeito acima)
    if (!isProfileLoading && isDataLoaded) {
      console.log(`Mês alterado para ${format(currentMonth, 'yyyy-MM')}, recarregando dados...`);
      loadShifts();
    }
  }, [currentMonth, isProfileLoading, isDataLoaded, loadShifts]);

  // Filter shifts for the selected date
  const shiftsForSelectedDate = useMemo(() => {
    return shifts.filter((shift) => isSameDay(parseISO(shift.date), selectedDate));
  }, [shifts, selectedDate]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadShifts(true); // Forçar refresh
      showToast('Dados atualizados com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar plantões:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadShifts, showToast]);

  // Show modal to add a shift
  const navigateToAddShift = useCallback(() => {
    console.log('Abrindo modal para adicionar plantão sem data específica');
    setModalInitialDate(null); // Limpa a data inicial
    setIsAddModalVisible(true); // Abre o modal
  }, []);

  // Show modal to add a shift on the selected date
  const navigateToAddShiftOnDate = useCallback(() => {
    console.log(`Abrindo modal para adicionar plantão em ${selectedDate.toISOString()}`);
    setModalInitialDate(selectedDate); // Define a data inicial como a data selecionada
    setIsAddModalVisible(true); // Abre o modal
  }, [selectedDate]);

  // Navigate to shift details
  const navigateToShiftDetails = useCallback(
    (shift: Shift) => {
      router.push({
        pathname: `/shifts/${shift.id}`,
      });
    },
    [router]
  );

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleMonthChange = useCallback(
    (month: Date) => {
      console.log(`Mês alterado para: ${format(month, 'MMMM yyyy', { locale: ptBR })}`);
      // Antes de atualizar, verificamos se o mês já é o atual para evitar rerenders desnecessários
      if (
        month.getMonth() !== currentMonth.getMonth() ||
        month.getFullYear() !== currentMonth.getFullYear()
      ) {
        setCurrentMonth(month);
      }
    },
    [currentMonth]
  );

  // Success handler for modal
  const handleAddSuccess = useCallback(() => {
    console.log('Plantão adicionado com sucesso, fechando modal');
    showToast('Plantão adicionado com sucesso!', 'success');
    setIsAddModalVisible(false);

    // Atualizar dados
    loadShifts();
  }, [showToast, loadShifts]);

  // Fechar o modal
  const handleCloseModal = useCallback(() => {
    console.log('Fechando modal');
    setIsAddModalVisible(false);
  }, []);

  // Get color and name info for a location with handling for undefined
  const getLocationInfo = (shift: Shift) => {
    // Se o plantão tem informações de localização, use-as
    if (shift.location) {
      return {
        name: shift.location.name,
        color: shift.location.color,
      };
    }

    // Caso contrário, retorne valores padrão
    return {
      name: 'Local não informado',
      color: '#64748b', // default color
    };
  };

  const renderShiftItem = useCallback(
    ({ item }: { item: Shift }) => {
      const formatShiftDate = () => {
        try {
          return format(new Date(item.date), "dd 'de' MMMM", { locale: ptBR });
        } catch {
          return 'Data inválida';
        }
      };

      const formatValue = () => {
        try {
          return `R$ ${Number(item.value).toFixed(2).replace('.', ',')}`;
        } catch {
          return 'R$ --';
        }
      };

      const getStatusInfo = () => {
        const status = item.status?.toLowerCase() || 'agendado';
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
          className="mb-3 overflow-hidden rounded-xl bg-white shadow-sm"
          activeOpacity={0.7}
          onPress={() => navigateToShiftDetails(item)}>
          <View className="p-4">
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-base font-bold text-text-dark">{formatShiftDate()}</Text>
                <Text className="mt-2 text-sm text-text-light">
                  {item.startTime || '--:--'} - {item.endTime || '--:--'}
                </Text>
                <View className="mt-1 flex-row items-center">
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
    [navigateToShiftDetails]
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

  // Show loader while loading profile
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

      {/* Header Section */}
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

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
        style={{ elevation: 4 }}
        activeOpacity={0.9}
        onPress={navigateToAddShift}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Shift Modal */}
      <ShiftFormModal
        visible={isAddModalVisible}
        onClose={handleCloseModal}
        initialDate={modalInitialDate}
        onSuccess={handleAddSuccess}
      />
    </SafeAreaView>
  );
}
