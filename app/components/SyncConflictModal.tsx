import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';

import { ConflictData } from '../services/sync/syncManager';

interface SyncConflictModalProps {
  visible: boolean;
  conflict: ConflictData | null;
  onResolve: (
    conflictId: string,
    resolution: 'local' | 'remote' | 'merged',
    mergedData?: any
  ) => Promise<void>;
  onClose: () => void;
}

const SyncConflictModal: React.FC<SyncConflictModalProps> = ({
  visible,
  conflict,
  onResolve,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!conflict) return null;

  const getEntityName = () => {
    switch (conflict.entity) {
      case 'user':
        return 'usuário';
      case 'location':
        return 'local';
      case 'shift':
        return 'plantão';
      case 'payment':
        return 'pagamento';
      default:
        return 'item';
    }
  };

  const getItemName = () => {
    if (conflict.entity === 'user' && conflict.localData?.name) {
      return conflict.localData.name;
    }
    if (conflict.entity === 'location' && conflict.localData?.name) {
      return conflict.localData.name;
    }
    if (conflict.entity === 'shift' && conflict.localData?.date) {
      return `Plantão de ${conflict.localData.date}`;
    }
    if (conflict.entity === 'payment' && conflict.localData?.paymentDate) {
      return `Pagamento de ${conflict.localData.paymentDate}`;
    }
    return `${getEntityName()} #${conflict.entityId.substring(0, 8)}`;
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return '(vazio)';
    }
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'string') {
      try {
        if (value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/^\d{4}-\d{2}-\d{2}T/)) {
          const date = new Date(value);
          return format(date, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
        }
      } catch (e) {}
      return value;
    }
    return JSON.stringify(value);
  };

  const getChangedFields = () => {
    const changedFields: string[] = [];
    const localData = conflict.localData || {};
    const remoteData = conflict.remoteData || {};

    Object.keys(localData).forEach((key) => {
      if (['id', 'createdAt', 'updatedAt', 'version'].includes(key)) {
        return;
      }

      const localValue = localData[key];
      const remoteValue = remoteData[key];

      if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
        changedFields.push(key);
      }
    });

    Object.keys(remoteData).forEach((key) => {
      if (
        !localData.hasOwnProperty(key) &&
        !['id', 'createdAt', 'updatedAt', 'version'].includes(key)
      ) {
        changedFields.push(key);
      }
    });

    return changedFields;
  };

  const renderField = (fieldName: string) => {
    const localValue = conflict.localData?.[fieldName];
    const remoteValue = conflict.remoteData?.[fieldName];
    const isDifferent = JSON.stringify(localValue) !== JSON.stringify(remoteValue);

    if (!isDifferent) return null;

    const getFieldLabel = (name: string) => {
      const fieldLabels: Record<string, string> = {
        name: 'Nome',
        email: 'Email',
        phoneNumber: 'Telefone',
        birthDate: 'Data de Nascimento',
        address: 'Endereço',
        color: 'Cor',
        date: 'Data',
        startTime: 'Hora Início',
        endTime: 'Hora Fim',
        value: 'Valor',
        status: 'Status',
        notes: 'Observações',
        paymentDate: 'Data de Pagamento',
        grossValue: 'Valor Bruto',
        netValue: 'Valor Líquido',
        paid: 'Pago',
        method: 'Método de Pagamento',
      };

      return fieldLabels[name] || name;
    };

    return (
      <View key={fieldName} className="mb-3 rounded-lg border border-gray-200 bg-white p-3">
        <Text className="mb-1 font-medium text-primary">{getFieldLabel(fieldName)}</Text>

        <View className="flex-row justify-between">
          <View className="mr-2 flex-1">
            <Text className="mb-1 text-xs text-gray-500">Versão Local</Text>
            <View className="bg-primary-50 rounded-md p-2">
              <Text className="text-sm text-text-dark">{formatValue(localValue)}</Text>
            </View>
          </View>

          <View className="flex-1">
            <Text className="mb-1 text-xs text-gray-500">Versão Remota</Text>
            <View className="rounded-md bg-green-50 p-2">
              <Text className="text-sm text-text-dark">{formatValue(remoteValue)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const handleResolve = async (resolution: 'local' | 'remote' | 'merged') => {
    try {
      setIsLoading(true);
      await onResolve(conflict.id, resolution);
    } catch (error) {
      console.error('Erro ao resolver conflito:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-5/6 rounded-t-xl bg-gray-50">
          <View className="border-b border-gray-200 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-text-dark">Conflito de Sincronização</Text>
              <TouchableOpacity onPress={onClose} disabled={isLoading}>
                <Ionicons name="close" size={24} color="#2B2D42" />
              </TouchableOpacity>
            </View>
            <Text className="mt-1 text-text-light">
              Foram encontradas alterações no {getEntityName()} "{getItemName()}" tanto no
              dispositivo quanto no servidor.
            </Text>
          </View>

          <ScrollView className="p-4">
            <Text className="mb-3 font-medium text-text-dark">
              Selecione qual versão deseja manter:
            </Text>

            {getChangedFields().map((field) => renderField(field))}
          </ScrollView>

          <View className="border-t border-gray-200 p-4">
            <View className="flex-row justify-between space-x-3">
              <TouchableOpacity
                className="flex-1 rounded-md bg-primary p-3"
                onPress={() => handleResolve('local')}
                disabled={isLoading}>
                <Text className="text-center font-medium text-white">
                  {isLoading ? 'Aplicando...' : 'Usar Local'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 rounded-md bg-green-600 p-3"
                onPress={() => handleResolve('remote')}
                disabled={isLoading}>
                <Text className="text-center font-medium text-white">
                  {isLoading ? 'Aplicando...' : 'Usar Remoto'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="mt-3 rounded-md bg-gray-200 p-3"
              onPress={onClose}
              disabled={isLoading}>
              <Text className="text-center font-medium text-text-dark">Decidir depois</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SyncConflictModal;
