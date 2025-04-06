import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSync } from '@app/contexts/SyncContext';

interface SyncStatusProps {
  showDetail?: boolean;
  onPress?: () => void;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ showDetail = false, onPress }) => {
  const { isOnline, isSyncing, lastSyncTime, pendingOperations, syncNow, syncStatus } = useSync();

  const [showLastSync, setShowLastSync] = useState(false);

  useEffect(() => {
    if (syncStatus === 'success') {
      setShowLastSync(true);
      const timer = setTimeout(() => {
        setShowLastSync(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  const renderStatusIcon = () => {
    if (isSyncing) {
      return <ActivityIndicator size="small" color="#0077B6" />;
    }

    if (!isOnline) {
      return <Ionicons name="cloud-offline" size={16} color="#8D99AE" />;
    }

    if (pendingOperations > 0) {
      return <Ionicons name="sync-circle" size={16} color="#E9C46A" />;
    }

    return <Ionicons name="cloud-done" size={16} color="#2A9D8F" />;
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Nunca sincronizado';

    try {
      const currentDate = new Date();
      const syncDate = new Date(lastSyncTime);

      const isToday =
        syncDate.getDate() === currentDate.getDate() &&
        syncDate.getMonth() === currentDate.getMonth() &&
        syncDate.getFullYear() === currentDate.getFullYear();

      if (isToday) {
        return `Hoje, ${format(syncDate, 'HH:mm')}`;
      }

      const diffInDays = Math.floor(
        (currentDate.getTime() - syncDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffInDays < 7) {
        return formatDistanceToNow(syncDate, { addSuffix: true, locale: ptBR });
      }

      return format(syncDate, "dd 'de' MMMM, HH:mm", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getStatusText = () => {
    if (isSyncing) return 'Sincronizando...';
    if (!isOnline) return 'Offline';
    if (pendingOperations > 0)
      return `${pendingOperations} pendente${pendingOperations > 1 ? 's' : ''}`;
    if (showLastSync && lastSyncTime) return 'Sincronizado com sucesso';
    return 'Sincronizado';
  };

  if (!showDetail) {
    return (
      <TouchableOpacity
        className="flex-row items-center px-2 py-1"
        onPress={onPress || (pendingOperations > 0 && isOnline ? syncNow : undefined)}>
        {renderStatusIcon()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      className="flex-row items-center justify-between rounded-lg bg-white p-3 shadow-sm"
      onPress={onPress || (pendingOperations > 0 && isOnline ? syncNow : undefined)}>
      <View className="flex-row items-center">
        <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-background-100">
          {renderStatusIcon()}
        </View>
        <View>
          <Text className="font-medium text-text-dark">{getStatusText()}</Text>
          {lastSyncTime && (
            <Text className="text-xs text-text-light">
              Última sincronização: {formatLastSync()}
            </Text>
          )}
        </View>
      </View>

      {pendingOperations > 0 && isOnline && !isSyncing && (
        <TouchableOpacity className="rounded-full bg-primary px-3 py-1" onPress={syncNow}>
          <Text className="text-xs font-medium text-white">Sincronizar</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default SyncStatus;
