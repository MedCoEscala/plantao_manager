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
      const today = new Date();
      const isToday = initialDate.toDateString() === today.toDateString();

      if (isToday) {
        return 'Novo Plantão - Hoje';
      }

      return `Novo Plantão - ${format(initialDate, "dd 'de' MMMM", { locale: ptBR })}`;
    }
    return 'Novo Plantão';
  }, [initialDate]);

  const getModalSubtitle = useCallback(() => {
    if (initialDate) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const isToday = initialDate.toDateString() === today.toDateString();
      const isTomorrow = initialDate.toDateString() === tomorrow.toDateString();

      if (isToday) {
        return `Data pré-selecionada: ${format(initialDate, 'dd/MM/yyyy')}`;
      } else if (isTomorrow) {
        return `Data pré-selecionada: Amanhã (${format(initialDate, 'dd/MM/yyyy')})`;
      } else {
        return `Data pré-selecionada: ${format(initialDate, 'EEEE, dd/MM/yyyy', { locale: ptBR })}`;
      }
    }
    return 'Preencha os dados para criar seu plantão';
  }, [initialDate]);

  const getHeaderIcon = useCallback(() => {
    if (initialDate) {
      const today = new Date();
      const isToday = initialDate.toDateString() === today.toDateString();

      if (isToday) {
        return 'today-outline';
      }
      return 'calendar-outline';
    }
    return 'add-circle-outline';
  }, [initialDate]);

  const getHeaderIconColor = useCallback(() => {
    if (initialDate) {
      const today = new Date();
      const isToday = initialDate.toDateString() === today.toDateString();

      if (isToday) {
        return '#18cb96';
      }
      return '#3b82f6';
    }
    return '#64748b';
  }, [initialDate]);

  const handleSuccess = useCallback(() => {
    setIsProcessing(false);
    onSuccess?.();
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
      <StatusBar barStyle="dark-content" />

      <View className="flex-1 bg-background">
        <View className="border-b border-background-200 bg-white pb-4 pt-12 shadow-sm">
          <View className="flex-row items-center justify-between px-6">
            <View className="flex-1 pr-4">
              <View className="mb-2 flex-row items-center">
                <View
                  className="mr-3 h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: getHeaderIconColor() + '20' }}>
                  <Ionicons name={getHeaderIcon()} size={18} color={getHeaderIconColor()} />
                </View>
                <Text className="text-xl font-bold text-text-dark">{getModalTitle()}</Text>
              </View>

              <Text className="ml-11 text-sm leading-5 text-text-light">{getModalSubtitle()}</Text>

              {initialDate &&
                (() => {
                  const today = new Date();
                  const diffDays = Math.ceil(
                    (initialDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                  );

                  if (diffDays > 1) {
                    return (
                      <View className="ml-11 mt-2">
                        <View className="self-start rounded-full bg-blue-100 px-3 py-1">
                          <Text className="text-xs font-medium text-blue-700">
                            {diffDays === 1 ? 'Amanhã' : `Em ${diffDays} dias`}
                          </Text>
                        </View>
                      </View>
                    );
                  }
                  return null;
                })()}
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
