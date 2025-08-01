import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { useNotificationStatus } from '../../contexts/NotificationContext';
import Card from '../ui/Card';

interface NotificationStatusCardProps {
  showFullStatus?: boolean;
  onSettingsPress?: () => void;
}

export const NotificationStatusCard: React.FC<NotificationStatusCardProps> = ({
  showFullStatus = false,
  onSettingsPress,
}) => {
  const router = useRouter();
  const { hasPermissions, isRegistered, isLoading, hasToken, isEnabled } = useNotificationStatus();

  const handleSettingsPress = () => {
    if (onSettingsPress) {
      onSettingsPress();
    } else {
      router.push('/settings/notifications');
    }
  };

  if (isLoading) {
    return (
      <Card className="mx-4 mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-medium text-gray-900">Notificações</Text>
            <Text className="text-sm text-gray-500">Verificando status...</Text>
          </View>
          <View className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </View>
      </Card>
    );
  }

  // Determinar o status geral
  let status: 'active' | 'warning' | 'error';
  let statusText: string;
  let statusIcon: string;
  let statusColor: string;
  let actionText: string;

  if (!hasPermissions) {
    status = 'error';
    statusText = 'Sem permissão';
    statusIcon = 'notifications-off';
    statusColor = '#ef4444';
    actionText = 'Ativar';
  } else if (!hasToken || !isRegistered) {
    status = 'warning';
    statusText = 'Configuração pendente';
    statusIcon = 'warning';
    statusColor = '#f59e0b';
    actionText = 'Configurar';
  } else {
    status = 'active';
    statusText = 'Ativas';
    statusIcon = 'notifications';
    statusColor = '#10b981';
    actionText = 'Configurar';
  }

  return (
    <Card className="mx-4 mb-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Ionicons name={statusIcon as any} size={20} color={statusColor} />
            <Text className="ml-2 text-base font-medium text-gray-900">Notificações</Text>
          </View>

          <View className="mt-1 flex-row items-center">
            <View className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
            <Text className="text-sm text-gray-600">{statusText}</Text>
          </View>

          {showFullStatus && (
            <View className="mt-3 space-y-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-gray-500">Permissões:</Text>
                <View className="flex-row items-center">
                  <Ionicons
                    name={hasPermissions ? 'checkmark-circle' : 'close-circle'}
                    size={12}
                    color={hasPermissions ? '#10b981' : '#ef4444'}
                  />
                  <Text
                    className="ml-1 text-xs"
                    style={{ color: hasPermissions ? '#10b981' : '#ef4444' }}>
                    {hasPermissions ? 'Concedidas' : 'Negadas'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-gray-500">Token:</Text>
                <View className="flex-row items-center">
                  <Ionicons
                    name={hasToken ? 'checkmark-circle' : 'close-circle'}
                    size={12}
                    color={hasToken ? '#10b981' : '#ef4444'}
                  />
                  <Text
                    className="ml-1 text-xs"
                    style={{ color: hasToken ? '#10b981' : '#ef4444' }}>
                    {hasToken ? 'Obtido' : 'Pendente'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-gray-500">Registro:</Text>
                <View className="flex-row items-center">
                  <Ionicons
                    name={isRegistered ? 'checkmark-circle' : 'close-circle'}
                    size={12}
                    color={isRegistered ? '#10b981' : '#ef4444'}
                  />
                  <Text
                    className="ml-1 text-xs"
                    style={{ color: isRegistered ? '#10b981' : '#ef4444' }}>
                    {isRegistered ? 'Ativo' : 'Pendente'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={handleSettingsPress}
          className={`rounded-lg px-4 py-2 ${
            status === 'active'
              ? 'bg-primary/10'
              : status === 'warning'
                ? 'bg-orange-50'
                : 'bg-red-50'
          }`}>
          <Text
            className={`text-sm font-medium ${
              status === 'active'
                ? 'text-primary'
                : status === 'warning'
                  ? 'text-orange-600'
                  : 'text-red-600'
            }`}>
            {actionText}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Aviso se notificações não estão funcionando */}
      {!isEnabled && (
        <View
          className={`mt-4 rounded-lg p-3 ${status === 'error' ? 'bg-red-50' : 'bg-orange-50'}`}>
          <View className="flex-row items-start">
            <Ionicons
              name="information-circle"
              size={16}
              color={status === 'error' ? '#ef4444' : '#f59e0b'}
              className="mt-0.5"
            />
            <View className="ml-2 flex-1">
              <Text
                className={`text-sm font-medium ${
                  status === 'error' ? 'text-red-800' : 'text-orange-800'
                }`}>
                {status === 'error' ? 'Notificações desabilitadas' : 'Configuração incompleta'}
              </Text>
              <Text
                className={`text-xs ${status === 'error' ? 'text-red-600' : 'text-orange-600'}`}>
                {status === 'error'
                  ? 'Você não receberá lembretes sobre plantões. Toque em "Ativar" para configurar.'
                  : 'Complete a configuração para receber todas as notificações.'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Card>
  );
};
