import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView as RNScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, addDays, isSameDay, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUser } from '@clerk/clerk-expo';
import { useDialog } from '@app/contexts/DialogContext';

// Mock de dados para não depender do banco de dados até que esteja pronto
const MOCK_SHIFTS = [
  {
    id: '1',
    date: '2025-04-10',
    startTime: '08:00',
    endTime: '18:00',
    value: 550,
    status: 'scheduled',
    locationId: 'loc1',
    userId: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    date: '2025-04-15',
    startTime: '19:00',
    endTime: '07:00',
    value: 750,
    status: 'confirmed',
    locationId: 'loc2',
    userId: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const MOCK_LOCATIONS = {
  loc1: 'Hospital Santa Casa',
  loc2: 'Hospital São Lucas',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ShiftsScreen() {
  const [upcomingShifts, setUpcomingShifts] = useState(MOCK_SHIFTS);
  const [pastShifts, setPastShifts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDates, setCalendarDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { user } = useUser();
  const { showDialog } = useDialog();
  const router = useRouter();

  const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Usuário';

  // Gera próximos 14 dias para o calendário
  useEffect(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      dates.push(addDays(today, i));
    }
    setCalendarDates(dates);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);

    // Simula atualização dos dados
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  const navigateToAddShift = useCallback(() => {
    showDialog({
      title: 'Em desenvolvimento',
      message: 'A funcionalidade de adicionar plantões será implementada em breve!',
      type: 'info',
    });
  }, [showDialog]);
  const navigateToShiftDetails = useCallback(
    (shift: any) => {
      showDialog({
        title: 'Em desenvolvimento',
        message: 'A funcionalidade de detalhes do plantão será implementada em breve!',
        type: 'info',
      });
    },
    [showDialog]
  );

  const handleSelectDate = useCallback(
    (date: Date) => {
      setSelectedDate(date);

      if (!isSameDay(date, new Date())) {
        const formattedDate = format(date, "dd 'de' MMMM", { locale: ptBR });
        const hasShifts = upcomingShifts.some((shift) => {
          try {
            return shift.date.startsWith(format(date, 'yyyy-MM-dd'));
          } catch (e) {
            return false;
          }
        });

        showDialog({
          title: formattedDate,
          message: hasShifts
            ? `Você tem plantões nesta data.`
            : 'Você não tem plantões nesta data.',
          type: 'info',
        });
      }
    },
    [upcomingShifts, showDialog]
  );

  const renderDateItem = ({ item }: { item: Date }) => {
    const isSelected = isSameDay(item, selectedDate);
    const isToday = isSameDay(item, new Date());

    return (
      <TouchableOpacity
        style={[
          styles.dateItem,
          isSelected ? styles.dateItemSelected : null,
          isToday && !isSelected ? styles.dateItemToday : null,
        ]}
        onPress={() => handleSelectDate(item)}>
        <Text style={styles.dateWeekday}>{format(item, 'EEE', { locale: ptBR })}</Text>
        <Text style={[styles.dateDay, isSelected ? styles.dateTextSelected : null]}>
          {getDate(item)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderShiftItem = (shift: {
    date: string;
    value: string | number;
    status?: string;
    locationId: string;
    startTime?: string;
    endTime?: string;
  }) => {
    // Formatar data
    const formatShiftDate = () => {
      try {
        const shiftDate = new Date(shift.date);
        return format(shiftDate, "dd 'de' MMMM", { locale: ptBR });
      } catch {
        return 'Data indisponível';
      }
    };

    // Formatar valor
    const formatValue = () => {
      try {
        return `R$ ${Number(shift.value).toFixed(2).replace('.', ',')}`;
      } catch {
        return 'R$ 0,00';
      }
    };

    // Status label e cor
    const getStatusInfo = () => {
      switch (shift.status?.toLowerCase()) {
        case 'scheduled':
          return { label: 'Agendado', color: '#0077B6' };
        case 'completed':
        case 'confirmed':
          return { label: 'Confirmado', color: '#2A9D8F' };
        case 'canceled':
          return { label: 'Cancelado', color: '#E63946' };
        case 'in-progress':
          return { label: 'Em andamento', color: '#E9C46A' };
        default:
          return { label: shift.status || 'Agendado', color: '#8D99AE' };
      }
    };
    const statusInfo = getStatusInfo();
    // Definindo o tipo para MOCK_LOCATIONS para evitar o erro de tipagem
    const locationName =
      (MOCK_LOCATIONS as Record<string, string>)[shift.locationId] || 'Local não especificado';

    return (
      <TouchableOpacity style={styles.shiftCard} onPress={() => navigateToShiftDetails(shift)}>
        <View style={styles.shiftContent}>
          <View style={styles.shiftMainInfo}>
            <Text style={styles.shiftDate}>{formatShiftDate()}</Text>
            <Text style={styles.shiftTime}>
              {shift.startTime || '00:00'} - {shift.endTime || '00:00'}
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

      {/* Cabeçalho e seletor de datas (fixo) */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Olá, {userName.trim()}</Text>
            <Text style={styles.subtitle}>Seus plantões</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh-outline" size={20} color="#2B2D42" />
          </TouchableOpacity>
        </View>

        {/* Seletor de datas */}
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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0077B6" />
        </View>
      ) : (
        <RNScrollView style={styles.scrollContainer}>
          {isRefreshing && (
            <View style={styles.refreshIndicator}>
              <ActivityIndicator size="small" color="#0077B6" />
              <Text style={styles.refreshText}>Atualizando...</Text>
            </View>
          )}

          {/* Próximos Plantões */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Próximos Plantões</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            {upcomingShifts.length > 0 ? (
              <View>{upcomingShifts.map((shift) => renderShiftItem(shift))}</View>
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

          {/* Histórico */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Histórico</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            {pastShifts.length > 0 ? (
              <View>{pastShifts.map((shift) => renderShiftItem(shift))}</View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color="#8D99AE" />
                <Text style={styles.emptyText}>Nenhum plantão encontrado no histórico</Text>
              </View>
            )}
          </View>

          {/* Espaço para o FAB */}
          <View style={styles.fabSpacer} />
        </RNScrollView>
      )}

      {/* Botão flutuante */}
      <TouchableOpacity style={styles.fab} onPress={navigateToAddShift}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B2D42',
  },
  subtitle: {
    fontSize: 16,
    color: '#8D99AE',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E9ECEF',
  },
  calendarContainer: {
    marginBottom: 16,
  },
  calendarContent: {
    paddingRight: 8,
    paddingVertical: 4,
  },
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
  dateItemSelected: {
    backgroundColor: '#0077B6',
  },
  dateItemToday: {
    backgroundColor: '#E6F3FF',
  },
  dateWeekday: {
    fontSize: 12,
    color: '#8D99AE',
    textTransform: 'capitalize',
  },
  dateDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B2D42',
  },
  dateTextSelected: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  refreshIndicator: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  refreshText: {
    marginTop: 8,
    fontSize: 14,
    color: '#8D99AE',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B2D42',
  },
  seeAllText: {
    fontSize: 14,
    color: '#0077B6',
  },
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
  shiftContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shiftMainInfo: {
    flex: 1,
  },
  shiftDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B2D42',
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 14,
    color: '#8D99AE',
    marginBottom: 4,
  },
  shiftLocation: {
    fontSize: 14,
    color: '#8D99AE',
  },
  shiftSideInfo: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  shiftValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0077B6',
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
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
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    marginLeft: 8,
  },
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
  fabSpacer: {
    height: 80,
  },
});
