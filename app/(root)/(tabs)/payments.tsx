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

// IMPORTAR OS NOVOS COMPONENTES E HOOKS
import { useSelection } from '@/hooks/useSelection';
import { SelectableListItem } from '@/components/SelectableListItem';
import { Checkbox } from '@/components/ui/CheckBox';
import { PAYMENT_MESSAGES, PAYMENT_COLORS, PAYMENT_ANIMATIONS } from '@/utils/consts';

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

  const fadeAnim = useState(new Animated.Value(0))[0];
  const [showFilters, setShowFilters] = useState(false);
  const filtersHeight = useState(new Animated.Value(0))[0];
  const selectionBarAnim = useState(new Animated.Value(0))[0];

  const { showDialog } = useDialog();
  const { showToast } = useToast();
  const router = useRouter();
  const shiftsApi = useShiftsApi();
  const paymentsApi = usePaymentsApi();
  const { locationOptions } = useLocationsSelector();
  const { contractorOptions } = useContractorsSelector();

  // USAR O HOOK DE SELEÇÃO
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

  // Animações
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showSearch ? 1 : 0,
      duration: PAYMENT_ANIMATIONS.FADE_DURATION,
      useNativeDriver: false,
    }).start();
  }, [showSearch, fadeAnim]);

  useEffect(() => {
    Animated.timing(filtersHeight, {
      toValue: showFilters ? 160 : 0,
      duration: PAYMENT_ANIMATIONS.SLIDE_DURATION,
      useNativeDriver: false,
    }).start();
  }, [showFilters, filtersHeight]);

  useEffect(() => {
    Animated.timing(selectionBarAnim, {
      toValue: isSelectionMode ? 1 : 0,
      duration: PAYMENT_ANIMATIONS.SELECTION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [isSelectionMode, selectionBarAnim]);

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

      const [shiftsData, paymentsData] = await Promise.all([
        shiftsApi.getShifts(filters),
        paymentsApi.getPayments({
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
      ]);

      // Mapear plantões com informações de pagamento
      const shiftsWithPaymentInfo = shiftsData.map((shift) => {
        const payment = paymentsData.find((p) => p.shiftId === shift.id);
        return {
          ...shift,
          isPaid: payment?.status === 'completed' || false,
          paymentId: payment?.id,
        };
      });

      setShifts(shiftsWithPaymentInfo);
      setFilteredShifts(shiftsWithPaymentInfo);

      if (isRefresh) {
        showToast(PAYMENT_MESSAGES.TOAST_UPDATE_SUCCESS, 'success');
      }
    } catch (error: any) {
      showToast(
        `${PAYMENT_MESSAGES.TOAST_LOAD_ERROR}: ${error.message || 'Erro desconhecido'}`,
        'error'
      );
    } finally {
      setRefreshing(false);
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    await loadShifts(true);
  }, []);

  // Carregar dados quando filtros mudam
  useEffect(() => {
    loadShifts(false);
  }, [selectedMonth, selectedLocationId, selectedContractorId]);

  // Filtro de pesquisa
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
          setIsLoading(true);
          let successCount = 0;

          for (const shift of selectedItems) {
            if (!shift.isPaid) {
              try {
                await paymentsApi.createPayment({
                  shiftId: shift.id,
                  paymentDate: format(new Date(), 'yyyy-MM-dd'),
                  method: 'transferencia',
                  paid: true,
                });
                successCount++;
              } catch (error) {
                console.error(`Erro ao marcar plantão ${shift.id} como pago:`, error);
              }
            }
          }

          if (successCount > 0) {
            showToast(PAYMENT_MESSAGES.TOAST_MARK_PAID_SUCCESS(successCount), 'success');
          }

          clearSelection();
          await loadShifts(false);
        } catch (error: any) {
          console.error('Erro ao marcar como pago:', error);
          showToast(PAYMENT_MESSAGES.TOAST_PAYMENT_ERROR, 'error');
        }
      },
    });
  }, [selectedItems, selectionCount, paymentsApi, showDialog, showToast, clearSelection]);

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
          setIsLoading(true);
          let successCount = 0;

          for (const shift of selectedItems) {
            if (shift.isPaid && shift.paymentId) {
              try {
                await paymentsApi.deletePayment(shift.paymentId);
                successCount++;
              } catch (error) {
                console.error(`Erro ao marcar plantão ${shift.id} como não pago:`, error);
              }
            }
          }

          if (successCount > 0) {
            showToast(PAYMENT_MESSAGES.TOAST_MARK_UNPAID_SUCCESS(successCount), 'success');
          }

          clearSelection();
          await loadShifts(false);
        } catch (error: any) {
          console.error('Erro ao marcar como não pago:', error);
          showToast(PAYMENT_MESSAGES.TOAST_PAYMENT_ERROR, 'error');
        }
      },
    });
  }, [selectedItems, selectionCount, paymentsApi, showDialog, showToast, clearSelection]);

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

  const renderShiftItem = useCallback(
    ({ item, index }: { item: ShiftWithPayment; index: number }) => {
      return (
        <SelectableListItem
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
                    {item.startTime} - {item.endTime}
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

  // Calcular resumo
  const summary = {
    total: filteredShifts.reduce((sum, shift) => sum + shift.value, 0),
    paid: filteredShifts.filter((s) => s.isPaid).reduce((sum, shift) => sum + shift.value, 0),
    pending: filteredShifts.filter((s) => !s.isPaid).reduce((sum, shift) => sum + shift.value, 0),
    paidCount: filteredShifts.filter((s) => s.isPaid).length,
    pendingCount: filteredShifts.filter((s) => !s.isPaid).length,
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="z-10 border-b border-background-300 bg-white px-4 py-3">
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

        {/* Filtros */}
        <Animated.View
          style={{
            height: filtersHeight,
            opacity: showFilters ? 1 : 0,
            marginTop: showFilters ? 8 : 0,
            overflow: 'hidden',
          }}>
          <TouchableOpacity
            className="mb-3 rounded-lg bg-primary/10 p-3"
            onPress={() => setShowMonthPicker(true)}>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-primary">
                {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
              </Text>
              <Ionicons name="calendar-outline" size={18} color={PAYMENT_COLORS.PRIMARY} />
            </View>
          </TouchableOpacity>

          <View className="mb-2">
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
            />
          </View>

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
          />
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
          contentContainerClassName="px-4 pb-24"
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
        <View
          className="absolute bottom-6 left-6 right-6"
          style={{
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          }}>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center rounded-full bg-success py-4"
              onPress={handleMarkAsPaid}
              style={{ elevation: 2 }}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text className="ml-2 font-medium text-white">
                {PAYMENT_MESSAGES.ACTION_MARK_PAID}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center rounded-full bg-warning py-4"
              onPress={handleMarkAsUnpaid}
              style={{ elevation: 2 }}>
              <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />
              <Text className="ml-2 font-medium text-white">
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
    </SafeAreaView>
  );
}
