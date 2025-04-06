import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { usePasswordReset } from '../../hooks/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { requestPasswordReset, isLoading } = usePasswordReset();
  const router = useRouter();
  const { showToast } = useToast();

  const validateForm = () => {
    if (!email.trim()) {
      showToast('Por favor, informe seu email', 'error');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast('Por favor, informe um email válido', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await requestPasswordReset(email.trim());
      setIsSubmitted(true);
      showToast('Instruções enviadas ao seu email', 'success');
    } catch (error) {
      showToast('Erro ao enviar instruções de redefinição', 'error');
    }
  };

  const handleContinueToReset = () => {
    router.push({
      pathname: '/(auth)/reset-password',
      params: { email: email.trim() },
    });
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
            <Text className="mb-2 text-3xl font-bold text-primary">Esqueceu sua senha?</Text>
            <Text className="text-text-light">
              {!isSubmitted
                ? 'Enviaremos instruções de redefinição para seu email'
                : 'Instruções enviadas! Verifique seu email'}
            </Text>
          </View>

          {!isSubmitted ? (
            <>
              <View className="mb-6">
                <Input
                  label="Email"
                  placeholder="Seu email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  fullWidth
                />
              </View>

              <Button
                variant="primary"
                loading={isLoading}
                onPress={handleSubmit}
                fullWidth
                className="mb-6">
                Enviar instruções
              </Button>
            </>
          ) : (
            <View className="my-6">
              <View className="mb-6 items-center">
                <Ionicons name="mail-outline" size={64} color="#4F46E5" />
                <Text className="mt-4 text-center text-text-dark">
                  Verifique seu email e siga as instruções para redefinir sua senha.
                </Text>
                <Text className="mt-2 text-center text-text-dark">
                  Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
                </Text>
              </View>

              <Button variant="primary" onPress={handleContinueToReset} fullWidth className="mb-4">
                Continuar para Redefinição
              </Button>

              <Button
                variant="outline"
                onPress={() => setIsSubmitted(false)}
                fullWidth
                className="mb-4">
                Tentar com outro email
              </Button>
            </View>
          )}

          <View className="mt-6 flex-row justify-center">
            <Text className="text-text-light">Lembrou sua senha? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
              <Text className="font-medium text-primary">Entrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
