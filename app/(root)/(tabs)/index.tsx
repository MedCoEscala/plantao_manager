// app/(root)/(tabs)/index.tsx
import React, { useState, useCallback, useMemo } from 'react';
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

// Defining types for locations
type LocationType = {
  id: string;
  name: string;
  address: string;
  color: string;
};

// Defining type for the locations object with index signature
type LocationsType = {
  [key: string]: LocationType;
};

// --- IMPROVED MOCK DATA --- (Replace with real API calls later)
// Create a locations object for use in the form and display
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

// Helper function to generate dates relative to today
const createDate = (daysOffset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
};

// Future shifts (next 30 days)
const MOCK_SHIFTS = [
  {
    id: '1',
    date: createDate(2), // 2 days from now
    locationId: 'loc1',
    startTime: '08:00',
    endTime: '14:00',
    value: 1200,
    status: 'Agendado',
  },
  {
    id: '2',
    date: createDate(4), // 4 days from now
    locationId: 'loc2',
    startTime: '13:00',
    endTime: '19:00',
    value: 1350,
    status: 'Confirmado',
  },
  {
    id: '3',
    date: createDate(7), // 7 days from now
    locationId: 'loc1',
    startTime: '07:00',
    endTime: '13:00',
    value: 1100,
    status: 'Agendado',
  },
  {
    id: '4',
    date: createDate(7), // Same day as previous one (to test multiple shifts)
    locationId: 'loc3',
    startTime: '14:00',
    endTime: '22:00',
    value: 1400,
    status: 'Agendado',
  },
  {
    id: '5',
    date: createDate(10), // 10 days from now
    locationId: 'loc2',
    startTime: '09:00',
    endTime: '17:00',
    value: 1250,
    status: 'Agendado',
  },
];

// Past shifts (last 30 days)
const MOCK_PAST_SHIFTS = [
  {
    id: 'p1',
    date: createDate(-3), // 3 days ago
    locationId: 'loc2',
    startTime: '08:00',
    endTime: '14:00',
    value: 1150,
    status: 'Concluído',
  },
  {
    id: 'p2',
    date: createDate(-7), // 7 days ago
    locationId: 'loc1',
    startTime: '07:00',
    endTime: '19:00',
    value: 1800,
    status: 'Concluído',
  },
  {
    id: 'p3',
    date: createDate(-14), // 14 days ago
    locationId: 'loc3',
    startTime: '13:00',
    endTime: '19:00',
    value: 950,
    status: 'Cancelado',
  },
];
// --- END MOCK DATA ---

export default function ShiftsScreen() {
  const [upcomingShifts, setUpcomingShifts] = useState(MOCK_SHIFTS);
  const [pastShifts, setPastShifts] = useState(MOCK_PAST_SHIFTS);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<Date | null>(null);

  const { profile, isLoading: isProfileLoading } = useProfile();
  const { showDialog } = useDialog();
  const { showToast } = useToast();
  const router = useRouter();

  // Extract user name from profile
  const userName = useMemo(() => {
    if (isProfileLoading || !profile) return 'Usuário';

    // Try to combine firstName and lastName
    if (profile.firstName || profile.lastName) {
      return ((profile.firstName || '') + ' ' + (profile.lastName || '')).trim();
    }

    // Or use the name field if available
    if (profile.name) {
      return profile.name;
    }

    return 'Usuário';
  }, [profile, isProfileLoading]);

  // Combine all shifts (future and past)
  const allShifts = useMemo(() => {
    return [...upcomingShifts, ...pastShifts];
  }, [upcomingShifts, pastShifts]);

  // Filter shifts for the selected date
  const shiftsForSelectedDate = useMemo(() => {
    return allShifts.filter((shift) => isSameDay(parseISO(shift.date), selectedDate));
  }, [allShifts, selectedDate]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate data refresh (replace with real API call)
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

  // Success handler for modal
  const handleAddSuccess = useCallback(() => {
    console.log('Plantão adicionado com sucesso, fechando modal');
    showToast('Plantão adicionado com sucesso!', 'success');
    setIsAddModalVisible(false);

    // Atualizar dados (simulação)
    handleRefresh();
  }, [showToast, handleRefresh]);

  // Fechar o modal
  const handleCloseModal = useCallback(() => {
    console.log('Fechando modal');
    setIsAddModalVisible(false);
  }, []);

  // Get color and name info for a location with handling for undefined
  const getLocationInfo = (locationId: string) => {
    // If we don't have the locationId or it doesn't exist in mock locations, return default values
    if (!locationId || !MOCK_LOCATIONS[locationId]) {
      return {
        name: 'Local desconhecido',
        color: '#64748b', // default color
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

      {/* Calendar Component */}
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
