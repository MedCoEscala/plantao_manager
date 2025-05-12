// app/(root)/payments/add.tsx
import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PaymentForm from '@/components/payment/PaymentForm';
import { useToast } from '@/components/ui/Toast';

export default function AddPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const shiftId = params.shiftId as string;
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('Pagamento registrado com sucesso!', 'success');
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <Stack.Screen
        options={{
          title: 'Novo Pagamento',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          animation: 'slide_from_right',
          headerLeft: () => (
            <Ionicons
              name="arrow-back"
              size={24}
              color="#18cb96"
              onPress={() => router.back()}
              style={{ marginLeft: 16 }}
            />
          ),
        }}
      />

      <View className="flex-1">
        <PaymentForm shiftId={shiftId} onSuccess={handleSuccess} />
      </View>
    </SafeAreaView>
  );
}
