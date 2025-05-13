import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDialog } from '@/contexts/DialogContext';
import { useToast } from '@/components/ui/Toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PaymentFormModal from '@/components/payment/PaymentFormModal';

// Tipo para pagamento
interface Payment {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  // Campos adicionais úteis para UI
  method?: string;
  shiftTitle?: string;
  locationName?: string;
  locationColor?: string;
}

// Dados mockados (substituir por chamada de API real)
const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay1',
    description: 'Plantão Hospital Central - Jan/24',
    amount: 1250.75,
    date: '2024-02-15',
    status: 'completed',
    method: 'Transferência',
    shiftTitle: 'Plantão Emergência',
    locationName: 'Hospital Central',
    locationColor: '#0077B6',
  },
  {
    id: 'pay2',
    description: 'Plantão Clínica Sul - Jan/24',
    amount: 800.0,
    date: '2024-02-20',
    status: 'pending',
    method: 'PIX',
    shiftTitle: 'Plantão Cardiologia',
    locationName: 'Clínica Sul',
    locationColor: '#2A9D8F',
  },
  {
    id: 'pay3',
    description: 'Plantão Hospital Norte - Fev/24',
    amount: 1100.5,
    date: '2024-03-05',
    status: 'pending',
    method: 'Depósito',
    shiftTitle: 'Plantão Pronto Socorro',
    locationName: 'Hospital Norte',
    locationColor: '#E9C46A',
  },
  {
    id: 'pay4',
    description: 'Adiantamento Fev/24',
    amount: 500.0,
    date: '2024-02-10',
    status: 'completed',
    method: 'PIX',
    shiftTitle: 'Adiantamento',
    locationName: 'Hospital Central',
    locationColor: '#0077B6',
  },
  {
    id: 'pay5',
    description: 'Plantão Extra Fim de Semana',
    amount: 650.0,
    date: '2024-03-12',
    status: 'failed',
    method: 'Transferência',
    shiftTitle: 'Plantão UTI',
    locationName: 'Hospital Universitário',
    locationColor: '#E76F51',
  },
];

// Funções utilitárias
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

