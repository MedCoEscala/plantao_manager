import React, { useState, useCallback } from 'react';
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
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDialog } from '@/contexts/DialogContext';
import { format, addDays, isSameDay, getDate, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- MOCK DATA --- (Substituir por chamadas reais depois)
const MOCK_LOCATIONS: Record<string, string> = {
  loc1: 'Hospital Central',
  loc2: 'Clínica Sul',
};
const MOCK_SHIFTS = [
  {
    id: '1',
    date: '2024-08-15T10:00:00Z',
    locationId: 'loc1',
    startTime: '08:00',
    endTime: '14:00',
    value: 1200,
    status: 'Agendado',
  },
  {
    id: '2',
    date: '2024-08-17T14:00:00Z',
    locationId: 'loc2',
    startTime: '13:00',
    endTime: '19:00',
    value: 1350,
    status: 'Confirmado',
  },
  {
    id: '3',
    date: '2024-08-20T09:00:00Z',
    locationId: 'loc1',
    startTime: '07:00',
    endTime: '13:00',
    value: 1100,
    status: 'Agendado',
  },
];
const MOCK_PAST_SHIFTS = [
  {
    id: 'p1',
    date: '2024-08-10T10:00:00Z',
    locationId: 'loc2',
    startTime: '08:00',
    endTime: '14:00',
    value: 1150,
    status: 'Concluído',
  },
];
// --- FIM MOCK DATA ---

export default function ShiftsScreen() {
  const [upcomingShifts, setUpcomingShifts] = useState(MOCK_SHIFTS);
  const [pastShifts, setPastShifts] = useState(MOCK_PAST_SHIFTS);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDates, setCalendarDates] = useState<Date[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { user } = useUser();
  const { showDialog } = useDialog();
  const router = useRouter();

  const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Usuário';

  // Gera próximos 14 dias para o calendário
  React.useEffect(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      dates.push(addDays(today, i));
    }
    setCalendarDates(dates);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simula atualização dos dados (substituir por chamada real)
    setTimeout(() => {
      setUpcomingShifts(MOCK_SHIFTS);
      setPastShifts(MOCK_PAST_SHIFTS);
      setIsRefreshing(false);
      showDialog({
        type: 'success',
        title: 'Atualizado',
        message: 'Dados recarregados com sucesso.',
      });
    }, 1000);
  }, [showDialog]);

  const navigateToAddShift = useCallback(() => {
    showDialog({
      title: 'Em desenvolvimento',
      message: 'Adicionar plantão em breve!',
      type: 'info',
    });
  }, [showDialog]);

  const navigateToShiftDetails = useCallback(
    (shift: any) => {
      showDialog({
        title: 'Em desenvolvimento',
        message: 'Detalhes do plantão em breve!',
        type: 'info',
      });
    },
    [showDialog]
  );

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const renderDateItem = ({ item }: { item: Date }) => {
    const isSelected = isSameDay(item, selectedDate);
    const isTodayDate = isToday(item);

    return (
      <TouchableOpacity
        className={`mx-1 h-16 w-14 items-center justify-center rounded-2xl ${
          isSelected
            ? 'bg-primary shadow-md'
            : isTodayDate
              ? 'border border-primary-100 bg-primary-50'
              : 'border border-background-300 bg-white'
        }`}
        onPress={() => handleSelectDate(item)}>
        <Text
          className={`text-xs font-medium capitalize ${isSelected ? 'text-white' : 'text-text-light'}`}>
          {format(item, 'EEE', { locale: ptBR })}
        </Text>
        <Text className={`mt-1 text-xl font-bold ${isSelected ? 'text-white' : 'text-text-dark'}`}>
          {getDate(item)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderShiftItem = (shift: (typeof MOCK_SHIFTS)[0] | (typeof MOCK_PAST_SHIFTS)[0]) => {
    const formatShiftDate = () => {
      try {
        return format(new Date(shift.date), "dd 'de' MMMM", { locale: ptBR });
      } catch {
        return 'Data inválida';
      }
    };
    const formatValue = () => {
      try {
        return `R$ ${Number(shift.value).toFixed(2).replace('.', ',')}`;
      } catch {
        return 'R$ --';
      }
    };
    const getStatusInfo = () => {
      switch (shift.status?.toLowerCase()) {
        case 'agendado':
          return { label: 'Agendado', color: '#18cb96' }; // primary
        case 'confirmado':
          return { label: 'Confirmado', color: '#10b981' }; // success
        case 'cancelado':
          return { label: 'Cancelado', color: '#ef4444' }; // error
        case 'concluído':
          return { label: 'Concluído', color: '#64748b' }; // text-light
        default:
          return { label: shift.status || 'Agendado', color: '#64748b' };
      }
    };
    const statusInfo = getStatusInfo();
    const locationName = MOCK_LOCATIONS[shift.locationId] || 'Local desconhecido';

    return (
      <TouchableOpacity
        key={shift.id}
        className="mb-3 overflow-hidden rounded-xl bg-white shadow-sm"
        onPress={() => navigateToShiftDetails(shift)}>
        <View className="p-4">
          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="text-base font-bold text-text-dark">{formatShiftDate()}</Text>
              <Text className="mt-2 text-sm text-text-light">
                {shift.startTime || '--:--'} - {shift.endTime || '--:--'}
              </Text>
              <Text className="mt-1 text-sm text-text-light">{locationName}</Text>
            </View>
            <View className="items-end justify-between">
              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: `${statusInfo.color}20` }} // 20% opacity
              >
                <Text style={{ color: statusInfo.color }} className="text-xs font-semibold">
                  {statusInfo.label}
                </Text>
              </View>
              <Text className="mt-2 text-base font-semibold text-primary">{formatValue()}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyContent = () => (
    <View className="flex-1 items-center justify-center px-6 py-16">
      <Ionicons name="calendar-outline" size={80} color="#cbd5e1" />
      <Text className="mb-2 mt-6 text-center text-xl font-bold text-text-dark">
        Sem plantões agendados
      </Text>
      <Text className="mb-8 text-center text-text-light">
        Você ainda não tem plantões agendados. Adicione seu primeiro plantão para começar a
        gerenciar sua agenda.
      </Text>
      <TouchableOpacity
        className="flex-row items-center rounded-xl bg-primary px-6 py-3 shadow-sm"
        onPress={navigateToAddShift}>
        <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
        <Text className="ml-2 font-semibold text-white">Adicionar Plantão</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />
      {/* Header Section */}
      <View className="border-b border-background-300 bg-white px-4 pb-4 pt-2">
        <View className="flex-row items-center justify-between py-3">
          <View>
            <Text className="text-2xl font-bold text-text-dark">Olá, {userName.trim()}</Text>
            <Text className="text-base text-text-light">Seus plantões</Text>
          </View>
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-background-200"
            onPress={handleRefresh}
            disabled={isRefreshing}>
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#18cb96" />
            ) : (
              <Ionicons name="refresh-outline" size={20} color="#1e293b" />
            )}
          </TouchableOpacity>
        </View>

        {/* Calendar Section */}
        <View className="mt-2">
          <FlatList
            data={calendarDates}
            renderItem={renderDateItem}
            keyExtractor={(item) => item.toISOString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="py-2 px-2"
            initialNumToRender={7}
            maxToRenderPerBatch={14}
          />
        </View>
      </View>

      {/* Main Content */}
      {upcomingShifts.length === 0 && !isRefreshing ? (
        renderEmptyContent()
      ) : (
        <FlatList
          className="flex-1 px-4"
          data={upcomingShifts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderShiftItem(item)}
          ListHeaderComponent={() => (
            <View className="mb-3 mt-4">
              <Text className="text-lg font-bold text-text-dark">Próximos Plantões</Text>
            </View>
          )}
          ListFooterComponent={() => (
            <>
              {pastShifts.length > 0 && (
                <View className="mb-3 mt-6">
                  <Text className="mb-3 text-lg font-bold text-text-dark">Histórico</Text>
                  {pastShifts.map(renderShiftItem)}
                </View>
              )}
              {/* Espaço para o FAB não cobrir conteúdo */}
              <View className="h-32" />
            </>
          )}
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
      <View className="absolute bottom-8 right-4 items-end">
        <TouchableOpacity
          className="h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg"
          onPress={navigateToAddShift}>
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
