import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type DialogType = 'success' | 'error' | 'info' | 'warning' | 'confirm';

interface DialogProps {
  visible: boolean;
  type?: DialogType;
  title?: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
  confirmText?: string;
  cancelText?: string;
}

const getDialogStyles = (type: DialogType) => {
  switch (type) {
    case 'success':
      return {
        icon: 'checkmark-circle',
        iconColor: '#10B981',
        title: 'Sucesso',
      };
    case 'error':
      return {
        icon: 'close-circle',
        iconColor: '#EF4444',
        title: 'Erro',
      };
    case 'warning':
      return {
        icon: 'warning',
        iconColor: '#F59E0B',
        title: 'Alerta',
      };
    case 'confirm':
      return {
        icon: 'help-circle',
        iconColor: '#18cb96',
        title: 'Confirmação',
      };
    case 'info':
    default:
      return {
        icon: 'information-circle',
        iconColor: '#18cb96',
        title: 'Informação',
      };
  }
};

const Dialog = ({
  visible,
  type = 'info',
  title,
  message,
  onConfirm,
  onCancel,
  onClose,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}: DialogProps) => {
  const styles = getDialogStyles(type);
  const isConfirmDialog = type === 'confirm';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isConfirmDialog ? onCancel || onClose : onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styleSheet.overlay}>
          <TouchableWithoutFeedback>
            <View style={styleSheet.dialogContainer}>
              <View style={styleSheet.header}>
                <Ionicons name={styles.icon as any} size={24} color={styles.iconColor} />
                <Text style={styleSheet.title}>{title || styles.title}</Text>
              </View>

              <Text style={styleSheet.message}>{message}</Text>

              <View
                style={[
                  styleSheet.buttonContainer,
                  {
                    justifyContent: isConfirmDialog ? 'space-between' : 'flex-end',
                  },
                ]}>
                {isConfirmDialog && (
                  <TouchableOpacity onPress={onCancel || onClose} style={styleSheet.cancelButton}>
                    <Text style={styleSheet.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={isConfirmDialog ? onConfirm : onClose}
                  style={[
                    styleSheet.confirmButton,
                    {
                      backgroundColor:
                        type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#18cb96',
                    },
                  ]}>
                  <Text style={styleSheet.confirmButtonText}>
                    {isConfirmDialog ? confirmText : 'OK'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styleSheet = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialogContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#1F2937',
  },
  message: {
    color: '#4B5563',
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontWeight: '500',
  },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default Dialog;
