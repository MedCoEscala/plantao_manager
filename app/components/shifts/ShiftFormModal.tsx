import React, { useState, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, StatusBar } from 'react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
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
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">{getModalTitle()}</Text>
            <Text className="mt-1 text-sm text-gray-600">
              Preencha os dados para criar o plantão
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleCancel}
            disabled={isProcessing}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="close" size={20} color={isProcessing ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ShiftForm
          initialDate={initialDate}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          isModal={true}
        />
      </View>
    </Modal>
  );
};

export default ShiftFormModal;
