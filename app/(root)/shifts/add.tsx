import { useRouter, Stack } from 'expo-router';
import React from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNotification } from '@/components';
import ShiftForm from '@/components/shifts/ShiftForm';

export default function AddShiftScreen() {
  const router = useRouter();
  const { showSuccess } = useNotification();

  const handleSuccess = () => {
    showSuccess('Plantão adicionado com sucesso!');
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
