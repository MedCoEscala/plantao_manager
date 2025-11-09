import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  StyleSheet,
} from 'react-native';

interface TimePickerModalProps {
  visible: boolean;
  title: string;
  initialTime: Date;
  onConfirm: (time: Date) => void;
  onCancel: () => void;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  title,
  initialTime,
  onConfirm,
  onCancel,
}) => {
  const [selectedTime, setSelectedTime] = useState(initialTime);

  useEffect(() => {
    setSelectedTime(initialTime);
  }, [initialTime]);

  const handleConfirm = useCallback(() => {
    onConfirm(selectedTime);
  }, [selectedTime, onConfirm]);

  const handleTimeChange = useCallback(
    (event: any, date?: Date) => {
      if (Platform.OS === 'android') {
        // No Android, fechar após seleção
        if (event.type === 'set' && date) {
          onConfirm(date);
        } else if (event.type === 'dismissed') {
          onCancel();
        }
      } else {
        // No iOS, apenas atualizar o estado
        if (date) {
          setSelectedTime(date);
        }
      }
    },
    [onConfirm, onCancel]
  );

  if (Platform.OS === 'android') {
    return (
      <>
        {visible && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="default"
            onChange={handleTimeChange}
            is24Hour
            accentColor="#18cb96"
          />
        )}
      </>
    );
  }

  // iOS: Modal compacto com design nativo
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
      statusBarTranslucent>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Container centralizado */}
      <View style={styles.centeredContainer} pointerEvents="box-none">
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <Text style={styles.title}>{title}</Text>

            <TouchableOpacity onPress={handleConfirm} style={styles.headerButton}>
              <Text style={styles.confirmText}>Confirmar</Text>
            </TouchableOpacity>
          </View>

          {/* Picker Nativo iOS */}
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
              is24Hour
              textColor="#1e293b"
              locale="pt-BR"
              style={styles.picker}
            />
          </View>

          {/* Botões Rápidos */}
          <View style={styles.quickButtons}>
            <Text style={styles.quickButtonsLabel}>Horários comuns</Text>
            <View style={styles.quickButtonsRow}>
              {[
                { hour: 7, minute: 0, label: '07:00' },
                { hour: 8, minute: 0, label: '08:00' },
                { hour: 12, minute: 0, label: '12:00' },
                { hour: 19, minute: 0, label: '19:00' },
              ].map((time) => (
                <TouchableOpacity
                  key={time.label}
                  onPress={() => {
                    const newTime = new Date(selectedTime);
                    newTime.setHours(time.hour, time.minute, 0, 0);
                    setSelectedTime(newTime);
                  }}
                  style={styles.quickButton}>
                  <Text style={styles.quickButtonText}>{time.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  headerButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 80,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '400',
  },
  confirmText: {
    fontSize: 16,
    color: '#18cb96',
    fontWeight: '600',
    textAlign: 'right',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  picker: {
    width: '100%',
    height: 180,
  },
  quickButtons: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  quickButtonsLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  quickButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  quickButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickButtonText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
});
