import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useContractorsContext, Contractor } from '../../contexts/ContractorsContext';
import { useDialog } from '../../contexts/DialogContext';
import { ContractorFormModal } from '../contractors/ContractorFormModal';

interface ContractorsListProps {
  title?: string;
}

const ContractorsList: React.FC<ContractorsListProps> = memo(({ title = 'Contratantes' }) => {
  // Usa o Context ao invés de estado local
  const { contractors, isLoading, refreshContractors, deleteContractor } = useContractorsContext();
  const insets = useSafeAreaInsets();

  // Modal e hooks de UI
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  const { showDialog } = useDialog();

  // useFocusEffect para recarregar os dados quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      refreshContractors();
    }, [refreshContractors])
  );

  const handleAddContractor = useCallback(() => {
    setSelectedContractor(null);
    setIsModalVisible(true);
  }, []);

  const handleEditContractor = useCallback((contractor: Contractor) => {
    setSelectedContractor(contractor);
    setIsModalVisible(true);
  }, []);

  const confirmDeleteContractor = useCallback(
    (contractor: Contractor) => {
      showDialog({
        title: 'Confirmar exclusão',
        message: `Deseja realmente excluir o contratante "${contractor.name}"?`,
        type: 'confirm',
        confirmText: 'Excluir',
        onConfirm: async () => {
          try {
            // O Context já lida com o toast e a atualização do estado
            await deleteContractor(contractor.id);
          } catch (error: any) {
            console.error('Erro ao excluir contratante:', error);
          }
        },
      });
    },
    [deleteContractor, showDialog]
  );

  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
    setSelectedContractor(null);
  }, []);

  // Após sucesso no modal, recarrega a lista
  const handleModalSuccess = useCallback(() => {
    setIsModalVisible(false);
    setSelectedContractor(null);
    refreshContractors();
  }, [refreshContractors]);

  const renderContractorItem = useCallback(
    ({ item }: { item: Contractor }) => (
      <View className="mb-3 rounded-lg bg-white p-4 shadow-sm">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-base font-bold text-text-dark">{item.name}</Text>
            {item.email && (
              <View className="mt-1 flex-row items-center">
                <Ionicons name="mail-outline" size={14} color="#64748b" />
                <Text className="ml-2 text-sm text-text-light">{item.email}</Text>
              </View>
            )}
            {item.phone && (
              <View className="mt-1 flex-row items-center">
                <Ionicons name="call-outline" size={14} color="#64748b" />
                <Text className="ml-2 text-sm text-text-light">{item.phone}</Text>
              </View>
            )}
          </View>

          <View className="flex-row">
            <TouchableOpacity
              className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-primary/10"
              onPress={() => handleEditContractor(item)}>
              <Ionicons name="pencil-outline" size={16} color="#18cb96" />
            </TouchableOpacity>

            <TouchableOpacity
              className="h-8 w-8 items-center justify-center rounded-full bg-error/10"
              onPress={() => confirmDeleteContractor(item)}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ),
    [handleEditContractor, confirmDeleteContractor]
  );

  const renderEmptyComponent = useCallback(
    () => (
      <View className="items-center justify-center py-6">
        <Ionicons name="briefcase-outline" size={40} color="#cbd5e1" />
        <Text className="mt-2 text-center text-base font-medium text-text-dark">
          Nenhum contratante cadastrado
        </Text>
        <Text className="mb-4 mt-1 text-center text-sm text-text-light">
          Adicione seus contratantes para organizar seus plantões.
        </Text>
        <TouchableOpacity
          className="flex-row items-center rounded-md bg-primary px-4 py-2"
          onPress={handleAddContractor}>
          <Ionicons name="add-circle-outline" size={16} color="#ffffff" />
          <Text className="ml-2 text-sm font-medium text-white">Adicionar Contratante</Text>
        </TouchableOpacity>
      </View>
    ),
    [handleAddContractor]
  );

  return (
    <View className="bg-background-50 flex-1 rounded-lg p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-text-dark">{title}</Text>

        <View className="flex-row">
          <TouchableOpacity
            className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-background-100"
            onPress={refreshContractors}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#18cb96" />
            ) : (
              <Ionicons name="refresh-outline" size={16} color="#1e293b" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="h-8 w-8 items-center justify-center rounded-full bg-primary"
            onPress={handleAddContractor}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && contractors.length === 0 ? (
        <View className="h-48 items-center justify-center">
          <ActivityIndicator size="large" color="#18cb96" />
          <Text className="mt-2 text-text-light">Carregando contratantes...</Text>
        </View>
      ) : (
        <FlatList
          data={contractors}
          renderItem={renderContractorItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Math.max(insets.bottom + 80, 100), // 80px para tab bar + inset do dispositivo
          }}
        />
      )}

      <ContractorFormModal
        visible={isModalVisible}
        onClose={handleModalClose}
        contractorId={selectedContractor?.id}
        onSuccess={handleModalSuccess}
      />
    </View>
  );
});

ContractorsList.displayName = 'ContractorsList';

export default ContractorsList;
