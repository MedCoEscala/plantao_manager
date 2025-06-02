import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LocationForm from '@/components/locations/LocationForm';
import { useNotification } from '@/components';

export default function AddLocationScreen() {
  const router = useRouter();
  const { showSuccess } = useNotification();

  const handleSuccess = () => {
    showSuccess('Local adicionado com sucesso!');
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <Stack.Screen
        options={{
          title: 'Novo Local',
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
        <LocationForm onSuccess={handleSuccess} />
      </View>
    </SafeAreaView>
  );
}
