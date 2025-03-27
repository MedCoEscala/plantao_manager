import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

// Definindo o tipo para um pagamento
interface Payment {
  id: string;
  hospital: string;
  date: string;
  amount: string;
  status: string;
}

// Dados fictícios para pagamentos
const SAMPLE_PAYMENTS: Payment[] = [
  {
    id: "1",
    hospital: "Hospital São Lucas",
    date: "10/11/2023",
    amount: "R$ 1.250,00",
    status: "Pago",
  },
  {
    id: "2",
    hospital: "Hospital Moinhos de Vento",
    date: "15/10/2023",
    amount: "R$ 1.500,00",
    status: "Pago",
  },
  {
    id: "3",
    hospital: "Hospital de Clínicas",
    date: "05/10/2023",
    amount: "R$ 1.200,00",
    status: "Pendente",
  },
];

export default function PaymentsScreen() {
  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <TouchableOpacity style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <Text style={styles.paymentHospital}>{item.hospital}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.status === "Pago" ? "#D1FAE5" : "#FEF3C7",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: item.status === "Pago" ? "#059669" : "#D97706",
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.paymentDetails}>
        <View style={styles.paymentDetail}>
          <Text style={styles.paymentLabel}>Data</Text>
          <Text style={styles.paymentValue}>{item.date}</Text>
        </View>
        <View style={styles.paymentDetail}>
          <Text style={styles.paymentLabel}>Valor</Text>
          <Text style={styles.paymentValue}>{item.amount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pagamentos</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={24} color="#2B2D42" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Este mês</Text>
          <Text style={styles.summaryAmount}>R$ 3.950,00</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total</Text>
          <Text style={styles.summaryAmount}>R$ 9.750,00</Text>
        </View>
      </View>

      {SAMPLE_PAYMENTS.length > 0 ? (
        <FlatList
          data={SAMPLE_PAYMENTS}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="cash-outline" size={64} color="#8D99AE" />
          <Text style={styles.emptyText}>Nenhum pagamento encontrado</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2B2D42",
  },
  filterButton: {
    padding: 8,
  },
  summaryContainer: {
    flexDirection: "row",
    padding: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 14,
    color: "#8D99AE",
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2B2D42",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  paymentHospital: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2B2D42",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  paymentDetails: {
    flexDirection: "row",
  },
  paymentDetail: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 14,
    color: "#8D99AE",
    marginBottom: 4,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2B2D42",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8D99AE",
    textAlign: "center",
  },
});
