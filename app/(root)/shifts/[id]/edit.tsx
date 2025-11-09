import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { View, StatusBar, ActivityIndicator, Text, TouchableOpacity } from 'react-native';

import ShiftForm from '../../../components/shifts/ShiftForm';
import { useToast } from '../../../components/ui/Toast';
import { useShiftsApi, Shift } from '../../../services/shifts-api';

import ScreenWrapper from '@/components/ui/ScreenWrapper';

export default function EditShiftScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams();
  const shiftId = params.id as string;
  const shiftsApi = useShiftsApi();

  const [isLoading, setIsLoading] = useState(true);
  const [shiftData, setShiftData] = useState<Shift | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAttemptRef = useRef(false);
  const isMounted = useRef(true);

  console.log('[EditShiftScreen] Montando componente com ID:', shiftId);

  useEffect(() => {
    isMounted.current = true;
    console.log('[EditShiftScreen] Componente montado');
    return () => {
      console.log('[EditShiftScreen] Componente desmontando');
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (loadAttemptRef.current || !isMounted.current) {
      console.log('[EditShiftScreen] Ignorando carregamento duplicado');
      return;
    }

    if (!shiftId) {
      console.error('[EditShiftScreen] ID do plantão não fornecido');
      setError('ID do plantão não fornecido');
      setIsLoading(false);
      return;
    }

    console.log('[EditShiftScreen] Iniciando carregamento do plantão:', shiftId);
    loadAttemptRef.current = true;
    setIsLoading(true);

    const loadShiftInfo = async () => {
      try {
        console.log('[EditShiftScreen] Buscando dados do plantão:', shiftId);
        const data = await shiftsApi.getShiftById(shiftId);

        if (!isMounted.current) {
          console.log('[EditShiftScreen] Componente desmontado durante carregamento');
          return;
        }

        if (data) {
          console.log(
            '[EditShiftScreen] Dados do plantão recebidos:',
            JSON.stringify({
              id: data.id,
              date: data.date,
              location: data.location?.name,
              startTime: data.startTime,
              endTime: data.endTime,
            })
          );

          setShiftData(data);
        } else {
          console.error('[EditShiftScreen] Dados do plantão vazios ou inválidos');
          setError('Não foi possível carregar os dados do plantão');
        }
      } catch (error: any) {
        console.error('[EditShiftScreen] Erro ao carregar informações do plantão:', error);

        if (!isMounted.current) return;

        setError(error.message || 'Erro ao carregar informações do plantão');
        showToast('Erro ao carregar informações do plantão', 'error');
      } finally {
        if (isMounted.current) {
          console.log('[EditShiftScreen] Finalizando carregamento, definindo isLoading=false');
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
    console.log('[EditShiftScreen] Tentando novamente');
    setError(null);
    loadAttemptRef.current = false;
    setIsLoading(true);
  };

  if (error) {
    return (
      <ScreenWrapper>
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
      </ScreenWrapper>
    );
  }

  const shiftName = shiftData?.location?.name
    ? `Plantão em ${shiftData.location.name}`
    : 'Editar Plantão';

  console.log(
    '[EditShiftScreen] Renderizando formulário com isLoading=',
    isLoading,
    'shiftId=',
    shiftId,
    'shiftData=',
    shiftData ? 'disponível' : 'não disponível'
  );

  return (
    <ScreenWrapper>
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
          {shiftData ? (
            <ShiftForm
              key={`shift-form-${shiftId}`}
              shiftId={shiftId}
              initialData={shiftData}
              onSuccess={handleSuccess}
            />
          ) : (
            <View className="flex-1 items-center justify-center p-4">
              <Text className="mb-2 text-center text-lg font-bold text-red-500">
                Erro inesperado
              </Text>
              <Text className="mb-6 text-center text-gray-500">
                Não foi possível carregar os dados do plantão.
              </Text>
              <TouchableOpacity className="rounded-lg bg-primary px-6 py-3" onPress={handleRetry}>
                <Text className="font-medium text-white">Tentar Novamente</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScreenWrapper>
  );
}
