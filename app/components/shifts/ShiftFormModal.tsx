import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, StatusBar } from 'react-native';

import ShiftForm from './ShiftForm';

interface ShiftFormModalProps {
  visible: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  onSuccess?: () => void;
}

const ShiftFormModal: React.FC<ShiftFormModalProps> = ({
  visible,
  onClose,
  initialDate,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const getModalTitle = useCallback(() => {
    if (initialDate) {
      return `Novo Plantão - ${format(initialDate, "dd 'de' MMMM", { locale: ptBR })}`;
    }
    return 'Novo Plantão';
  }, [initialDate]);

  const handleSuccess = useCallback(() => {
    setIsProcessing(false);
    onSuccess?.();
    // Pequeno delay para melhor UX
    setTimeout(() => {
      onClose();
    }, 100);
  }, [onSuccess, onClose]);

  const handleCancel = useCallback(() => {
    if (!isProcessing) {
      onClose();
    }
  }, [isProcessing, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View className="flex-1 bg-background">
        {/* Header moderno */}
        <View className="border-b border-background-200 bg-white pb-4 pt-12 shadow-sm">
          <View className="flex-row items-center justify-between px-6">
            <View className="flex-1 pr-4">
              <Text className="mb-1 text-xl font-bold text-text-dark">{getModalTitle()}</Text>
              <Text className="text-sm leading-5 text-text-light">
                Preencha os dados para criar seu plantão
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleCancel}
              disabled={isProcessing}
              className={`h-10 w-10 items-center justify-center rounded-xl ${
                isProcessing ? 'bg-background-200' : 'bg-background-100'
              }`}
              activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={isProcessing ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ShiftForm
          initialDate={initialDate}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          isModal
        />
      </View>
    </Modal>
  );
};

export default ShiftFormModal;
