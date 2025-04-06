import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { usePasswordReset } from '../../hooks/auth/usePasswordReset';

export default function ResetPasswordScreen() {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { resetPassword, isLoading } = usePasswordReset();
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams();
  const email = params.email as string;

  if (!email) {
    router.replace('/(auth)/forgot-password');
    return null;
  }

  const validateForm = () => {
    if (!code.trim()) {
      showToast('Por favor, informe o código de verificação', 'error');
      return false;
    }

    if (!newPassword.trim()) {
      showToast('Por favor, informe a nova senha', 'error');
      return false;
    }

    if (newPassword.length < 6) {
      showToast('A senha deve ter pelo menos 6 caracteres', 'error');
      return false;
    }

    if (newPassword !== confirmPassword) {
      showToast('As senhas não conferem', 'error');
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await resetPassword(code.trim(), newPassword.trim());
      showToast('Senha redefinida com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      showToast('Erro ao redefinir senha. Verifique o código e tente novamente.', 'error');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <ScrollView className="flex-1">
        <View className="px-6 py-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4 h-10 w-10 items-center justify-center">
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View className="mb-8">
            <Text className="mb-2 text-3xl font-bold text-primary">Redefinir Senha</Text>
            <Text className="text-text-light">
              Digite o código enviado para {email} e defina sua nova senha
            </Text>
          </View>

          <View className="mb-4">
            <Input
              label="Código de Verificação"
              placeholder="Digite o código recebido por email"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              fullWidth
            />
          </View>

          <View className="mb-4">
            <Text className="mb-1 text-sm font-medium text-text-light">Nova Senha</Text>
            <View className="flex-row items-center rounded-lg border border-gray-300 px-3 py-2">
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#666"
                style={{ marginRight: 8 }}
              />
              <TextInput
                className="flex-1 text-text-dark"
                placeholder="Nova senha"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-6">
            <Text className="mb-1 text-sm font-medium text-text-light">Confirmar Senha</Text>
            <View className="flex-row items-center rounded-lg border border-gray-300 px-3 py-2">
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#666"
                style={{ marginRight: 8 }}
              />
              <TextInput
                className="flex-1 text-text-dark"
                placeholder="Confirme a nova senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <Button
            variant="primary"
            loading={isLoading}
            onPress={handleResetPassword}
            fullWidth
            className="mb-4">
            Redefinir Senha
          </Button>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-text-light">Lembrou sua senha? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
              <Text className="font-medium text-primary">Entrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
