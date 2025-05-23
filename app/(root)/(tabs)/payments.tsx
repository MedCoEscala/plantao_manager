import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDialog } from '@/contexts/DialogContext';
import { useToast } from '@/components/ui/Toast';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useShiftsApi, Shift } from '@/services/shifts-api';
import { usePaymentsApi } from '@/services/payments-api';
import { SelectField } from '@/components/form/SelectField';
import { useLocationsSelector } from '@/hooks/useLocationsSelector';
import { useContractorsSelector } from '@/hooks/useContractorsSelector';
import MonthYearPicker from '@/components/ui/MonthYearPicker';

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (e) {
    return dateString;
  }
};

interface ShiftWithPayment extends Shift {
  isPaid: boolean;
  paymentId?: string;
  isSelected?: boolean;
}

export default function PaymentsScreen() {
  const [shifts, setShifts] = useState<ShiftWithPayment[]>([]);
  const [filteredShifts, setFilteredShifts] = useState<ShiftWithPayment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [selectedShifts, setSelectedShifts] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const [showFilters, setShowFilters] = useState(false);
  const filtersHeight = useState(new Animated.Value(0))[0];

  const { showDialog } = useDialog();
  const { showToast } = useToast();
  const router = useRouter();
  const shiftsApi = useShiftsApi();
  const paymentsApi = usePaymentsApi();
  const { locationOptions } = useLocationsSelector();
  const { contractorOptions } = useContractorsSelector();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showSearch ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showSearch, fadeAnim]);

  useEffect(() => {
    Animated.timing(filtersHeight, {
      toValue: showFilters ? 120 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [showFilters, filtersHeight]);

  const loadShifts = async (isRefresh = false) => {
    if (!isRefresh) {
      setIsLoading(true);
    }
    setRefreshing(true);

    try {
      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);

      const filters = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        locationId: selectedLocationId || undefined,
        contractorId: selectedContractorId || undefined,
      };

      const shiftsData = await shiftsApi.getShifts(filters);
      const paymentsData = await paymentsApi.getPayments({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      // Mapear plantões com informações de pagamento
      const shiftsWithPaymentInfo = shiftsData.map((shift) => {
        const payment = paymentsData.find((p) => p.shiftId === shift.id);
        return {
          ...shift,
          isPaid: payment?.status === 'completed' || false,
          paymentId: payment?.id,
          isSelected: false,
        };
      });

      setShifts(shiftsWithPaymentInfo);
      setFilteredShifts(shiftsWithPaymentInfo);

      if (isRefresh) {
        showToast('Dados atualizados com sucesso', 'success');
      }
    } catch (error: any) {
      showToast(`Erro ao carregar plantões: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setRefreshing(false);
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    await loadShifts(true);
  }, []);

  // Carregar dados quando filtros mudam (incluindo carregamento inicial)
  useEffect(() => {
    loadShifts(false);
  }, [selectedMonth, selectedLocationId, selectedContractorId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      let filtered = shifts;

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (shift) =>
            shift.location?.name.toLowerCase().includes(query) ||
            shift.contractor?.name.toLowerCase().includes(query) ||
            shift.notes?.toLowerCase().includes(query)
        );
      }

      setFilteredShifts(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, shifts]);

  const toggleShiftSelection = useCallback((shiftId: string) => {
    setSelectedShifts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(shiftId)) {
        newSet.delete(shiftId);
      } else {
        newSet.add(shiftId);
      }
      return newSet;
    });
  }, []);

  const handleMarkAsPaid = useCallback(async () => {
    if (selectedShifts.size === 0) {
      showToast('Selecione pelo menos um plantão', 'warning');
      return;
    }

    showDialog({
      title: 'Confirmar Pagamento',
      message: `Marcar ${selectedShifts.size} plantão(ões) como pago(s)?`,
      type: 'confirm',
      confirmText: 'Confirmar',
      onConfirm: async () => {
        try {
          for (const shiftId of selectedShifts) {
            const shift = shifts.find((s) => s.id === shiftId);
            if (shift && !shift.isPaid) {
              await paymentsApi.createPayment({
                shiftId: shift.id,
                paymentDate: format(new Date(), 'yyyy-MM-dd'),
                method: 'transferencia',
                paid: true,
              });
            }
          }
          showToast('Plantões marcados como pagos', 'success');
          setSelectedShifts(new Set());
          setIsSelectionMode(false);
          await loadShifts(false);
        } catch (error: any) {
          console.error('Erro ao marcar como pago:', error);
          showToast('Erro ao processar pagamentos', 'error');
        }
      },
    });
  }, [selectedShifts, shifts, paymentsApi, showDialog, showToast]);

  const handleMarkAsUnpaid = useCallback(async () => {
    if (selectedShifts.size === 0) {
      showToast('Selecione pelo menos um plantão', 'warning');
      return;
    }

    showDialog({
      title: 'Confirmar Remoção',
      message: `Marcar ${selectedShifts.size} plantão(ões) como não pago(s)?`,
      type: 'confirm',
      confirmText: 'Confirmar',
      onConfirm: async () => {
        try {
          for (const shiftId of selectedShifts) {
            const shift = shifts.find((s) => s.id === shiftId);
            if (shift?.isPaid && shift.paymentId) {
              await paymentsApi.deletePayment(shift.paymentId);
            }
          }
          showToast('Plantões marcados como não pagos', 'success');
          setSelectedShifts(new Set());
          setIsSelectionMode(false);
          await loadShifts(false);
        } catch (error: any) {
          console.error('Erro ao marcar como não pago:', error);
          showToast('Erro ao processar alterações', 'error');
        }
      },
    });
  }, [selectedShifts, shifts, paymentsApi, showDialog, showToast]);

  const toggleSearch = useCallback(() => {
    if (showSearch && searchQuery) {
      setSearchQuery('');
    }
    setShowSearch(!showSearch);
  }, [showSearch, searchQuery]);

  const toggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  const handleSelectAll = useCallback(() => {
    if (selectedShifts.size === filteredShifts.length) {
      setSelectedShifts(new Set());
    } else {
      setSelectedShifts(new Set(filteredShifts.map((s) => s.id)));
    }
  }, [selectedShifts, filteredShifts]);

  const renderShiftItem = useCallback(
    ({ item, index }: { item: ShiftWithPayment; index: number }) => {
      const translateY = new Animated.Value(50);
      const opacity = new Animated.Value(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();

      const isSelected = selectedShifts.has(item.id);

      return (
        <Animated.View
          style={{
            transform: [{ translateY }],
            opacity,
          }}>
          <TouchableOpacity
            className={`mb-3 overflow-hidden rounded-xl shadow-sm ${
              isSelected ? 'bg-primary/10' : 'bg-white'
            }`}
            activeOpacity={0.7}
            onPress={() => {
              if (isSelectionMode) {
                toggleShiftSelection(item.id);
              } else {
                router.push(`/shifts/${item.id}`);
              }
            }}
            onLongPress={() => {
              setIsSelectionMode(true);
              toggleShiftSelection(item.id);
            }}>
            <View className="p-4">
              <View className="flex-row justify-between">
                <View className="mr-2 flex-1">
                  <View className="flex-row items-center">
                    {isSelectionMode && (
                      <View
                        className={`mr-3 h-6 w-6 items-center justify-center rounded-full border-2 ${
                          isSelected ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
                        }`}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-text-dark">
                        {formatDate(item.date)}
                      </Text>
                      <View className="mt-1 flex-row items-center">
                        <View
                          className="mr-1 h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.location?.color || '#64748b' }}
                        />
                        <Text className="text-xs text-text-light">
                          {item.location?.name || 'Local não informado'}
                        </Text>
                      </View>
                      {item.contractor && (
                        <Text className="mt-1 text-xs text-text-light">{item.contractor.name}</Text>
                      )}
                    </View>
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-base font-bold text-primary">
                    {formatCurrency(item.value)}
                  </Text>
                  <View
                    className={`mt-1 rounded-full px-2 py-0.5 ${
                      item.isPaid ? 'bg-success/20' : 'bg-warning/20'
                    }`}>
                    <Text
                      className={`text-xs font-medium ${
                        item.isPaid ? 'text-success' : 'text-warning'
                      }`}>
                      {item.isPaid ? 'Pago' : 'Pendente'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [selectedShifts, isSelectionMode, toggleShiftSelection, router]
  );

  // Calcular resumo
  const summary = {
    total: filteredShifts.reduce((sum, shift) => sum + shift.value, 0),
    paid: filteredShifts.filter((s) => s.isPaid).reduce((sum, shift) => sum + shift.value, 0),
    pending: filteredShifts.filter((s) => !s.isPaid).reduce((sum, shift) => sum + shift.value, 0),
    paidCount: filteredShifts.filter((s) => s.isPaid).length,
    pendingCount: filteredShifts.filter((s) => !s.isPaid).length,
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="z-10 border-b border-background-300 bg-white px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-text-dark">Controle de Pagamentos</Text>

          <View className="flex-row">
            <TouchableOpacity
              className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-background-100"
              onPress={toggleSearch}>
              <Ionicons
                name={showSearch ? 'close-outline' : 'search-outline'}
                size={20}
                color="#1e293b"
              />
            </TouchableOpacity>

            <TouchableOpacity
              className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-background-100"
              onPress={toggleFilters}>
              <Ionicons name="filter-outline" size={18} color="#1e293b" />
            </TouchableOpacity>

            <TouchableOpacity
              className="h-9 w-9 items-center justify-center rounded-full bg-background-100"
              onPress={handleRefresh}
              disabled={refreshing}>
              {refreshing ? (
                <ActivityIndicator size="small" color="#18cb96" />
              ) : (
                <Ionicons name="refresh-outline" size={18} color="#1e293b" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra de pesquisa */}
        <Animated.View
          style={{
            height: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 44],
            }),
            opacity: fadeAnim,
            marginTop: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 8],
            }),
            overflow: 'hidden',
          }}>
          <View className="flex-row items-center rounded-lg bg-background-100 px-3">
            <Ionicons name="search-outline" size={16} color="#64748b" />
            <TextInput
              className="ml-2 h-10 flex-1 text-text-dark"
              placeholder="Buscar plantão..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Filtros */}
        <Animated.View
          style={{
            height: filtersHeight,
            opacity: showFilters ? 1 : 0,
            marginTop: showFilters ? 8 : 0,
            overflow: 'hidden',
          }}>
          <TouchableOpacity
            className="mb-2 rounded-lg bg-primary/10 p-3"
            onPress={() => setShowMonthPicker(true)}>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-primary">
                {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
              </Text>
              <Ionicons name="calendar-outline" size={18} color="#18cb96" />
            </View>
          </TouchableOpacity>

          <SelectField
            label=""
            value={selectedLocationId}
            onValueChange={setSelectedLocationId}
            options={[
              { value: '', label: 'Todos os locais', icon: 'business-outline' },
              ...locationOptions,
            ]}
            placeholder="Filtrar por local"
          />

          <SelectField
            label=""
            value={selectedContractorId}
            onValueChange={setSelectedContractorId}
            options={[
              { value: '', label: 'Todos os contratantes', icon: 'briefcase-outline' },
              ...contractorOptions,
            ]}
            placeholder="Filtrar por contratante"
          />
        </Animated.View>
      </View>

      {/* Resumo */}
      <View className="mx-4 my-3 rounded-xl bg-white p-4 shadow-sm">
        <Text className="mb-3 text-base font-bold text-text-dark">
          Resumo de {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
        </Text>

        <View className="flex-row justify-between">
          <View className="flex-1">
            <View className="mb-2">
              <Text className="text-xs text-text-light">Total</Text>
              <Text className="text-lg font-bold text-text-dark">
                {formatCurrency(summary.total)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <View className="mr-4">
                <Text className="text-xs text-text-light">Pagos</Text>
                <Text className="font-medium text-success">{formatCurrency(summary.paid)}</Text>
                <Text className="text-xs text-text-light">{summary.paidCount} plantões</Text>
              </View>

              <View>
                <Text className="text-xs text-text-light">Pendentes</Text>
                <Text className="font-medium text-warning">{formatCurrency(summary.pending)}</Text>
                <Text className="text-xs text-text-light">{summary.pendingCount} plantões</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Modo de seleção */}
      {isSelectionMode && (
        <View className="mx-4 mb-2 flex-row items-center justify-between rounded-lg bg-primary/10 p-3">
          <Text className="text-sm font-medium text-primary">
            {selectedShifts.size} selecionado(s)
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              className="mr-2 rounded-md bg-primary px-3 py-1"
              onPress={handleSelectAll}>
              <Text className="text-xs font-medium text-white">
                {selectedShifts.size === filteredShifts.length ? 'Desmarcar' : 'Selecionar'} Todos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-md bg-text-light px-3 py-1"
              onPress={() => {
                setIsSelectionMode(false);
                setSelectedShifts(new Set());
              }}>
              <Text className="text-xs font-medium text-white">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Lista de plantões */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#18cb96" />
          <Text className="mt-4 text-gray-500">Carregando plantões...</Text>
        </View>
      ) : filteredShifts.length > 0 ? (
        <FlatList
          data={filteredShifts}
          renderItem={renderShiftItem}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-20"
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="calendar-clear-outline" size={64} color="#cbd5e1" />
          <Text className="mt-4 text-center text-lg font-bold text-text-dark">
            Nenhum plantão encontrado
          </Text>
          <Text className="mt-2 text-center text-sm text-text-light">
            Não há plantões registrados para o período selecionado.
          </Text>
        </View>
      )}

      {/* Botões de ação flutuantes */}
      {isSelectionMode && selectedShifts.size > 0 && (
        <View className="absolute bottom-6 left-6 right-6 flex-row justify-center space-x-3">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center rounded-full bg-success py-3 shadow-lg"
            onPress={handleMarkAsPaid}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text className="ml-2 font-medium text-white">Marcar como Pago</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center rounded-full bg-warning py-3 shadow-lg"
            onPress={handleMarkAsUnpaid}>
            <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />
            <Text className="ml-2 font-medium text-white">Marcar como Pendente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de seleção de mês */}
      <MonthYearPicker
        visible={showMonthPicker}
        currentDate={selectedMonth}
        onSelect={(date) => {
          setSelectedMonth(date);
          setShowMonthPicker(false);
        }}
        onClose={() => setShowMonthPicker(false)}
      />
    </SafeAreaView>
  );
}
