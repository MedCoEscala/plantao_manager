import { Ionicons } from '@expo/vector-icons';
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '../../../components/ui/Toast';
import { useDialog } from '../../../contexts/DialogContext';
import { useShiftsSync } from '../../../contexts/ShiftsSyncContext';
import { useShiftsApi, Shift } from '../../../services/shifts-api';
import { formatDate, formatTime, formatCurrency } from '../../../utils/formatters';

// Função auxiliar para obter cor baseada no status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Agendado':
      return '#3B82F6'; // azul
    case 'Confirmado':
      return '#10B981'; // verde
    case 'Cancelado':
      return '#EF4444'; // vermelho
    case 'Concluído':
      return '#8B5CF6'; // roxo
    case 'Pendente':
      return '#F59E0B'; // laranja
    default:
      return '#64748B'; // cinza
  }
};

interface ShiftDetails {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  value: number;
  locationName: string;
  locationColor: string;
  contractorName?: string;
  notes?: string;
  status: string;
  paymentType: 'PF' | 'PJ';
}

export default function ShiftDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const shiftId = params.id as string;
  const { showToast } = useToast();
  const { showDialog } = useDialog();
  const { subscribeToRefresh, triggerShiftsRefresh } = useShiftsSync();
  const shiftsApi = useShiftsApi();

  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [shift, setShift] = useState<ShiftDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Referência para controlar se já iniciamos o carregamento
  const hasLoadedRef = useRef(false);
  // Referência para controlar se componente está montado
  const isMounted = useRef(true);
  // Referência para retry timers
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Limpar recursos quando o componente for desmontado
  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  // Função centralizada para carregar os detalhes do plantão
  const loadShiftDetails = useCallback(async () => {
    // Não carregue se o componente não estiver montado
    if (!isMounted.current) return;

    // Não carregue se não tiver ID
    if (!shiftId) {
      setError('ID do plantão não fornecido');
      setIsLoading(false);
      return;
    }

    // Defina o estado de carregamento
    setIsLoading(true);

    try {
      console.log(`Carregando detalhes do plantão: ${shiftId}`);
      const shiftData = await shiftsApi.getShiftById(shiftId);

      // Verifique se o componente ainda está montado antes de atualizar o estado
      if (!isMounted.current) return;

      if (!shiftData || !shiftData.id) {
        throw new Error('Dados do plantão incompletos ou inválidos');
      }

      // Transforme os dados para o formato esperado pelo componente
      setShift({
        id: shiftData.id,
        date: shiftData.date,
        startTime: shiftData.startTime || '',
        endTime: shiftData.endTime || '',
        value: typeof shiftData.value === 'number' ? shiftData.value : 0,
        locationName: shiftData.location?.name || 'Local não definido',
        locationColor: shiftData.location?.color || '#64748b',
        contractorName: shiftData.contractor?.name,
        notes: shiftData.notes || '',
        status: shiftData.status || 'Agendado',
        paymentType: shiftData.paymentType as 'PF' | 'PJ',
      });

      // Limpe estados de erro e retry
      setError(null);
      setRetryCount(0);
    } catch (error: any) {
      console.error('Erro ao carregar detalhes do plantão:', error);

      if (!isMounted.current) return;

      // Defina mensagem de erro apropriada
      setError(`Erro ao carregar plantão: ${error.message || 'Erro desconhecido'}`);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [shiftId, shiftsApi]);

  // Carregue os dados apenas uma vez quando o componente montar
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadShiftDetails();
    }
  }, [loadShiftDetails]);

  // Inscrever na sincronização de plantões para recarregar dados quando houver mudanças
  useEffect(() => {
    const unsubscribe = subscribeToRefresh(() => {
      console.log('🔄 Tela de detalhes recebeu notificação de atualização');
      // Recarregar dados do plantão atual
      loadShiftDetails();
    });

    return unsubscribe;
  }, [subscribeToRefresh, loadShiftDetails]);

  const handleEdit = () => {
    if (!shiftId) return;

    try {
      router.push(`/shifts/${shiftId}/edit`);
    } catch (error) {
      console.error('Erro ao navegar para edição:', error);
      showToast('Erro ao abrir tela de edição', 'error');
    }
  };

  const handleDelete = () => {
    if (!shiftId) return;

    showDialog({
      title: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir este plantão? Esta ação não pode ser desfeita.',
      type: 'confirm',
      confirmText: 'Excluir',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await shiftsApi.deleteShift(shiftId);
          showToast('Plantão excluído com sucesso!', 'success');

          // Disparar sincronização para outras telas
          triggerShiftsRefresh();

          router.back();
        } catch (error: any) {
          console.error('Erro ao excluir plantão:', error);
          showToast(`Erro ao excluir plantão: ${error.message || 'Erro desconhecido'}`, 'error');
          setIsLoading(false);
        }
      },
    });
  };

  const formatShiftDate = (dateString: string) => {
    return formatDate(dateString, "dd 'de' MMMM 'de' yyyy");
  };

  const getShiftDuration = () => {
    if (!shift?.startTime || !shift?.endTime) return '';

    try {
      // Limpar os horários para garantir que estejam no formato correto
      const startTimeStr = formatTime(shift.startTime);
      const endTimeStr = formatTime(shift.endTime);

      if (!startTimeStr || !endTimeStr) return '';

      // Parse das strings de hora já formatadas
      const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
      const [endHours, endMinutes] = endTimeStr.split(':').map(Number);

      // Verificar se temos números válidos
      if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
        console.error('Valores inválidos para cálculo de duração:', { startTimeStr, endTimeStr });
        return '';
      }

      const startTotalMinutes = startHours * 60 + startMinutes;
      let endTotalMinutes = endHours * 60 + endMinutes;

      // Ajustar para plantões noturnos (quando término é no dia seguinte)
      if (endTotalMinutes < startTotalMinutes) {
        endTotalMinutes += 24 * 60; // Adicionar 24 horas em minutos
      }

      const durationMinutes = endTotalMinutes - startTotalMinutes;
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    } catch (e) {
      console.error('Erro ao calcular duração:', e);
      return '';
    }
  };

  const handleRetry = () => {
    setError(null);
    hasLoadedRef.current = false;
    loadShiftDetails();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#18cb96" />
          <Text className="mt-4 text-gray-500">Carregando detalhes do plantão...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !shift) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="mt-4 text-center text-lg font-bold text-text-dark">
            {error || 'Plantão não encontrado'}
          </Text>
          <Text className="mt-2 text-center text-gray-500">
            Não foi possível encontrar o plantão solicitado.
          </Text>
          <View className="mt-6 flex-row space-x-4">
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
      <StatusBar style="dark" />

      <Stack.Screen
        options={{
          title: 'Detalhes do Plantão',
          headerRight: () => (
            <View className="flex-row">
              <TouchableOpacity onPress={handleEdit} className="mr-4">
                <Ionicons name="create-outline" size={24} color="#18cb96" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView className="flex-1" contentContainerClassName="pb-6">
        {/* Header com data e status */}
        <View className="items-center px-4 py-6">
          <View
            style={{ backgroundColor: shift.locationColor }}
            className="mb-3 h-16 w-16 items-center justify-center rounded-full">
            <Ionicons name="calendar" size={32} color="#FFFFFF" />
          </View>
          <Text className="text-xl font-bold text-text-dark">{formatShiftDate(shift.date)}</Text>

          {/* Status e horário */}
          <View className="mt-2 flex-row items-center">
            <View
              className="mr-2 rounded-full px-3 py-1"
              style={{ backgroundColor: getStatusColor(shift.status) + '20' }} // 20% opacity
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: getStatusColor(shift.status) }}>
                {shift.status}
              </Text>
            </View>
            <Text className="text-text-light">
              {shift.startTime && shift.endTime
                ? `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`
                : 'Horário não definido'}
            </Text>
          </View>
        </View>

        {/* Seção de local */}
        <View className="bg-background-50 mx-4 mb-4 rounded-xl p-4">
          <Text className="mb-3 text-base font-bold text-text-dark">Local</Text>

          <View className="flex-row items-center">
            <View
              className="mr-3 h-6 w-6 rounded-full"
              style={{ backgroundColor: shift.locationColor }}
            />
            <View>
              <Text className="text-base font-medium text-text-dark">{shift.locationName}</Text>
              <Text className="text-xs text-text-light">Local do plantão</Text>
            </View>
          </View>
        </View>

        {/* Seção de pagamento */}
        <View className="bg-background-50 mx-4 mb-4 rounded-xl p-4">
          <Text className="mb-3 text-base font-bold text-text-dark">Pagamento</Text>

          <View className="mb-4 flex-row justify-between">
            <View>
              <Text className="text-xs text-text-light">Valor</Text>
              <Text className="text-lg font-bold text-primary">{formatCurrency(shift.value)}</Text>
            </View>

            <View className="items-end">
              <Text className="text-xs text-text-light">Tipo</Text>
              <Text className="text-base font-medium text-text-dark">{shift.paymentType}</Text>
            </View>
          </View>

          <View className="flex-row justify-between">
            <View>
              <Text className="text-xs text-text-light">Duração</Text>
              <Text className="text-base font-medium text-text-dark">{getShiftDuration()}</Text>
            </View>
          </View>
        </View>

        {/* Seção de contratante, se houver */}
        {shift.contractorName && (
          <View className="bg-background-50 mx-4 mb-4 rounded-xl p-4">
            <Text className="mb-2 text-base font-bold text-text-dark">Contratante</Text>
            <View className="flex-row items-center">
              <Ionicons name="briefcase-outline" size={20} color="#64748b" className="mr-2" />
              <Text className="text-base text-text-dark">{shift.contractorName}</Text>
            </View>
          </View>
        )}

        {/* Seção de observações, se houver */}
        {shift.notes && (
          <View className="bg-background-50 mx-4 mb-4 rounded-xl p-4">
            <Text className="mb-2 text-base font-bold text-text-dark">Observações</Text>
            <Text className="text-base text-text-dark">{shift.notes}</Text>
          </View>
        )}

        {/* Botões de ação */}
        <View className="mx-4 mt-4 flex-row space-x-3">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center rounded-lg bg-primary py-3"
            onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
            <Text className="ml-2 font-medium text-white">Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center rounded-lg bg-error py-3"
            onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text className="ml-2 font-medium text-white">Excluir</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
