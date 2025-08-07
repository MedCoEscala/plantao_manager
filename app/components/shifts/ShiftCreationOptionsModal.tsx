import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useShiftTemplatesContext } from '../../contexts/ShiftTemplatesContext';
import { formatTime, formatCurrency } from '../../utils/formatters';

interface ShiftCreationOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate?: Date;
  onCreateFromTemplate: (templateId: string) => void;
  onCreateNewShift: () => void;
  onCreateNewTemplate: () => void;
}

const ShiftCreationOptionsModal: React.FC<ShiftCreationOptionsModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onCreateFromTemplate,
  onCreateNewShift,
  onCreateNewTemplate,
}) => {
  const { templates } = useShiftTemplatesContext();

  // Filtrar apenas templates ativos
  const activeTemplates = templates.filter((template) => template.isActive);

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-200 px-6 py-4">
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-gray-900">Criar Plantão</Text>
            {selectedDate && <Text className="text-sm text-gray-500">{formatSelectedDate()}</Text>}
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Templates Disponíveis */}
          {activeTemplates.length > 0 && (
            <View className="px-6 py-4">
              <Text className="mb-4 text-base font-semibold text-gray-900">
                📋 Templates Disponíveis
              </Text>

              {activeTemplates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  onPress={() => onCreateFromTemplate(template.id)}
                  className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
                  activeOpacity={0.7}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">{template.name}</Text>

                      {template.description && (
                        <Text className="mt-1 text-sm text-gray-600" numberOfLines={2}>
                          {template.description}
                        </Text>
                      )}

                      <View className="mt-2 flex-row items-center">
                        <Ionicons name="time-outline" size={14} color="#64748b" />
                        <Text className="ml-1 text-sm text-gray-600">
                          {formatTime(template.startTime)} - {formatTime(template.endTime)}
                        </Text>
                      </View>

                      {template.location && (
                        <View className="mt-1 flex-row items-center">
                          <View
                            className="mr-2 h-3 w-3 rounded-full"
                            style={{ backgroundColor: template.location.color }}
                          />
                          <Text className="text-sm text-gray-600">{template.location.name}</Text>
                        </View>
                      )}

                      <View className="mt-2 flex-row items-center justify-between">
                        <Text className="text-base font-bold text-primary">
                          {formatCurrency(template.value)}
                        </Text>
                        <Text className="text-sm text-gray-500">{template.paymentType}</Text>
                      </View>
                    </View>

                    <View className="ml-4 items-center justify-center">
                      <Ionicons name="chevron-forward" size={20} color="#18cb96" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Outras Opções */}
          <View className="border-t border-gray-200 px-6 py-4">
            <Text className="mb-4 text-base font-semibold text-gray-900">⚡ Outras Opções</Text>

            {/* Criar Plantão do Zero */}
            <TouchableOpacity
              onPress={onCreateNewShift}
              className="mb-3 flex-row items-center rounded-xl bg-primary/10 p-4"
              activeOpacity={0.7}>
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Ionicons name="add-circle-outline" size={24} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">Criar Plantão do Zero</Text>
                <Text className="text-sm text-gray-600">Preencha todos os dados manualmente</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#18cb96" />
            </TouchableOpacity>

            {/* Criar Novo Template */}
            <TouchableOpacity
              onPress={onCreateNewTemplate}
              className="flex-row items-center rounded-xl bg-blue-50 p-4"
              activeOpacity={0.7}>
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                <Ionicons name="bookmark-outline" size={24} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">Criar Novo Template</Text>
                <Text className="text-sm text-gray-600">Salve um modelo para usar depois</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {/* Mensagem quando não há templates */}
          {activeTemplates.length === 0 && (
            <View className="items-center justify-center px-6 py-8">
              <Ionicons name="bookmark-outline" size={64} color="#cbd5e1" />
              <Text className="mt-4 text-center text-lg font-bold text-gray-700">
                Nenhum Template Criado
              </Text>
              <Text className="mt-2 text-center text-sm text-gray-500">
                Crie seu primeiro template para agilizar futuras criações de plantões
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default ShiftCreationOptionsModal;
