import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FlashList } from "@shopify/flash-list";
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
    <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-bold text-gray-800 flex-1">
          {item.hospital}
        </Text>
        <View
          className={`px-2 py-1 rounded ${
            item.status === "Pago" ? "bg-green-100" : "bg-amber-100"
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              item.status === "Pago" ? "text-green-600" : "text-amber-600"
            }`}
          >
            {item.status}
          </Text>
        </View>
      </View>
      <View className="flex-row">
        <View className="flex-1">
          <Text className="text-sm text-gray-500 mb-1">Data</Text>
          <Text className="text-sm font-medium text-gray-800">{item.date}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm text-gray-500 mb-1">Valor</Text>
          <Text className="text-sm font-medium text-gray-800">
            {item.amount}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Pagamentos</Text>
        <TouchableOpacity className="p-2">
          <Ionicons name="filter-outline" size={24} color="#2B2D42" />
        </TouchableOpacity>
      </View>

      <View className="flex-row px-4 py-4">
        <View className="flex-1 bg-white rounded-xl p-4 mx-1 shadow-sm">
          <Text className="text-sm text-gray-500 mb-1">Este mês</Text>
          <Text className="text-lg font-bold text-gray-800">R$ 3.950,00</Text>
        </View>
        <View className="flex-1 bg-white rounded-xl p-4 mx-1 shadow-sm">
          <Text className="text-sm text-gray-500 mb-1">Total</Text>
          <Text className="text-lg font-bold text-gray-800">R$ 9.750,00</Text>
        </View>
      </View>

      {SAMPLE_PAYMENTS.length > 0 ? (
        <View className="flex-1 px-4">
          <FlashList
            data={SAMPLE_PAYMENTS}
            renderItem={renderPaymentItem}
            keyExtractor={(item: Payment) => item.id}
            estimatedItemSize={100}
          />
        </View>
      ) : (
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="cash-outline" size={64} color="#8D99AE" />
          <Text className="mt-4 text-base text-gray-500 text-center">
            Nenhum pagamento encontrado
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
