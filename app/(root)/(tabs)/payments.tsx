import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo'; // Se precisar de dados do usuário/auth

// Defina uma interface para o objeto de pagamento
interface Payment {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
}

// Dados mockados para pagamentos
const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay1',
    description: 'Plantão Hospital Central - Jan/24',
    amount: 1250.75,
    date: '2024-02-15',
    status: 'completed',
  },
  {
    id: 'pay2',
    description: 'Plantão Clínica Sul - Jan/24',
    amount: 800.0,
    date: '2024-02-20',
    status: 'pending',
  },
  {
    id: 'pay3',
    description: 'Plantão Hospital Norte - Fev/24',
    amount: 1100.5,
    date: '2024-03-05',
    status: 'pending',
  },
  {
    id: 'pay4',
    description: 'Adiantamento Fev/24',
    amount: 500.0,
    date: '2024-02-10',
    status: 'completed',
  },
  {
    id: 'pay5',
    description: 'Plantão Extra Fim de Semana',
    amount: 650.0,
    date: '2024-03-12',
    status: 'failed',
  },
];

const PaymentsScreen = () => {
  const router = useRouter();
  const { isLoaded, userId } = useAuth(); // Exemplo, caso precise do userId
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Função para carregar os pagamentos (atualmente mockado)
  const loadPayments = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    // Simula uma chamada de API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setPayments(MOCK_PAYMENTS);
    setRefreshing(false);
    setLoading(false);
  }, []);

  // Carrega pagamentos na montagem inicial
  React.useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Função para navegar para a tela de adicionar pagamento (ainda não criada)
  const goToAddPayment = () => {
    // router.push('/(root)/add-payment'); // Rota exemplo
    Alert.alert('Navegação', 'Tela de adicionar pagamento ainda não implementada.');
  };

  // Função para navegar para a tela de detalhes/editar pagamento (ainda não criada)
  const goToPaymentDetails = (paymentId: string) => {
    // router.push(`/(root)/payment/${paymentId}`); // Rota exemplo
    Alert.alert('Navegação', `Tela de detalhes do pagamento ${paymentId} ainda não implementada.`);
  };

  // Renderiza cada item da lista de pagamentos
  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <TouchableOpacity onPress={() => goToPaymentDetails(item.id)} style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <Text style={styles.itemDate}>Data: {item.date}</Text>
        <Text style={styles.itemAmount}>Valor: R$ {item.amount.toFixed(2)}</Text>
      </View>
      <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  // Helper para estilo do status
  const getStatusStyle = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return styles.statusCompleted;
      case 'pending':
        return styles.statusPending;
      case 'failed':
        return styles.statusFailed;
      default:
        return {};
    }
  };

  // Helper para texto do status
  const getStatusText = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'Completo';
      case 'pending':
        return 'Pendente';
      case 'failed':
        return 'Falhou';
      default:
        return 'Desconhecido';
    }
  };

  if (!isLoaded && loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Pagamentos</Text>
        {/* Pode adicionar um botão de filtro ou outras ações aqui */}
      </View>

      {payments.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cash-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum pagamento encontrado.</Text>
          <Text style={styles.emptySubText}>Adicione ou aguarde novos registros.</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={loadPayments}
        />
      )}

      {/* Botão Flutuante para Adicionar Pagamento */}
      <TouchableOpacity style={styles.fab} onPress={goToAddPayment}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Um cinza bem claro
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff', // Fundo branco para o cabeçalho
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333', // Cor escura para o título
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d', // Cinza médio
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#adb5bd', // Cinza claro
    marginTop: 5,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 80, // Espaço para o FAB não cobrir o último item
    paddingHorizontal: 10, // Adiciona um pouco de espaço nas laterais da lista
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5, // Espaçamento vertical entre itens
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee', // Borda sutil
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2, // Sombra para Android
  },
  itemTextContainer: {
    flex: 1, // Ocupa o espaço disponível
    marginRight: 10,
  },
  itemDescription: {
    fontSize: 16,
    fontWeight: '500', // Semi-bold
    color: '#343a40', // Cinza escuro
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 13,
    color: '#6c757d', // Cinza médio
    marginBottom: 2,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745', // Verde para valor
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 10,
    minWidth: 80, // Largura mínima para alinhar
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusCompleted: {
    backgroundColor: '#28a745', // Verde
  },
  statusPending: {
    backgroundColor: '#ffc107', // Amarelo/Laranja
  },
  statusFailed: {
    backgroundColor: '#dc3545', // Vermelho
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF', // Azul padrão iOS
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default PaymentsScreen;
