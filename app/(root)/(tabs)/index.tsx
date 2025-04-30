// app/(root)/(tabs)/index.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDialog } from '@/contexts/DialogContext';
import { format, isSameDay, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CalendarComponent from '@/components/CalendarComponent';
import { useProfile } from '@/hooks/useProfile'; // Novo hook!

// Definindo tipo para as localizações
type LocationType = {
  id: string;
  name: string;
  address: string;
  color: string;
};

// Definindo tipo para o objeto de localizações com assinatura de índice
type LocationsType = {
  [key: string]: LocationType;
};

// --- MOCK DATA MELHORADA --- (Substituir por chamadas reais depois)
// Cria um objeto de localidades para uso no formulário e exibição
const MOCK_LOCATIONS: LocationsType = {
  loc1: {
    id: 'loc1',
    name: 'Hospital Central',
    address: 'Av. Paulista, 1500',
    color: '#0077B6',
  },
  loc2: {
    id: 'loc2',
    name: 'Clínica Sul',
    address: 'Rua Augusta, 500',
    color: '#EF476F',
  },
  loc3: {
    id: 'loc3',
    name: 'Posto de Saúde Norte',
    address: 'Av. Brigadeiro Faria Lima, 1200',
    color: '#06D6A0',
  },
};

// Função auxiliar para gerar datas em relação a hoje
const createDate = (daysOffset: number) => {
  const date = addDays(new Date(), daysOffset);
  return date.toISOString();
};

// Plantões futuros (próximos 30 dias)
const MOCK_SHIFTS = [
  {
    id: '1',
    date: createDate(2), // Daqui 2 dias
    locationId: 'loc1',
    startTime: '08:00',
    endTime: '14:00',
    value: 1200,
    status: 'Agendado',
  },
  {
    id: '2',
    date: createDate(4), // Daqui 4 dias
    locationId: 'loc2',
    startTime: '13:00',
    endTime: '19:00',
    value: 1350,
    status: 'Confirmado',
  },
  {
    id: '3',
    date: createDate(7), // Daqui 7 dias
    locationId: 'loc1',
    startTime: '07:00',
    endTime: '13:00',
    value: 1100,
    status: 'Agendado',
  },
  {
    id: '4',
    date: createDate(7), // Mesmo dia do anterior (para testar múltiplos plantões)
    locationId: 'loc3',
    startTime: '14:00',
    endTime: '22:00',
    value: 1400,
    status: 'Agendado',
  },
  {
    id: '5',
    date: createDate(10), // Daqui 10 dias
    locationId: 'loc2',
    startTime: '09:00',
    endTime: '17:00',
    value: 1250,
    status: 'Agendado',
  },
];

// Plantões passados (últimos 30 dias)
const MOCK_PAST_SHIFTS = [
  {
    id: 'p1',
    date: createDate(-3), // 3 dias atrás
    locationId: 'loc2',
    startTime: '08:00',
    endTime: '14:00',
    value: 1150,
    status: 'Concluído',
  },
  {
    id: 'p2',
    date: createDate(-7), // 7 dias atrás
    locationId: 'loc1',
    startTime: '07:00',
    endTime: '19:00',
    value: 1800,
    status: 'Concluído',
  },
  {
    id: 'p3',
    date: createDate(-14), // 14 dias atrás
    locationId: 'loc3',
    startTime: '13:00',
    endTime: '19:00',
    value: 950,
    status: 'Cancelado',
  },
];
// --- FIM MOCK DATA ---

export default function ShiftsScreen() {
  const [upcomingShifts, setUpcomingShifts] = useState(MOCK_SHIFTS);
  const [pastShifts, setPastShifts] = useState(MOCK_PAST_SHIFTS);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { profile, isLoading: isProfileLoading } = useProfile();
  const { showDialog } = useDialog();
  const router = useRouter();

  // Extrair o nome do usuário do profile
  const userName = useMemo(() => {
    if (isProfileLoading || !profile) return 'Usuário';

    // Tenta combinar firstName e lastName
    if (profile.firstName || profile.lastName) {
      return ((profile.firstName || '') + ' ' + (profile.lastName || '')).trim();
    }

    // Ou usa o campo name, se estiver disponível
    if (profile.name) {
      return profile.name;
    }

    return 'Usuário';
  }, [profile, isProfileLoading]);

  // Combina todos os plantões (futuros e passados)
  const allShifts = useMemo(() => {
    return [...upcomingShifts, ...pastShifts];
  }, [upcomingShifts, pastShifts]);

  // Filtra os plantões para a data selecionada
  const shiftsForSelectedDate = useMemo(() => {
    return allShifts.filter((shift) => isSameDay(parseISO(shift.date), selectedDate));
  }, [allShifts, selectedDate]);

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

  // Função modificada para navegar para a tela de adicionar plantão
  const navigateToAddShift = useCallback(() => {
    // Em vez de mostrar um diálogo, navegamos para a tela de adição de plantão
    router.push('/shifts/add');
  }, [router]);

  // Função para adicionar plantão na data selecionada
  const navigateToAddShiftOnDate = useCallback(() => {
    // Navega para a tela de adicionar plantão passando a data selecionada como parâmetro
    router.push({
      pathname: '/shifts/add',
      params: { date: format(selectedDate, 'yyyy-MM-dd') },
    });
  }, [selectedDate, router]);

  // Função para navegar para os detalhes de um plantão
  const navigateToShiftDetails = useCallback(
    (shift: any) => {
      router.push({
        pathname: `/shifts/${shift.id}`,
      });
    },
    [router]
  );

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // Obter informações de cor e nome do local com tratamento para undefined
  const getLocationInfo = (locationId: string) => {
    // Se não temos o locationId ou não existe nos mock locations, retornamos valores padrão
    if (!locationId || !MOCK_LOCATIONS[locationId]) {
      return {
        name: 'Local desconhecido',
        color: '#64748b', // cor padrão
      };
    }
    return {
      name: MOCK_LOCATIONS[locationId].name,
      color: MOCK_LOCATIONS[locationId].color,
    };
  };

  const renderShiftItem = useCallback(
    ({ item }: { item: (typeof MOCK_SHIFTS)[0] }) => {
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
        switch (item.status?.toLowerCase()) {
          case 'agendado':
            return { label: 'Agendado', color: '#18cb96' }; // primary
          case 'confirmado':
            return { label: 'Confirmado', color: '#10b981' }; // success
          case 'cancelado':
            return { label: 'Cancelado', color: '#ef4444' }; // error
          case 'concluído':
            return { label: 'Concluído', color: '#64748b' }; // text-light
          default:
            return { label: item.status || 'Agendado', color: '#64748b' };
        }
      };

      const statusInfo = getStatusInfo();
      const locationInfo = getLocationInfo(item.locationId);

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

  // Mostrar indicator enquanto carrega o perfil
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

      {/* Header Section - Reduzido em altura */}
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

      {/* Componente de Calendário */}
      <CalendarComponent
        shifts={allShifts}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
      />

      {/* Main Content */}
      {allShifts.length === 0 && !isRefreshing ? (
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
        className="absolute bottom-4 right-4 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30"
        activeOpacity={0.9}
        onPress={navigateToAddShift}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
