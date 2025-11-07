import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SelectField } from '../../components/form/SelectField';
import { Checkbox } from '../../components/ui/CheckBox';
import MonthYearPicker from '../../components/ui/MonthYearPicker';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { SelectableListItem } from '../../components/ui/SelectableListItem';
import { useToast } from '../../components/ui/Toast';
import {
  PAYMENT_MESSAGES,
  PAYMENT_COLORS,
  PAYMENT_ANIMATIONS,
} from '../../constants/payment-constants';
import { useDialog } from '../../contexts/DialogContext';
import { useShiftsSync } from '../../contexts/ShiftsSyncContext';
import { useContractorsSelector } from '../../hooks/useContractorsSelector';
import { useLocationsSelector } from '../../hooks/useLocationsSelector';
import { useSelection } from '../../hooks/useSelection';
import { usePaymentsApi } from '../../services/payments-api';
import { useShiftsApi, Shift } from '../../services/shifts-api';
import formatters from '../../utils/formatters';

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const formatDate = (dateString: string): string => {
  try {
    const date = formatters.normalizeToLocalDate(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (e) {
    return dateString;
  }
};

interface ShiftWithPayment extends Shift {
  isPaid: boolean;
  paymentId?: string;
}

// Hook debounce otimizado
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default function PaymentsScreen() {
  const [shifts, setShifts] = useState<ShiftWithPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Animações - Refatoração completa para melhor fluidez
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const filtersAnim = useRef(new Animated.Value(0)).current;
  const selectionBarAnim = useRef(new Animated.Value(0)).current;

  // Refs para controle rigoroso de carregamento
  const lastLoadTimeRef = useRef(0);
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentFiltersRef = useRef<string>('');
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // APIs e hooks
  const { showDialog } = useDialog();
  const { showToast } = useToast();
  const { subscribeToRefresh } = useShiftsSync();
  const router = useRouter();
  const shiftsApi = useShiftsApi();
  const paymentsApi = usePaymentsApi();
  const { locationOptions } = useLocationsSelector();
  const { contractorOptions } = useContractorsSelector();

  // Debounce para pesquisa
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // String de filtros para comparação (evita re-execução desnecessária)
  const filtersString = useMemo(() => {
    const startDate = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
    return `${startDate}|${endDate}|${selectedLocationId}|${selectedContractorId}`;
  }, [selectedMonth, selectedLocationId, selectedContractorId]);

  // Plantões filtrados por pesquisa
  const filteredShifts = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return shifts;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return shifts.filter(
      (shift) =>
        shift.location?.name.toLowerCase().includes(query) ||
        shift.contractor?.name.toLowerCase().includes(query) ||
        shift.notes?.toLowerCase().includes(query)
    );
  }, [shifts, debouncedSearchQuery]);

  // Hook de seleção
  const {
    selectedItems,
    isSelectionMode,
    selectionCount,
    isAllSelected,
    isSelected,
    handlePress,
    handleLongPress,
    toggleSelectAll,
    exitSelectionMode,
    clearSelection,
  } = useSelection({
    items: filteredShifts,
    keyExtractor: (shift) => shift.id,
  });

  // Função de carregamento completamente refatorada
  const loadShifts = useCallback(
    async (forceReload = false) => {
      const now = Date.now();

      // Controle rigoroso para evitar múltiplas chamadas
      if (isLoadingRef.current && !forceReload) {
        console.log('🚫 Carregamento já em andamento, ignorando...');
        return;
      }

      // Evitar chamadas muito frequentes
      if (!forceReload && now - lastLoadTimeRef.current < 2000) {
        console.log('🚫 Carregamento muito frequente, ignorando...');
        return;
      }

      // Verificar se os filtros realmente mudaram
      if (!forceReload && currentFiltersRef.current === filtersString) {
        console.log('🚫 Filtros não mudaram, ignorando...');
        return;
      }

      // Cancelar requisição anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Cancelar timeout de carregamento anterior
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }

      // Marcar como carregando
      isLoadingRef.current = true;
      lastLoadTimeRef.current = now;
      currentFiltersRef.current = filtersString;

      try {
        setIsLoading(!forceReload);
        if (forceReload) setRefreshing(true);

        const filters = {
          startDate: format(startOfMonth(selectedMonth), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(selectedMonth), 'yyyy-MM-dd'),
          locationId: selectedLocationId || undefined,
          contractorId: selectedContractorId || undefined,
        };

        console.log('🔄 Carregando plantões:', filters);

        // Nova abortController para esta requisição
        abortControllerRef.current = new AbortController();

        const [shiftsData, paymentsData] = await Promise.all([
          shiftsApi.getShifts(filters),
          paymentsApi.getPayments({
            startDate: filters.startDate,
            endDate: filters.endDate,
          }),
        ]);

        console.log('📊 Dados carregados:', {
          shiftsCount: shiftsData.length,
          paymentsCount: paymentsData.length,
        });

        // Processar dados de forma otimizada
        const paymentsMap = new Map<string, any>();
        paymentsData.forEach((payment) => {
          if (payment.shiftId) {
            paymentsMap.set(payment.shiftId, payment);
          }
        });

        const shiftsWithPaymentInfo = shiftsData
          .map((shift) => {
            const payment = paymentsMap.get(shift.id);
            const isPaid = Boolean(payment?.paid) || payment?.status === 'completed';

            return {
              ...shift,
              isPaid,
              paymentId: payment?.id,
              startTime: shift.startTime || '',
              endTime: shift.endTime || '',
              location: shift.location || null,
              contractor: shift.contractor || null,
              value: shift.value || 0,
            };
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setShifts(shiftsWithPaymentInfo as ShiftWithPayment[]);

        if (forceReload) {
          showToast(PAYMENT_MESSAGES.TOAST_UPDATE_SUCCESS, 'success');
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('🔄 Requisição cancelada');
          return;
        }

        console.error('❌ Erro ao carregar plantões:', error);
        const errorMessage = error.message?.includes('timeout')
          ? 'Timeout na requisição. Verifique sua conexão.'
          : error.message || 'Erro desconhecido';

        showToast(`${PAYMENT_MESSAGES.TOAST_LOAD_ERROR}: ${errorMessage}`, 'error');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
        isLoadingRef.current = false;
      }
    },
    [
      filtersString,
      selectedMonth,
      selectedLocationId,
      selectedContractorId,
      shiftsApi,
      paymentsApi,
      showToast,
    ]
  );

  // Carregamento inicial apenas no foco
  useFocusEffect(
    useCallback(() => {
      if (shifts.length === 0 && !isLoadingRef.current) {
        console.log('👁️ Carregamento inicial por foco');
        loadShifts(false);
      }
    }, [loadShifts]) // loadShifts como dependência é seguro aqui
  );

  // Monitorar mudanças de filtros de forma controlada
  useEffect(() => {
    // Só executar se já fizemos carregamento inicial
    if (lastLoadTimeRef.current === 0) return;

    // Cancelar timeout anterior
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    // Verificar se filtros realmente mudaram
    if (currentFiltersRef.current === filtersString) {
      return;
    }

    console.log('📋 Filtros detectaram mudança, agendando carregamento...');

    // Agendar carregamento com debounce
    loadTimeoutRef.current = setTimeout(() => {
      if (!isLoadingRef.current) {
        loadShifts(false);
      }
    }, 1000); // Debounce de 1 segundo

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [filtersString]); // Apenas filtersString como dependência

  // Inscrever na sincronização de plantões
  useEffect(() => {
    const unsubscribe = subscribeToRefresh(() => {
      console.log('🔄 Tela de pagamentos recebeu notificação de atualização');
      loadShifts(true);
    });

    return unsubscribe;
  }, [subscribeToRefresh, loadShifts]);

  // Função de refresh manual
  const handleRefresh = useCallback(async () => {
    console.log('🔄 Refresh manual solicitado');
    await loadShifts(true);
  }, [loadShifts]);

  // Função para atualizar status local
  const updateShiftPaymentStatus = useCallback(
    (shiftId: string, isPaid: boolean, paymentId?: string) => {
      setShifts((prevShifts) =>
        prevShifts.map((shift) => (shift.id === shiftId ? { ...shift, isPaid, paymentId } : shift))
      );
    },
    []
  );

  // Função para marcar como pago
  const handleMarkAsPaid = useCallback(async () => {
    if (selectionCount === 0) {
      showToast(PAYMENT_MESSAGES.TOAST_SELECT_WARNING, 'warning');
      return;
    }

    const totalValue = selectedItems.reduce((sum, shift) => sum + shift.value, 0);

    showDialog({
      title: PAYMENT_MESSAGES.DIALOG_CONFIRM_PAYMENT_TITLE,
      message: PAYMENT_MESSAGES.DIALOG_CONFIRM_PAYMENT_MESSAGE(
        selectionCount,
        formatCurrency(totalValue)
      ),
      type: 'confirm',
      confirmText: PAYMENT_MESSAGES.ACTION_CONFIRM,
      onConfirm: async () => {
        try {
          console.log('💳 Marcando como pago:', selectionCount, 'plantões');

          // Updates otimistas
          selectedItems.forEach((shift) => {
            if (!shift.isPaid) {
              updateShiftPaymentStatus(shift.id, true, 'temp-' + shift.id);
            }
          });

          clearSelection();

          let successCount = 0;
          const errors: string[] = [];

          for (const shift of selectedItems) {
            if (!shift.isPaid) {
              try {
                const payment = await paymentsApi.createPayment({
                  shiftId: shift.id,
                  paymentDate: format(new Date(), 'yyyy-MM-dd'),
                  method: 'transferencia',
                  paid: true,
                });

                updateShiftPaymentStatus(shift.id, true, payment.id);
                successCount++;
              } catch (error: any) {
                console.error(`❌ Erro ao marcar plantão ${shift.id}:`, error);
                updateShiftPaymentStatus(shift.id, false);
                errors.push(shift.location?.name || 'Plantão sem local');
              }
            }
          }

          // Sincronização após operação (com delay maior)
          setTimeout(() => handleRefresh(), 3000);

          if (successCount > 0) {
            showToast(PAYMENT_MESSAGES.TOAST_MARK_PAID_SUCCESS(successCount), 'success');
          }
          if (errors.length > 0) {
            showToast(`Erro ao marcar ${errors.length} plantão(ões)`, 'error');
          }
        } catch (error: any) {
          console.error('❌ Erro geral:', error);
          showToast(PAYMENT_MESSAGES.TOAST_PAYMENT_ERROR, 'error');
          handleRefresh();
        }
      },
    });
  }, [
    selectedItems,
    selectionCount,
    paymentsApi,
    showDialog,
    showToast,
    clearSelection,
    updateShiftPaymentStatus,
    handleRefresh,
  ]);

  // Função para marcar como não pago
  const handleMarkAsUnpaid = useCallback(async () => {
    if (selectionCount === 0) {
      showToast(PAYMENT_MESSAGES.TOAST_SELECT_WARNING, 'warning');
      return;
    }

    showDialog({
      title: PAYMENT_MESSAGES.DIALOG_REMOVE_PAYMENT_TITLE,
      message: PAYMENT_MESSAGES.DIALOG_REMOVE_PAYMENT_MESSAGE(selectionCount),
      type: 'confirm',
      confirmText: PAYMENT_MESSAGES.ACTION_CONFIRM,
      onConfirm: async () => {
        try {
          console.log('🗑️ Removendo pagamentos:', selectionCount, 'plantões');

          // Updates otimistas
          selectedItems.forEach((shift) => {
            if (shift.isPaid) {
              updateShiftPaymentStatus(shift.id, false);
            }
          });

          clearSelection();

          let successCount = 0;
          const errors: string[] = [];

          for (const shift of selectedItems) {
            if (shift.isPaid && shift.paymentId) {
              try {
                await paymentsApi.deletePayment(shift.paymentId);
                successCount++;
              } catch (error: any) {
                console.error(`❌ Erro ao remover pagamento ${shift.paymentId}:`, error);
                updateShiftPaymentStatus(shift.id, true, shift.paymentId);
                errors.push(shift.location?.name || 'Plantão sem local');
              }
            }
          }

          // Sincronização após operação (com delay maior)
          setTimeout(() => handleRefresh(), 3000);

          if (successCount > 0) {
            showToast(PAYMENT_MESSAGES.TOAST_MARK_UNPAID_SUCCESS(successCount), 'success');
          }
          if (errors.length > 0) {
            showToast(`Erro ao desmarcar ${errors.length} plantão(ões)`, 'error');
          }
        } catch (error: any) {
          console.error('❌ Erro geral:', error);
          showToast(PAYMENT_MESSAGES.TOAST_PAYMENT_ERROR, 'error');
          handleRefresh();
        }
      },
    });
  }, [
    selectedItems,
    selectionCount,
    paymentsApi,
    showDialog,
    showToast,
    clearSelection,
    updateShiftPaymentStatus,
    handleRefresh,
  ]);

  // Handlers de UI
  const toggleSearch = useCallback(() => {
    if (showSearch && searchQuery) {
      setSearchQuery('');
    }
    setShowSearch(!showSearch);
  }, [showSearch, searchQuery]);

  const toggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  const handleItemPress = useCallback(
    (shift: ShiftWithPayment) => {
      router.push(`/shifts/${shift.id}`);
    },
    [router]
  );

  // Animações - Sistema refatorado para maior fluidez
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showSearch ? 1 : 0,
      duration: PAYMENT_ANIMATIONS.FADE_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [showSearch, fadeAnim]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(filtersAnim, {
        toValue: showFilters ? 1 : 0,
        duration: PAYMENT_ANIMATIONS.FILTERS_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [showFilters, filtersAnim]);

  useEffect(() => {
    Animated.timing(selectionBarAnim, {
      toValue: isSelectionMode ? 1 : 0,
      duration: PAYMENT_ANIMATIONS.SELECTION_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isSelectionMode, selectionBarAnim]);

  // Renderizador de item memoizado
  const renderShiftItem = useCallback(
    ({ item, index }: { item: ShiftWithPayment; index: number }) => {
      const formatTimeDisplay = (time: string | Date | null | undefined): string => {
        if (!time) return '';
        return formatters.formatTime(time);
      };

      return (
        <SelectableListItem
          key={item.id}
          isSelected={isSelected(item)}
          isSelectionMode={isSelectionMode}
          onPress={() => handlePress(item, handleItemPress)}
          onLongPress={() => handleLongPress(item)}
          index={index}
          animationDelay={PAYMENT_ANIMATIONS.LIST_ITEM_DELAY}>
          <View className="flex-row items-start justify-between">
            {/* Informações do plantão */}
            <View className="mr-3 flex-1">
              <View className="mb-2">
                <Text className="text-base font-semibold text-text-dark">
                  {formatDate(item.date)}
                </Text>
                {item.startTime && item.endTime && (
                  <Text className="mt-1 text-xs text-text-light">
                    {formatTimeDisplay(item.startTime)} - {formatTimeDisplay(item.endTime)}
                  </Text>
                )}
              </View>

              <View className="mb-2 flex-row items-center">
                <View
                  className="mr-2 h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.location?.color || PAYMENT_COLORS.TEXT_LIGHT }}
                />
                <Text className="flex-1 text-sm text-text-dark" numberOfLines={1}>
                  {item.location?.name || PAYMENT_MESSAGES.PLACEHOLDER_NO_LOCATION}
                </Text>
              </View>

              {item.contractor && (
                <View className="flex-row items-center">
                  <Ionicons name="briefcase-outline" size={14} color={PAYMENT_COLORS.TEXT_LIGHT} />
                  <Text className="ml-1 text-xs text-text-light" numberOfLines={1}>
                    {item.contractor.name}
                  </Text>
                </View>
              )}
            </View>

            {/* Valor e status */}
            <View className="items-end">
              <Text className="mb-2 text-lg font-bold text-primary">
                {formatCurrency(item.value)}
              </Text>
              <View
                className={`rounded-full px-3 py-1 ${
                  item.isPaid ? 'bg-success/20' : 'bg-warning/20'
                }`}>
                <Text
                  className={`text-xs font-medium ${
                    item.isPaid ? 'text-success' : 'text-warning'
                  }`}>
                  {item.isPaid ? PAYMENT_MESSAGES.STATUS_PAID : PAYMENT_MESSAGES.STATUS_PENDING}
                </Text>
              </View>
            </View>
          </View>
        </SelectableListItem>
      );
    },
    [isSelected, isSelectionMode, handlePress, handleLongPress, handleItemPress]
  );

  // Cálculo do resumo memoizado
  const summary = useMemo(() => {
    const total = filteredShifts.reduce((sum, shift) => sum + shift.value, 0);
    const paid = filteredShifts
      .filter((s) => s.isPaid)
      .reduce((sum, shift) => sum + shift.value, 0);
    const pending = filteredShifts
      .filter((s) => !s.isPaid)
      .reduce((sum, shift) => sum + shift.value, 0);
    const paidCount = filteredShifts.filter((s) => s.isPaid).length;
    const pendingCount = filteredShifts.filter((s) => !s.isPaid).length;

    return {
      total,
      paid,
      pending,
      paidCount,
      pendingCount,
    };
  }, [filteredShifts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  return (
    <ScreenWrapper className="flex-1 bg-background">
      {/* Header */}
      <View className="z-10 bg-white px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-text-dark">{PAYMENT_MESSAGES.SCREEN_TITLE}</Text>

          <View className="flex-row">
            <TouchableOpacity
              className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-background-100"
              onPress={toggleSearch}
              accessibilityLabel={PAYMENT_MESSAGES.A11Y_SEARCH_BUTTON}>
              <Ionicons
                name={showSearch ? 'close-outline' : 'search-outline'}
                size={20}
                color={PAYMENT_COLORS.TEXT_DARK}
              />
            </TouchableOpacity>

            <TouchableOpacity
              className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-background-100"
              onPress={toggleFilters}
              accessibilityLabel={PAYMENT_MESSAGES.A11Y_FILTER_BUTTON}>
              <Ionicons name="options-outline" size={20} color={PAYMENT_COLORS.TEXT_DARK} />
              {(selectedLocationId || selectedContractorId) && (
                <View className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="h-9 w-9 items-center justify-center rounded-full bg-background-100"
              onPress={handleRefresh}
              disabled={refreshing}
              accessibilityLabel={PAYMENT_MESSAGES.A11Y_REFRESH_BUTTON}>
              {refreshing ? (
                <ActivityIndicator size="small" color={PAYMENT_COLORS.PRIMARY} />
              ) : (
                <Ionicons name="refresh-outline" size={18} color={PAYMENT_COLORS.TEXT_DARK} />
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
            <Ionicons name="search-outline" size={16} color={PAYMENT_COLORS.TEXT_LIGHT} />
            <TextInput
              className="ml-2 h-10 flex-1 text-text-dark"
              placeholder={PAYMENT_MESSAGES.PLACEHOLDER_SEARCH}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={PAYMENT_COLORS.TEXT_LIGHT} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Filtros - Animação completamente refatorada */}
        <Animated.View
          pointerEvents={showFilters ? 'auto' : 'none'}
          style={{
            height: filtersAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 180], // Altura ajustada para o conteúdo real
            }),
            opacity: filtersAnim.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [0, 0, 1], // Opacity começa a aparecer após 30% da animação
            }),
            marginTop: filtersAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 8], // Margem animada suavemente
            }),
          }}>
          <Animated.View
            style={{
              transform: [
                {
                  translateY: filtersAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0], // Efeito de slide sutil
                  }),
                },
              ],
            }}>
            <TouchableOpacity
              className="mb-3 rounded-lg bg-primary/10 p-3"
              onPress={() => setShowMonthPicker(true)}
              activeOpacity={0.7}
              disabled={!showFilters}>
              <View className="flex-row items-center justify-between" pointerEvents="none">
                <Text className="text-sm font-medium text-primary">
                  {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={PAYMENT_COLORS.PRIMARY} />
              </View>
            </TouchableOpacity>

            <SelectField
              label=""
              value={selectedLocationId}
              onValueChange={setSelectedLocationId}
              options={[
                {
                  value: '',
                  label: PAYMENT_MESSAGES.FILTER_ALL_LOCATIONS,
                  icon: 'business-outline',
                },
                ...locationOptions,
              ]}
              placeholder={PAYMENT_MESSAGES.FILTER_BY_LOCATION}
              className="mb-3"
            />

            <SelectField
              label=""
              value={selectedContractorId}
              onValueChange={setSelectedContractorId}
              options={[
                {
                  value: '',
                  label: PAYMENT_MESSAGES.FILTER_ALL_CONTRACTORS,
                  icon: 'briefcase-outline',
                },
                ...contractorOptions,
              ]}
              placeholder={PAYMENT_MESSAGES.FILTER_BY_CONTRACTOR}
              className="mb-0"
            />
          </Animated.View>
        </Animated.View>
      </View>

      {/* Resumo */}
      <View className="mx-4 my-3 rounded-xl bg-white p-4 shadow-sm">
        <Text className="mb-3 text-base font-bold text-text-dark">
          {PAYMENT_MESSAGES.SUMMARY_TITLE} {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
        </Text>

        <View className="mb-3">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm text-text-light">{PAYMENT_MESSAGES.LABEL_TOTAL}</Text>
            <Text className="text-xl font-bold text-text-dark">
              {formatCurrency(summary.total)}
            </Text>
          </View>

          <View className="h-2 overflow-hidden rounded-full bg-gray-200">
            <View
              className="h-full bg-success"
              style={{ width: `${summary.total > 0 ? (summary.paid / summary.total) * 100 : 0}%` }}
            />
          </View>
        </View>

        <View className="flex-row justify-between">
          <View className="mr-4 flex-1">
            <View className="mb-1 flex-row items-center">
              <View className="mr-2 h-3 w-3 rounded-full bg-success" />
              <Text className="text-xs text-text-light">{PAYMENT_MESSAGES.LABEL_RECEIVED}</Text>
            </View>
            <Text className="font-semibold text-success">{formatCurrency(summary.paid)}</Text>
            <Text className="text-xs text-text-light">
              {summary.paidCount} {PAYMENT_MESSAGES.LABEL_SHIFTS}
            </Text>
          </View>

          <View className="flex-1">
            <View className="mb-1 flex-row items-center">
              <View className="mr-2 h-3 w-3 rounded-full bg-warning" />
              <Text className="text-xs text-text-light">{PAYMENT_MESSAGES.LABEL_PENDING}</Text>
            </View>
            <Text className="font-semibold text-warning">{formatCurrency(summary.pending)}</Text>
            <Text className="text-xs text-text-light">
              {summary.pendingCount} {PAYMENT_MESSAGES.LABEL_SHIFTS}
            </Text>
          </View>
        </View>
      </View>

      {/* Barra de seleção */}
      <Animated.View
        style={{
          opacity: selectionBarAnim,
          transform: [
            {
              translateY: selectionBarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ],
        }}
        className="mx-4 mb-2">
        {isSelectionMode && (
          <View className="flex-row items-center justify-between rounded-lg bg-primary/10 p-3">
            <View className="flex-row items-center">
              <TouchableOpacity className="mr-3" onPress={toggleSelectAll}>
                <Checkbox
                  checked={isAllSelected}
                  size={24}
                  checkedColor={PAYMENT_COLORS.PRIMARY}
                  uncheckedColor="#d1d5db"
                />
              </TouchableOpacity>
              <Text className="text-sm font-medium text-primary">
                {selectionCount === 0
                  ? PAYMENT_MESSAGES.ACTION_SELECT_ALL
                  : `${selectionCount} selecionado(s)`}
              </Text>
            </View>

            <TouchableOpacity
              className="rounded-full bg-text-light px-3 py-1"
              onPress={exitSelectionMode}>
              <Text className="text-xs font-medium text-white">
                {PAYMENT_MESSAGES.ACTION_CANCEL}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* Lista de plantões */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={PAYMENT_COLORS.PRIMARY} />
          <Text className="mt-4 text-gray-500">Carregando plantões...</Text>
        </View>
      ) : filteredShifts.length > 0 ? (
        <FlatList
          data={filteredShifts}
          renderItem={renderShiftItem}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-4"
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListHeaderComponent={() =>
            !isSelectionMode && (
              <Text className="mb-2 text-xs text-text-light">
                {PAYMENT_MESSAGES.INSTRUCTION_LONG_PRESS}
              </Text>
            )
          }
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="calendar-clear-outline" size={64} color="#cbd5e1" />
          <Text className="mt-4 text-center text-lg font-bold text-text-dark">
            {PAYMENT_MESSAGES.EMPTY_STATE_TITLE}
          </Text>
          <Text className="mt-2 text-center text-sm text-text-light">
            {PAYMENT_MESSAGES.EMPTY_STATE_MESSAGE}
          </Text>
        </View>
      )}

      {/* Botões de ação flutuantes */}
      {isSelectionMode && selectionCount > 0 && (
        <View className="absolute bottom-5 left-4 right-4 z-50">
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center rounded-2xl bg-success py-5"
              onPress={handleMarkAsPaid}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
              <Text className="ml-2 text-base font-semibold text-white">
                {PAYMENT_MESSAGES.ACTION_MARK_PAID}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center rounded-2xl bg-warning py-5"
              onPress={handleMarkAsUnpaid}>
              <Ionicons name="close-circle-outline" size={22} color="#FFFFFF" />
              <Text className="ml-2 text-base font-semibold text-white">
                {PAYMENT_MESSAGES.ACTION_MARK_UNPAID}
              </Text>
            </TouchableOpacity>
          </View>
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
    </ScreenWrapper>
  );
}
