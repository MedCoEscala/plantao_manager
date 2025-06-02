import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/utils/cn';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationModalProps {
  visible: boolean;
  type: NotificationType;
  title?: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
  onClose: () => void;
}

const getNotificationStyles = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return {
        icon: 'checkmark-circle' as const,
        iconColor: '#10B981',
        iconBgColor: '#ECFDF5',
        borderColor: '#10B981',
        backgroundColor: '#F0FDF4',
      };
    case 'error':
      return {
        icon: 'close-circle' as const,
        iconColor: '#EF4444',
        iconBgColor: '#FEF2F2',
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
      };
    case 'warning':
      return {
        icon: 'warning' as const,
        iconColor: '#F59E0B',
        iconBgColor: '#FFFBEB',
        borderColor: '#F59E0B',
        backgroundColor: '#FFFBEB',
      };
    case 'info':
    default:
      return {
        icon: 'information-circle' as const,
        iconColor: '#18cb96',
        iconBgColor: '#e9f9f3',
        borderColor: '#18cb96',
        backgroundColor: '#e9f9f3',
      };
  }
};

export default function NotificationModal({
  visible,
  type,
  title,
  message,
  confirmText = 'OK',
  onConfirm,
  onClose,
}: NotificationModalProps) {
  const styles = getNotificationStyles(type);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <TouchableWithoutFeedback>
            <View className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
              {/* Header com ícone */}
              <View className="mb-4 items-center">
                <View
                  className="mb-4 h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: styles.iconBgColor }}>
                  <Ionicons name={styles.icon} size={32} color={styles.iconColor} />
                </View>

                {title && (
                  <Text className="text-center text-xl font-bold text-text-dark">{title}</Text>
                )}
              </View>

              {/* Mensagem */}
              <Text className="mb-6 text-center text-base leading-6 text-text-light">
                {message}
              </Text>

              {/* Botão de ação */}
              <TouchableOpacity
                onPress={handleConfirm}
                className="h-12 w-full items-center justify-center rounded-xl"
                style={{ backgroundColor: styles.iconColor }}
                activeOpacity={0.8}>
                <Text className="text-base font-semibold text-white">{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
