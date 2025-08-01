import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NotificationSettings } from '../../components/notifications/NotificationSettings';
import { NotificationStatusCard } from '../../components/notifications/NotificationStatusCard';
import { useNotificationsContext } from '../../contexts/NotificationContext';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { hasPermissions, requestPermissions, isLoading } = useNotificationsContext();

  const handlePermissionRequest = async () => {
    if (hasPermissions) {
      return;
    }

    Alert.alert(
      'Ativar Notificações',
      'Para receber lembretes sobre seus plantões, precisamos da sua permissão para enviar notificações.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Ativar',
          onPress: async () => {
            const granted = await requestPermissions();
            if (!granted) {
              Alert.alert(
                'Permissão Negada',
                'Você pode ativar as notificações a qualquer momento nas configurações do dispositivo.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      <Stack.Screen
        options={{
          title: 'Notificações',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: '#f9fafb',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <Ionicons name="arrow-back" size={24} color="#1f2937" />
            </TouchableOpacity>
          ),
        }}
      />

      <View className="flex-1">
        {/* Status Card */}
        <NotificationStatusCard showFullStatus={true} onSettingsPress={handlePermissionRequest} />

        {/* Informações sobre notificações */}
        <View className="mx-4 mb-4 rounded-xl bg-blue-50 p-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-medium text-blue-900">
                Como funcionam as notificações
              </Text>
              <Text className="mt-1 text-xs text-blue-700">
                • Lembretes diários sobre plantões do dia{'\n'}• Avisos antes dos plantões começarem
                {'\n'}• Relatórios semanais e mensais{'\n'}• Confirmações de mudanças nos plantões
              </Text>
            </View>
          </View>
        </View>

        {/* Configurações */}
        {hasPermissions ? (
          <NotificationSettings />
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <View className="items-center">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                <Ionicons name="notifications-off" size={40} color="#6b7280" />
              </View>

              <Text className="mb-2 text-center text-lg font-bold text-gray-900">
                Notificações Desabilitadas
              </Text>

              <Text className="mb-6 text-center text-sm text-gray-600">
                Para configurar lembretes e receber notificações sobre seus plantões, você precisa
                primeiro permitir que o app envie notificações.
              </Text>

              <TouchableOpacity
                onPress={handlePermissionRequest}
                disabled={isLoading}
                className="w-full rounded-xl bg-primary py-4">
                <Text className="text-center text-base font-semibold text-white">
                  {isLoading ? 'Verificando...' : 'Ativar Notificações'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.back()}
                className="mt-4 w-full rounded-xl border border-gray-300 bg-white py-4">
                <Text className="text-center text-base font-medium text-gray-700">Voltar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
