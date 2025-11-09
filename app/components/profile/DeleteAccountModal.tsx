import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  isLoading?: boolean;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const handleClose = useCallback(() => {
    setPassword('');
    setConfirmText('');
    setStep(1);
    setShowPassword(false);
    onClose();
  }, [onClose]);

  const handleNext = useCallback(() => {
    if (step === 1) {
      setStep(2);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step === 2) {
      setStep(1);
      setPassword('');
      setShowPassword(false);
    }
  }, [step]);

  const handleConfirm = useCallback(async () => {
    if (!password.trim()) {
      Alert.alert('Erro', 'Por favor, digite sua senha para confirmar a exclusão.');
      return;
    }

    if (confirmText.toLowerCase() !== 'deletar') {
      Alert.alert(
        'Erro',
        'Por favor, digite exatamente "DELETAR" para confirmar a exclusão da conta.'
      );
      return;
    }

    try {
      await onConfirm(password);
      handleClose();
    } catch (error: any) {
      // Erro já tratado pelo componente pai
    }
  }, [password, confirmText, onConfirm, handleClose]);

  const canProceed = confirmText.toLowerCase() === 'deletar';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
      statusBarTranslucent>
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1">
          <View className="flex-1 bg-white">
            {/* Header */}
            <View className="border-b border-gray-200 p-4">
              <View className="flex-row items-center justify-between">
                {step === 2 && (
                  <TouchableOpacity
                    onPress={handleBack}
                    className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100"
                    disabled={isLoading}>
                    <Ionicons name="arrow-back" size={20} color="#1e293b" />
                  </TouchableOpacity>
                )}
                <View className="flex-1">
                  <Text className="text-xl font-bold text-error">Excluir Conta</Text>
                  <Text className="mt-0.5 text-sm text-text-light">
                    {step === 1 ? 'Etapa 1 de 2' : 'Etapa 2 de 2'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
                  disabled={isLoading}>
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="p-6">
                {step === 1 ? (
                  <>
                    {/* Step 1: Avisos */}
                    <View className="mb-4 rounded-xl bg-red-50 p-4">
                      <View className="flex-row items-center">
                        <Ionicons name="warning" size={24} color="#ef4444" />
                        <Text className="ml-2 text-base font-bold text-error">
                          Atenção: Ação Irreversível
                        </Text>
                      </View>
                    </View>

                    <Text className="mb-4 text-base text-text-dark">
                      Esta ação é permanente e não pode ser desfeita. Ao excluir sua conta:
                    </Text>

                    <View className="mb-6 space-y-3">
                      {[
                        'Todos os seus plantões serão permanentemente excluídos',
                        'Seus locais de trabalho salvos serão removidos',
                        'Seus contratantes cadastrados serão deletados',
                        'Histórico de pagamentos será apagado',
                        'Templates de plantão serão perdidos',
                        'Configurações de notificações serão removidas',
                        'Sua conta não poderá ser recuperada',
                      ].map((item, index) => (
                        <View key={index} className="flex-row">
                          <Ionicons name="close-circle" size={20} color="#ef4444" />
                          <Text className="ml-2 flex-1 text-sm text-text-dark">{item}</Text>
                        </View>
                      ))}
                    </View>

                    <View className="mb-6 rounded-xl bg-blue-50 p-4">
                      <View className="flex-row items-center">
                        <Ionicons name="information-circle" size={20} color="#3b82f6" />
                        <Text className="ml-2 text-sm font-semibold text-blue-900">
                          Alternativa
                        </Text>
                      </View>
                      <Text className="mt-2 text-sm text-blue-800">
                        Se você apenas deseja fazer uma pausa, basta sair do aplicativo. Seus dados
                        permanecerão seguros e você poderá voltar a qualquer momento.
                      </Text>
                    </View>

                    <View className="mb-4 rounded-xl border-2 border-gray-200 p-4">
                      <Text className="mb-2 text-sm font-medium text-text-dark">
                        Para continuar, digite <Text className="font-bold text-error">DELETAR</Text>{' '}
                        abaixo:
                      </Text>
                      <TextInput
                        value={confirmText}
                        onChangeText={setConfirmText}
                        placeholder="Digite DELETAR"
                        className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-text-dark"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="characters"
                        editable={!isLoading}
                      />
                    </View>

                    <TouchableOpacity
                      onPress={handleNext}
                      disabled={!canProceed || isLoading}
                      className={`rounded-xl py-4 ${
                        canProceed && !isLoading ? 'bg-error' : 'bg-gray-300'
                      }`}>
                      <Text className="text-center text-base font-semibold text-white">
                        Continuar
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* Step 2: Senha */}
                    <View className="mb-4 rounded-xl bg-red-50 p-4">
                      <View className="flex-row items-center">
                        <Ionicons name="lock-closed" size={24} color="#ef4444" />
                        <Text className="ml-2 text-base font-bold text-error">
                          Confirmação Final
                        </Text>
                      </View>
                    </View>

                    <Text className="mb-6 text-base text-text-dark">
                      Para confirmar a exclusão da sua conta, digite sua senha abaixo:
                    </Text>

                    <View className="mb-6">
                      <Text className="mb-2 text-sm font-medium text-text-dark">Senha</Text>
                      <View className="relative">
                        <TextInput
                          value={password}
                          onChangeText={setPassword}
                          placeholder="Digite sua senha"
                          secureTextEntry={!showPassword}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-base text-text-dark"
                          placeholderTextColor="#94a3b8"
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!isLoading}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3"
                          disabled={isLoading}>
                          <Ionicons
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={24}
                            color="#64748b"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View className="mb-6 rounded-xl bg-amber-50 p-4">
                      <View className="flex-row">
                        <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                        <Text className="ml-2 flex-1 text-sm text-amber-900">
                          Após confirmar, você será desconectado imediatamente e não poderá mais
                          acessar sua conta.
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={handleConfirm}
                      disabled={!password.trim() || isLoading}
                      className={`rounded-xl py-4 ${
                        password.trim() && !isLoading ? 'bg-error' : 'bg-gray-300'
                      }`}>
                      {isLoading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text className="text-center text-base font-semibold text-white">
                          Confirmar Exclusão
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleClose}
                      disabled={isLoading}
                      className="mt-3 rounded-xl border border-gray-300 bg-white py-4">
                      <Text className="text-center text-base font-medium text-text-dark">
                        Cancelar
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default DeleteAccountModal;
