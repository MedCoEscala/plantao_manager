import React, { useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/components/ui/Toast';
import PaymentForm from '@/components/payment/PaymentForm';

export default function EditPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const paymentId = params.id as string;
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('Pagamento atualizado com sucesso!', 'success');
    router.back();
  };

  const navigateToAdd = useCallback(() => {
    router.push('/payments/add');
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <Stack.Screen
        options={{
          title: 'Editar Pagamento',
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
        <PaymentForm paymentId={paymentId} onSuccess={handleSuccess} />
      </View>
    </SafeAreaView>
  );
}
