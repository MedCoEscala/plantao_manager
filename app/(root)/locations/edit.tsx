import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LocationForm from '@/components/locations/LocationForm';
import { useToast } from '@/components/ui/Toast';

export default function EditLocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const locationId = params.id as string;
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('Local atualizado com sucesso!', 'success');
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <Stack.Screen
        options={{
          title: 'Editar Local',
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
        <LocationForm locationId={locationId} onSuccess={handleSuccess} />
      </View>
    </SafeAreaView>
  );
}
