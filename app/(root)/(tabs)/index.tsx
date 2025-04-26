import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView as RNScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDialog } from '@/contexts/DialogContext';
import { format, addDays, isSameDay, getDate } from 'date-fns';
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
  const { showDialog } = useDialog(); // Necessita DialogProvider no layout
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
      // Ex: const newShifts = await fetchShifts(); setUpcomingShifts(newShifts);
      setUpcomingShifts(MOCK_SHIFTS); // Reset para mock
      setPastShifts(MOCK_PAST_SHIFTS);
      setIsRefreshing(false);
      showDialog({ type: 'success', title: 'Atualizado', message: 'Dados recarregados (mock).' });
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
    // Lógica para filtrar shifts por data ou mostrar info (opcional)
  }, []);

  const renderDateItem = ({ item }: { item: Date }) => {
    const isSelected = isSameDay(item, selectedDate);
    const isToday = isSameDay(item, new Date());
    return (
      <TouchableOpacity
        style={[
          styles.dateItem,
          isSelected && styles.dateItemSelected,
          isToday && !isSelected && styles.dateItemToday,
        ]}
        onPress={() => handleSelectDate(item)}>
        <Text style={styles.dateWeekday}>{format(item, 'EEE', { locale: ptBR })}</Text>
        <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>{getDate(item)}</Text>
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
          return { label: 'Agendado', color: '#0077B6' };
        case 'confirmado':
          return { label: 'Confirmado', color: '#2A9D8F' };
        case 'cancelado':
          return { label: 'Cancelado', color: '#E63946' };
        case 'concluído':
          return { label: 'Concluído', color: '#8D99AE' };
        default:
          return { label: shift.status || 'Agendado', color: '#8D99AE' };
      }
    };
    const statusInfo = getStatusInfo();
    const locationName = MOCK_LOCATIONS[shift.locationId] || 'Local desconhecido';

    return (
      <TouchableOpacity
        key={shift.id}
        style={styles.shiftCard}
        onPress={() => navigateToShiftDetails(shift)}>
        <View style={styles.shiftContent}>
          <View style={styles.shiftMainInfo}>
            <Text style={styles.shiftDate}>{formatShiftDate()}</Text>
            <Text style={styles.shiftTime}>
              {shift.startTime || '--:--'} - {shift.endTime || '--:--'}
            </Text>
            <Text style={styles.shiftLocation}>{locationName}</Text>
          </View>
          <View style={styles.shiftSideInfo}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
            <Text style={styles.shiftValue}>{formatValue()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Olá, {userName.trim()}</Text>
            <Text style={styles.subtitle}>Seus plantões</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isRefreshing}>
            <Ionicons name="refresh-outline" size={20} color="#2B2D42" />
          </TouchableOpacity>
        </View>
        <View style={styles.calendarContainer}>
          <FlatList
            data={calendarDates}
            renderItem={renderDateItem}
            keyExtractor={(item) => item.toISOString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarContent}
          />
        </View>
      </View>

      <RNScrollView
        style={styles.scrollContainer}
        refreshControl={
          <ActivityIndicator animating={isRefreshing} color="#0077B6" /> // Simples indicador
        }>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximos Plantões</Text>
            {/* <TouchableOpacity><Text style={styles.seeAllText}>Ver todos</Text></TouchableOpacity> */}
          </View>
          {upcomingShifts.length > 0 ? (
            <View>{upcomingShifts.map(renderShiftItem)}</View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#8D99AE" />
              <Text style={styles.emptyText}>Você não tem plantões agendados</Text>
              <TouchableOpacity style={styles.addButton} onPress={navigateToAddShift}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Adicionar Plantão</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Histórico</Text>
            {/* <TouchableOpacity><Text style={styles.seeAllText}>Ver todos</Text></TouchableOpacity> */}
          </View>
          {pastShifts.length > 0 ? (
            <View>{pastShifts.map(renderShiftItem)}</View>
          ) : (
            <View style={styles.emptyStateMinimal}>
              <Text style={styles.emptyText}>Nenhum plantão no histórico.</Text>
            </View>
          )}
        </View>
        <View style={styles.fabSpacer} />
      </RNScrollView>

      <TouchableOpacity style={styles.fab} onPress={navigateToAddShift}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Estilos baseados no código anterior, mas simplificados
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8, backgroundColor: '#F8F9FA' },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#2B2D42' },
  subtitle: { fontSize: 16, color: '#8D99AE' },
  refreshButton: { padding: 8, borderRadius: 20, backgroundColor: '#E9ECEF' },
  calendarContainer: { marginBottom: 8 },
  calendarContent: { paddingRight: 8, paddingVertical: 4 },
  dateItem: {
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateItemSelected: { backgroundColor: '#0077B6' },
  dateItemToday: { backgroundColor: '#E6F3FF' },
  dateWeekday: { fontSize: 12, color: '#8D99AE', textTransform: 'capitalize' },
  dateDay: { fontSize: 16, fontWeight: 'bold', color: '#2B2D42' },
  dateTextSelected: { color: 'white' },
  scrollContainer: { flex: 1, paddingHorizontal: 16 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2B2D42' },
  seeAllText: { fontSize: 14, color: '#0077B6' },
  shiftCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shiftContent: { flexDirection: 'row', justifyContent: 'space-between' },
  shiftMainInfo: { flex: 1 },
  shiftDate: { fontSize: 16, fontWeight: 'bold', color: '#2B2D42', marginBottom: 4 },
  shiftTime: { fontSize: 14, color: '#8D99AE', marginBottom: 4 },
  shiftLocation: { fontSize: 14, color: '#8D99AE' },
  shiftSideInfo: { alignItems: 'flex-end', justifyContent: 'space-between' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '500' },
  shiftValue: { fontSize: 16, fontWeight: '600', color: '#0077B6', marginTop: 8 },
  emptyState: { backgroundColor: 'white', borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyStateMinimal: { alignItems: 'center', paddingVertical: 16 },
  emptyText: {
    fontSize: 16,
    color: '#8D99AE',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0077B6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: { fontSize: 14, fontWeight: '500', color: 'white', marginLeft: 8 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0077B6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabSpacer: { height: 80 },
});