// Componente principal
export default function PaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>(MOCK_PAYMENTS);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>(MOCK_PAYMENTS);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>(
    'all'
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | undefined>(undefined);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const filtersHeight = useState(new Animated.Value(0))[0];
  const [showFilters, setShowFilters] = useState(false);

  const { showDialog } = useDialog();
  const { showToast } = useToast();
  const router = useRouter();

  // Efeito para animar a barra de pesquisa
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showSearch ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showSearch, fadeAnim]);

  // Efeito para animar os filtros
  useEffect(() => {
    Animated.timing(filtersHeight, {
      toValue: showFilters ? 40 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [showFilters, filtersHeight]);

  // Efeito para filtrar pagamentos baseado na pesquisa
  useEffect(() => {
    let filtered = payments;

    // Aplicar filtro de status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter((payment) => payment.status === selectedFilter);
    }

    // Aplicar filtro de pesquisa
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (payment) =>
          payment.description.toLowerCase().includes(query) ||
          payment.method?.toLowerCase().includes(query) ||
          payment.shiftTitle?.toLowerCase().includes(query) ||
          payment.locationName?.toLowerCase().includes(query)
      );
    }

    setFilteredPayments(filtered);
  }, [searchQuery, payments, selectedFilter]);

  const loadPayments = useCallback(async () => {
    setRefreshing(true);

    try {
      // Simular carregamento (substituir por chamada real à API)
      await new Promise((res) => setTimeout(res, 1000));
      setPayments(MOCK_PAYMENTS);
      setFilteredPayments(MOCK_PAYMENTS);
      showToast('Pagamentos atualizados com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      showToast('Erro ao carregar pagamentos', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [showToast]);

  const confirmDelete = useCallback(
    (payment: Payment) => {
      showDialog({
        title: 'Confirmar exclusão',
        message: `Deseja realmente excluir o pagamento de ${formatCurrency(payment.amount)}?`,
        type: 'confirm',
        confirmText: 'Excluir',
        onConfirm: () => {
          // Simular exclusão (remover do estado local)
          setPayments((prev) => prev.filter((p) => p.id !== payment.id));
          setFilteredPayments((prev) => prev.filter((p) => p.id !== payment.id));
          showToast('Pagamento excluído com sucesso', 'success');
        },
      });
    },
    [showDialog, showToast]
  );

  const navigateToEdit = useCallback((payment: Payment) => {
    setSelectedPaymentId(payment.id);
    setShowPaymentModal(true);
  }, []);

  const navigateToAdd = useCallback(() => {
    setSelectedPaymentId(undefined);
    setShowPaymentModal(true);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    setShowPaymentModal(false);
    loadPayments();
  }, [loadPayments]);

  const toggleSearch = useCallback(() => {
    if (showSearch && searchQuery) {
      setSearchQuery('');
    }
    setShowSearch(!showSearch);
  }, [showSearch, searchQuery]);

  const toggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  const getStatusStyles = useCallback((status: 'pending' | 'completed' | 'failed') => {
    switch (status) {
      case 'completed':
        return {
          backgroundColor: '#10b981', // success
          color: '#ffffff',
          label: 'Recebido',
        };
      case 'pending':
        return {
          backgroundColor: '#f59e0b', // warning
          color: '#ffffff',
          label: 'Pendente',
        };
      case 'failed':
        return {
          backgroundColor: '#ef4444', // error
          color: '#ffffff',
          label: 'Cancelado',
        };
      default:
        return {
          backgroundColor: '#64748b', // text-light
          color: '#ffffff',
          label: 'Desconhecido',
        };
    }
  }, []);

  const renderPaymentItem = useCallback(
    ({ item, index }: { item: Payment; index: number }) => {
      // Animar entrada dos itens na lista
      const translateY = new Animated.Value(50);
      const opacity = new Animated.Value(0);

      const statusStyle = getStatusStyles(item.status);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          delay: index * 50, // Efeito cascata
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();

      return (
        <Animated.View
          style={{
            transform: [{ translateY }],
            opacity,
          }}>
          <TouchableOpacity
            className="mb-3 overflow-hidden rounded-xl bg-white shadow-sm"
            activeOpacity={0.7}
            onPress={() => navigateToEdit(item)}>
            <View className="p-4">
              <View className="flex-row justify-between">
                <View className="mr-2 flex-1">
                  <Text className="text-base font-semibold text-text-dark" numberOfLines={2}>
                    {item.description}
                  </Text>

                  {/* Local e método de pagamento */}
                  <View className="mt-1 flex-row items-center">
                    <View className="flex-row items-center">
                      <View
                        className="mr-1 h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.locationColor || '#64748b' }}
                      />
                      <Text className="text-xs text-text-light">
                        {item.locationName || 'Local não informado'}
                      </Text>
                    </View>

                    {item.method && (
                      <>
                        <Text className="mx-1 text-text-light">•</Text>
                        <Text className="text-xs text-text-light">{item.method}</Text>
                      </>
                    )}
                  </View>

                  {/* Data */}
                  <Text className="mt-1 text-xs text-text-light">{formatDate(item.date)}</Text>
                </View>

                <View className="items-end">
                  <Text className="text-base font-bold text-primary">
                    {formatCurrency(item.amount)}
                  </Text>

                  <View
                    className="mt-1 rounded-full px-2 py-0.5"
                    style={{ backgroundColor: statusStyle.backgroundColor }}>
                    <Text className="text-xs font-medium" style={{ color: statusStyle.color }}>
                      {statusStyle.label}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Botões de ação */}
              <View className="mt-3 flex-row justify-end border-t border-background-200 pt-2">
                <TouchableOpacity
                  className="mr-4 flex-row items-center"
                  onPress={() => navigateToEdit(item)}>
                  <Ionicons name="create-outline" size={16} color="#64748b" />
                  <Text className="ml-1 text-xs text-text-light">Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => confirmDelete(item)}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  <Text className="ml-1 text-xs text-error">Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [confirmDelete, navigateToEdit, getStatusStyles]
  );

  // Totais de pagamentos
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = filteredPayments
    .filter((p) => p.status === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Header com barra de pesquisa */}
      <View className="z-10 border-b border-background-300 bg-white px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-text-dark">Meus Pagamentos</Text>

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
              onPress={loadPayments}
              disabled={refreshing}>
              {refreshing ? (
                <ActivityIndicator size="small" color="#18cb96" />
              ) : (
                <Ionicons name="refresh-outline" size={18} color="#1e293b" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra de pesquisa animada */}
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
              placeholder="Buscar pagamento..."
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

        {/* Filtros animados */}
        <Animated.View
          style={{
            height: filtersHeight,
            opacity: showFilters ? 1 : 0,
            marginTop: showFilters ? 8 : 0,
            overflow: 'hidden',
          }}>
          <View className="flex-row">
            <TouchableOpacity
              className={`mr-2 rounded-full px-3 py-1 ${
                selectedFilter === 'all' ? 'bg-primary' : 'bg-background-100'
              }`}
              onPress={() => setSelectedFilter('all')}>
              <Text
                className={`text-xs font-medium ${
                  selectedFilter === 'all' ? 'text-white' : 'text-text-dark'
                }`}>
                Todos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`mr-2 rounded-full px-3 py-1 ${
                selectedFilter === 'pending' ? 'bg-warning' : 'bg-background-100'
              }`}
              onPress={() => setSelectedFilter('pending')}>
              <Text
                className={`text-xs font-medium ${
                  selectedFilter === 'pending' ? 'text-white' : 'text-text-dark'
                }`}>
                Pendentes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`mr-2 rounded-full px-3 py-1 ${
                selectedFilter === 'completed' ? 'bg-success' : 'bg-background-100'
              }`}
              onPress={() => setSelectedFilter('completed')}>
              <Text
                className={`text-xs font-medium ${
                  selectedFilter === 'completed' ? 'text-white' : 'text-text-dark'
                }`}>
                Recebidos
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* Total Summary */}
      <View className="mx-4 my-3 rounded-xl bg-white p-4 shadow-sm">
        <Text className="mb-2 text-sm text-text-light">Resumo de pagamentos</Text>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base font-bold text-text-dark">Total</Text>
            <Text className="mt-1 text-xs text-text-light">
              {filteredPayments.length} pagamentos
            </Text>
          </View>
          <Text className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</Text>
        </View>

        {pendingAmount > 0 && (
          <View className="mt-3 flex-row justify-between border-t border-background-200 pt-3">
            <Text className="text-sm text-text-light">Pendente</Text>
            <Text className="text-sm font-medium text-warning">
              {formatCurrency(pendingAmount)}
            </Text>
          </View>
        )}
      </View>

      {/* Lista de pagamentos ou estado vazio */}
      {filteredPayments.length > 0 ? (
        <FlatList
          data={filteredPayments}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-4"
          showsVerticalScrollIndicator={false}
          onRefresh={loadPayments}
          refreshing={refreshing}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons
            name={searchQuery ? 'search-outline' : 'cash-outline'}
            size={64}
            color="#cbd5e1"
          />
          <Text className="mt-4 text-center text-lg font-bold text-text-dark">
            {searchQuery ? 'Nenhum pagamento encontrado' : 'Nenhum pagamento cadastrado'}
          </Text>
          <Text className="mt-2 text-center text-sm text-text-light">
            {searchQuery
              ? `Não encontramos pagamentos com "${searchQuery}"`
              : 'Adicione seus pagamentos para começar a gerenciá-los.'}
          </Text>

          {!searchQuery && (
            <TouchableOpacity
              className="mt-6 flex-row items-center rounded-lg bg-primary px-4 py-2.5 shadow-sm"
              onPress={navigateToAdd}>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text className="ml-2 font-medium text-white">Adicionar Pagamento</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Botão flutuante para adicionar */}
      {filteredPayments.length > 0 && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
          style={{ elevation: 4 }}
          activeOpacity={0.9}
          onPress={navigateToAdd}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Modal de Formulário de Pagamento */}
      <PaymentFormModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentId={selectedPaymentId}
        onSuccess={handlePaymentSuccess}
      />
    </SafeAreaView>
  );
}
