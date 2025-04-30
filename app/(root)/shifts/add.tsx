import React from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useToast } from '@/components/ui/Toast';
import ShiftForm from '@/components/shifts/ShiftForm';

export default function AddShiftScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('Plantão adicionado com sucesso!', 'success');
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <Stack.Screen
        options={{
          title: 'Novo Plantão',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
        }}
      />

      <View className="flex-1">
        <ShiftForm onSuccess={handleSuccess} />
      </View>
    </SafeAreaView>
  );
}
