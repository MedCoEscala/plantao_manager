import React, { useState, useEffect } from 'react';
import { View, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useToast } from '@/components/ui/Toast';
import ShiftForm from '@/components/shifts/ShiftForm';

export default function EditShiftScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams();
  const shiftId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [shiftName, setShiftName] = useState('');

  useEffect(() => {
    const loadShiftInfo = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));

        setShiftName('Plantão Hospital Central');
      } catch (error) {
        console.error('Erro ao carregar informações do plantão:', error);
        showToast('Erro ao carregar informações do plantão', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadShiftInfo();
  }, [shiftId]);

  const handleSuccess = () => {
    showToast('Plantão atualizado com sucesso!', 'success');
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <Stack.Screen
        options={{
          title: isLoading ? 'Carregando...' : `Editar ${shiftName}`,
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
        }}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0077B6" />
        </View>
      ) : (
        <View className="flex-1">
          <ShiftForm shiftId={shiftId} onSuccess={handleSuccess} />
        </View>
      )}
    </SafeAreaView>
  );
}
