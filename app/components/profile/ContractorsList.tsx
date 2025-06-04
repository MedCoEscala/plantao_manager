import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';

import { ContractorFormModal } from '@/components/contractors/ContractorFormModal';
import { useToast } from '@/components/ui/Toast';
import { useDialog } from '@/contexts/DialogContext';
import { useContractorsSelector } from '@/hooks/useContractorsSelector';
import { useContractorsApi, Contractor } from '@/services/contractors-api';

interface ContractorsListProps {
  title?: string;
}

const ContractorsList: React.FC<ContractorsListProps> = ({ title = 'Contratantes' }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  const { showDialog } = useDialog();
  const { showToast } = useToast();
  const contractorsApi = useContractorsApi();

  // Usando o hook de contratantes que centraliza a lógica
  const { contractors, isLoading, loadContractors } = useContractorsSelector();

  const handleRefresh = () => {
    // Forçar recarregamento passando true
    loadContractors(true);
  };

  const handleAddContractor = () => {
    setSelectedContractor(null);
    setIsModalVisible(true);
  };

  const handleEditContractor = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setIsModalVisible(true);
  };

  const confirmDeleteContractor = (contractor: Contractor) => {
    showDialog({
      title: 'Confirmar exclusão',
      message: `Deseja realmente excluir o contratante "${contractor.name}"?`,
      type: 'confirm',
      confirmText: 'Excluir',
      onConfirm: async () => {
        try {
          await contractorsApi.deleteContractor(contractor.id);
          handleRefresh(); // Recarregar lista após exclusão
          showToast('Contratante excluído com sucesso', 'success');
        } catch (error: any) {
          console.error('Erro ao excluir contratante:', error);
          showToast(
            `Erro ao excluir contratante: ${error.message || 'Erro desconhecido'}`,
            'error'
          );
        }
      },
    });
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedContractor(null);
  };

  const handleModalSuccess = () => {
    setIsModalVisible(false);
    handleRefresh(); // Recarregar lista após adicionar/editar
  };

  const renderContractorItem = ({ item }: { item: Contractor }) => (
    <TouchableOpacity
      className="mb-3 overflow-hidden rounded-lg bg-white shadow-sm"
      activeOpacity={0.7}
      onPress={() => handleEditContractor(item)}>
      <View className="flex-row">
        <View className="flex-1 p-3">
          <Text className="text-base font-bold text-text-dark">{item.name}</Text>

          {item.email && (
            <View className="mt-1 flex-row items-center">
              <Ionicons name="mail-outline" size={14} color="#64748b" />
              <Text className="ml-1 text-sm text-text-light">{item.email}</Text>
            </View>
          )}

          {item.phone && (
            <View className="mt-1 flex-row items-center">
              <Ionicons name="call-outline" size={14} color="#64748b" />
              <Text className="ml-1 text-sm text-text-light">{item.phone}</Text>
            </View>
          )}
        </View>

        <View className="justify-center pr-3">
          <TouchableOpacity
            className="mb-2 h-8 w-8 items-center justify-center rounded-full bg-background-100"
            onPress={() => confirmDeleteContractor(item)}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
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
  );

  return (
    <View className="flex-1 rounded-lg bg-background-50 p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-text-dark">{title}</Text>

        <View className="flex-row">
          <TouchableOpacity
            className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-background-100"
            onPress={handleRefresh}
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
          showsVerticalScrollIndicator
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
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
};

export default ContractorsList;
