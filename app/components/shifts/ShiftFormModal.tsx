// app/components/shifts/ShiftFormModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ShiftForm from './ShiftForm';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ShiftFormModalProps {
  visible: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  onSuccess?: () => void;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.85; // 85% da altura da tela

const ShiftFormModal: React.FC<ShiftFormModalProps> = ({
  visible,
  onClose,
  initialDate,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [animatedValue] = useState(new Animated.Value(0));

  // Animation when modal shows/hides
  useEffect(() => {
    if (visible) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, animatedValue]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  const backdropOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  // Handle success (close modal and call onSuccess)
  const handleSuccess = () => {
    console.log('ShiftFormModal: handleSuccess chamado');
    if (onSuccess) {
      onSuccess();
    }
  };

  // Handle closing the modal
  const handleClose = () => {
    console.log('ShiftFormModal: handleClose chamado');
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#000',
              opacity: backdropOpacity,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Modal Content */}
      <View className="flex-1 justify-end" style={{ paddingBottom: insets.bottom }}>
        <Animated.View
          className="w-full overflow-hidden rounded-t-3xl bg-white"
          style={{
            transform: [{ translateY }],
            height: MODAL_HEIGHT, // Definir altura explicitamente
            maxHeight: SCREEN_HEIGHT * 0.9,
          }}>
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4">
            <Text className="text-lg font-semibold text-text-dark">
              {initialDate
                ? `Novo Plantão: ${format(initialDate, "dd 'de' MMMM", { locale: ptBR })}`
                : 'Novo Plantão'}
            </Text>
            <TouchableOpacity className="p-2" onPress={handleClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
            <ScrollView
              className="flex-1"
              contentContainerClassName="p-5"
              showsVerticalScrollIndicator={true}>
              <ShiftForm initialDate={initialDate} onSuccess={handleSuccess} isModal={true} />
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ShiftFormModal;
