import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useShiftTemplatesContext } from '../../contexts/ShiftTemplatesContext';
import { ShiftTemplate } from '../../services/shift-templates-api';
import { formatTime, formatCurrency } from '../../utils/formatters';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import { cn } from '../../utils/cn';

interface TemplateSelectorProps {
  selectedTemplateId?: string | null;
  onTemplateSelect: (template: ShiftTemplate | null) => void;
  className?: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplateId,
  onTemplateSelect,
  className,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { templates } = useShiftTemplatesContext();

  // Filtrar apenas templates ativos
  const activeTemplates = useMemo(() => {
    return templates.filter((template) => template.isActive);
  }, [templates]);

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) return null;
    return activeTemplates.find((template) => template.id === selectedTemplateId) || null;
  }, [selectedTemplateId, activeTemplates]);

  const handleTemplateSelect = useCallback(
    (template: ShiftTemplate) => {
      onTemplateSelect(template);
      setIsModalVisible(false);
    },
    [onTemplateSelect]
  );

  const handleClearTemplate = useCallback(() => {
    onTemplateSelect(null);
    setIsModalVisible(false);
  }, [onTemplateSelect]);

  const openModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  return (
    <>
      <Card className={cn('mb-6', className)}>
        <SectionHeader
          title="Template de Plantão"
          subtitle="Use um template para preencher automaticamente"
          icon="bookmark-outline"
        />

        <TouchableOpacity
          onPress={openModal}
          className={cn(
            'flex-row items-center rounded-xl border-2 p-4 transition-colors',
            selectedTemplate ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50'
          )}
          activeOpacity={0.7}>
          <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <Ionicons name="bookmark-outline" size={20} color="#18cb96" />
          </View>

          <View className="flex-1">
            {selectedTemplate ? (
              <>
                <Text className="text-base font-semibold text-primary">
                  {selectedTemplate.name}
                </Text>
                <View className="mt-1 flex-row items-center">
                  <Text className="text-sm text-gray-600">
                    {formatTime(selectedTemplate.startTime)} -{' '}
                    {formatTime(selectedTemplate.endTime)}
                  </Text>
                  <Text className="ml-2 text-sm font-medium text-primary">
                    {formatCurrency(selectedTemplate.value)}
                  </Text>
                </View>
                {selectedTemplate.description && (
                  <Text
                    className="mt-1 text-xs text-gray-500"
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {selectedTemplate.description}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text className="text-base font-medium text-gray-700">Selecionar Template</Text>
                <Text className="text-sm text-gray-500">
                  {activeTemplates.length > 0
                    ? `${activeTemplates.length} template${activeTemplates.length > 1 ? 's' : ''} disponível${activeTemplates.length > 1 ? 'eis' : ''}`
                    : 'Nenhum template disponível'}
                </Text>
              </>
            )}
          </View>

          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        {selectedTemplate && (
          <TouchableOpacity
            onPress={handleClearTemplate}
            className="mt-3 flex-row items-center justify-center rounded-lg bg-red-50 py-2"
            activeOpacity={0.7}>
            <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
            <Text className="ml-1 text-sm font-medium text-red-600">Limpar Template</Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Modal de Seleção */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}>
        <SafeAreaView className="flex-1 bg-white">
          {/* Header do Modal */}
          <View className="flex-row items-center justify-between border-b border-gray-200 px-6 py-4">
            <TouchableOpacity onPress={closeModal} activeOpacity={0.7}>
              <Text className="text-base font-medium text-gray-600">Cancelar</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">Selecionar Template</Text>
            <TouchableOpacity onPress={handleClearTemplate} activeOpacity={0.7}>
              <Text className="text-base font-medium text-red-500">Limpar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {activeTemplates.length > 0 ? (
              <View className="px-6 py-4">
                {activeTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    onPress={() => handleTemplateSelect(template)}
                    className={cn(
                      'mb-3 rounded-xl border-2 p-4',
                      selectedTemplateId === template.id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 bg-white'
                    )}
                    activeOpacity={0.7}>
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text
                          className={cn(
                            'text-base font-semibold',
                            selectedTemplateId === template.id ? 'text-primary' : 'text-gray-900'
                          )}>
                          {template.name}
                        </Text>

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

                      {selectedTemplateId === template.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#18cb96" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="flex-1 items-center justify-center px-6 py-12">
                <Ionicons name="bookmark-outline" size={64} color="#cbd5e1" />
                <Text className="mt-4 text-center text-lg font-bold text-gray-700">
                  Nenhum Template Ativo
                </Text>
                <Text className="mt-2 text-center text-sm text-gray-500">
                  Crie templates na aba "Templates" para usá-los aqui.
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default TemplateSelector;
