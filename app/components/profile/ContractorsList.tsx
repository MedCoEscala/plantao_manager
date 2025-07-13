import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';

import { useDialog } from '../../contexts/DialogContext';
import { useContractorsApi, Contractor } from '../../services/contractors-api';
import { ContractorFormModal } from '../contractors/ContractorFormModal';
import { useToast } from '../ui/Toast';

interface ContractorsListProps {
  title?: string;
}

const ContractorsList: React.FC<ContractorsListProps> = memo(({ title = 'Contratantes' }) => {
  // Estado local para contratantes e carregamento
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal e hooks de UI
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  const { showDialog } = useDialog();
  const { showToast } = useToast();
  const contractorsApi = useContractorsApi();

  // Função para carregar os contratantes
  const loadContractors = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await contractorsApi.getContractors();
      setContractors(data);
    } catch (error: any) {
      console.error('Erro ao carregar contratantes:', error);
      showToast('Não foi possível carregar os contratantes.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove contractorsApi e showToast das dependências

  // useFocusEffect para recarregar os dados quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      loadContractors();
    }, [loadContractors])
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
            await contractorsApi.deleteContractor(contractor.id);
            // Atualiza a lista localmente para resposta imediata
            setContractors((prev) => prev.filter((c) => c.id !== contractor.id));
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
    },
    [contractorsApi, showDialog, showToast]
  );

  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
    setSelectedContractor(null);
  }, []);

  // Após sucesso no modal, recarrega a lista
  const handleModalSuccess = useCallback(() => {
    setIsModalVisible(false);
    setSelectedContractor(null);
    loadContractors();
  }, [loadContractors]);

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
            onPress={loadContractors}
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
});

ContractorsList.displayName = 'ContractorsList';

export default ContractorsList;
