import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/components/ui/Toast';
import { useDialog } from '@/contexts/DialogContext';

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
  isFixed: boolean;
}

export default function ShiftDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const shiftId = params.id as string;
  const { showToast } = useToast();
  const { showDialog } = useDialog();

  const [isLoading, setIsLoading] = useState(true);
  const [shift, setShift] = useState<ShiftDetails | null>(null);

  useEffect(() => {
    const loadShiftDetails = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setShift({
          id: shiftId,
          date: '2025-05-10T00:00:00Z',
          startTime: '08:00',
          endTime: '14:00',
          value: 1200,
          locationName: 'Hospital Central',
          locationColor: '#0077B6',
          contractorName: 'Hospital Estadual',
          notes: 'Plantão de emergência na ala de trauma.',
          status: 'Agendado',
          paymentType: 'PF',
          isFixed: false,
        });
      } catch (error) {
        console.error('Erro ao carregar detalhes do plantão:', error);
        showToast('Erro ao carregar detalhes do plantão', 'error');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadShiftDetails();
  }, [shiftId]);

  const handleEdit = () => {
    router.push(`/shifts/${shiftId}/edit`);
  };

  const handleDelete = () => {
    showDialog({
      title: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir este plantão? Esta ação não pode ser desfeita.',
      type: 'confirm',
      confirmText: 'Excluir',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          showToast('Plantão excluído com sucesso!', 'success');
          router.back();
        } catch (error) {
          console.error('Erro ao excluir plantão:', error);
          showToast('Erro ao excluir plantão', 'error');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const formatShiftDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0077B6" />
          <Text className="mt-4 text-gray-500">Carregando detalhes do plantão...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!shift) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="mt-4 text-center text-lg font-bold text-text-dark">
            Plantão não encontrado
          </Text>
          <Text className="mt-2 text-center text-gray-500">
            Não foi possível encontrar o plantão solicitado.
          </Text>
          <TouchableOpacity
            className="mt-6 rounded-lg bg-primary px-6 py-3"
            onPress={() => router.back()}>
            <Text className="font-medium text-white">Voltar</Text>
          </TouchableOpacity>
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
                <Ionicons name="create-outline" size={24} color="#0077B6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView className="flex-1 px-4 py-4">
        <View className="mb-6 items-center">
          <View
            style={{ backgroundColor: shift.locationColor }}
            className="mb-3 h-16 w-16 items-center justify-center rounded-full">
            <Ionicons name="calendar" size={32} color="#FFFFFF" />
          </View>
          <Text className="text-xl font-bold text-text-dark">{formatShiftDate(shift.date)}</Text>
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
              {shift.startTime} - {shift.endTime}
            </Text>
          </View>
        </View>

        <View className="mb-4 rounded-xl bg-gray-50 p-5">
          <View className="mb-4 flex-row justify-between">
            <View>
              <Text className="text-xs text-text-light">Local</Text>
              <Text className="text-base font-medium text-text-dark">{shift.locationName}</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-text-light">Valor</Text>
              <Text className="text-base font-bold text-primary">
                R$ {shift.value.toFixed(2).replace('.', ',')}
              </Text>
            </View>
          </View>

          <View className="mb-4 flex-row justify-between">
            <View>
              <Text className="text-xs text-text-light">Tipo de Pagamento</Text>
              <Text className="text-base font-medium text-text-dark">{shift.paymentType}</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-text-light">Plantão Fixo</Text>
              <Text className="text-base font-medium text-text-dark">
                {shift.isFixed ? 'Sim' : 'Não'}
              </Text>
            </View>
          </View>

          {shift.contractorName && (
            <View className="mb-4">
              <Text className="text-xs text-text-light">Contratante</Text>
              <Text className="text-base font-medium text-text-dark">{shift.contractorName}</Text>
            </View>
          )}

          {shift.notes && (
            <View>
              <Text className="text-xs text-text-light">Observações</Text>
              <Text className="text-base text-text-dark">{shift.notes}</Text>
            </View>
          )}
        </View>

        <View className="mt-2 flex-row space-x-3">
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

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'agendado':
      return '#18cb96';
    case 'confirmado':
      return '#10b981';
    case 'cancelado':
      return '#ef4444';
    case 'concluído':
      return '#64748b';
    default:
      return '#64748b';
  }
}
