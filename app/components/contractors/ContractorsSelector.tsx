import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

import ContractorFormModal from '@/components/contractors/ContractorFormModal';
import { useContractorsSelector } from '@/hooks/useContractorsSelector';
import { Contractor } from '@/services/contractors-api';

interface ContractorsSelectorProps {
  selectedContractorId: string;
  onContractorSelect: (contractorId: string) => void;
  title?: string;
  required?: boolean;
}

const ContractorsSelector: React.FC<ContractorsSelectorProps> = memo(
  ({ selectedContractorId, onContractorSelect, title = 'Contratante', required = false }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [contractorToEdit, setContractorToEdit] = useState<string | undefined>(undefined);

    const { contractors, isLoading, loadContractors } = useContractorsSelector();

    const selectedContractor = contractors.find((c) => c.id === selectedContractorId);

    const handleAddContractor = useCallback(() => {
      setContractorToEdit(undefined);
      setIsModalVisible(true);
    }, []);

    const handleEditContractor = useCallback((contractorId: string) => {
      setContractorToEdit(contractorId);
      setIsModalVisible(true);
    }, []);

    const handleModalClose = useCallback(() => {
      setIsModalVisible(false);
      setContractorToEdit(undefined);
    }, []);

    const handleModalSuccess = useCallback(() => {
      setIsModalVisible(false);
      setContractorToEdit(undefined);
      loadContractors();
    }, [loadContractors]);

    const handleContractorSelect = useCallback(
      (id: string) => {
        onContractorSelect(id);
      },
      [onContractorSelect]
    );

    const renderContractorItem = useCallback(
      (contractor: Contractor, isSelected: boolean) => (
        <TouchableOpacity
          key={contractor.id}
          className={`mb-2 flex-row items-center justify-between rounded-lg border p-3 ${
            isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'
          }`}
          onPress={() => handleContractorSelect(contractor.id)}>
          <View className="flex-1">
            <Text className={`font-medium ${isSelected ? 'text-primary' : 'text-text-dark'}`}>
              {contractor.name}
            </Text>
            {contractor.email && (
              <View className="mt-1 flex-row items-center">
                <Ionicons name="mail-outline" size={12} color="#64748b" />
                <Text className="ml-1 text-xs text-text-light">{contractor.email}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            className="ml-2 h-8 w-8 items-center justify-center rounded-full bg-background-100"
            onPress={() => handleEditContractor(contractor.id)}>
            <Ionicons name="pencil-outline" size={16} color="#64748b" />
          </TouchableOpacity>
        </TouchableOpacity>
      ),
      [handleContractorSelect, handleEditContractor]
    );

    return (
      <View className="mb-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-base font-medium text-text-dark">
            {title}
            {required && <Text className="text-error"> *</Text>}
          </Text>
          <TouchableOpacity
            className="flex-row items-center rounded-md bg-primary/10 px-2 py-1"
            onPress={handleAddContractor}>
            <Ionicons name="add-circle-outline" size={16} color="#18cb96" />
            <Text className="ml-1 text-xs font-medium text-primary">Novo</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="h-24 items-center justify-center rounded-lg border border-gray-200 bg-white">
            <ActivityIndicator size="small" color="#18cb96" />
            <Text className="mt-2 text-xs text-text-light">Carregando contratantes...</Text>
          </View>
        ) : contractors.length === 0 ? (
          <View className="h-24 items-center justify-center rounded-lg border border-gray-200 bg-white">
            <Text className="text-sm text-text-light">Nenhum contratante cadastrado</Text>
            <TouchableOpacity
              className="mt-2 flex-row items-center rounded-md bg-primary px-3 py-1"
              onPress={handleAddContractor}>
              <Ionicons name="add-circle-outline" size={14} color="#ffffff" />
              <Text className="ml-1 text-xs font-medium text-white">Adicionar Contratante</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            className="max-h-48 rounded-lg border border-gray-200 bg-white p-2"
            showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              className={`mb-2 flex-row items-center justify-between rounded-lg border p-3 ${
                !selectedContractorId ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'
              }`}
              onPress={() => handleContractorSelect('')}>
              <Text className={!selectedContractorId ? 'text-primary' : 'text-text-dark'}>
                Nenhum contratante
              </Text>
            </TouchableOpacity>
            {contractors.map((contractor) =>
              renderContractorItem(contractor, contractor.id === selectedContractorId)
            )}
          </ScrollView>
        )}

        {selectedContractor && (
          <View className="mt-2 rounded-lg bg-primary/5 p-2">
            <Text className="text-xs text-text-light">Contratante selecionado:</Text>
            <Text className="text-sm font-medium text-primary">{selectedContractor.name}</Text>
          </View>
        )}

        <ContractorFormModal
          visible={isModalVisible}
          onClose={handleModalClose}
          contractorId={contractorToEdit}
          onSuccess={handleModalSuccess}
        />
      </View>
    );
  }
);

ContractorsSelector.displayName = 'ContractorsSelector';

export default ContractorsSelector;
