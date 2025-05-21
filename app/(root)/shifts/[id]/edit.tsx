import React, { useState, useEffect, useRef } from 'react';
import { View, StatusBar, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useToast } from '@/components/ui/Toast';
import ShiftForm from '@/components/shifts/ShiftForm';
import { useShiftsApi } from '@/services/shifts-api';

export default function EditShiftScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams();
  const shiftId = params.id as string;
  const shiftsApi = useShiftsApi();

  const [isLoading, setIsLoading] = useState(true);
  const [shiftName, setShiftName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Referências para controle
  const loadAttemptRef = useRef(false);
  const isMounted = useRef(true);

  // Gerenciar ciclo de vida do componente
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Prevenir carregamentos duplicados
    if (loadAttemptRef.current || !isMounted.current) return;

    // Marcar que tentou carregar
    loadAttemptRef.current = true;

    const loadShiftInfo = async () => {
      if (!shiftId) {
        if (isMounted.current) {
          setError('ID do plantão não fornecido');
          setIsLoading(false);
        }
        return;
      }

      try {
        const shiftData = await shiftsApi.getShiftById(shiftId);

        // Verificar se o componente ainda está montado
        if (!isMounted.current) return;

        if (shiftData) {
          // Formatação simplificada de título
          setShiftName(
            shiftData.location?.name ? `Plantão em ${shiftData.location.name}` : 'Editar Plantão'
          );
        } else {
          setError('Não foi possível carregar os dados do plantão');
        }
      } catch (error: any) {
        console.error('Erro ao carregar informações do plantão:', error);

        // Verificar se o componente ainda está montado
        if (!isMounted.current) return;

        setError(error.message || 'Erro ao carregar informações do plantão');
        showToast('Erro ao carregar informações do plantão', 'error');
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    loadShiftInfo();
  }, [shiftId, showToast, shiftsApi]);

  const handleSuccess = () => {
    showToast('Plantão atualizado com sucesso!', 'success');
    router.back();
  };

  const handleRetry = () => {
    setError(null);
    loadAttemptRef.current = false;
    setIsLoading(true);
  };

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        <Stack.Screen
          options={{
            title: 'Erro',
            headerTitleAlign: 'center',
          }}
        />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="mb-4 text-center text-lg font-bold text-red-500">{error}</Text>
          <Text className="mb-6 text-center text-gray-500">
            Não foi possível carregar as informações do plantão.
          </Text>
          <View className="flex-row space-x-4">
            <TouchableOpacity className="rounded-lg bg-primary px-6 py-3" onPress={handleRetry}>
              <Text className="font-medium text-white">Tentar Novamente</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-lg bg-gray-200 px-6 py-3"
              onPress={() => router.back()}>
              <Text className="font-medium text-gray-800">Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
          <ActivityIndicator size="large" color="#18cb96" />
          <Text className="mt-4 text-gray-500">Carregando informações do plantão...</Text>
        </View>
      ) : (
        <View className="flex-1">
          <ShiftForm shiftId={shiftId} onSuccess={handleSuccess} />
        </View>
      )}
    </SafeAreaView>
  );
}
