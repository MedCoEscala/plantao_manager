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

    // Validação simples de email
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
            <View className="my-6 items-center">
              <Ionicons name="mail-outline" size={64} color="#4F46E5" />
              <Text className="mt-4 text-center text-text-dark">
                Verifique seu email e siga as instruções para redefinir sua senha.
              </Text>

              <Button
                variant="outline"
                onPress={() => router.push('/(auth)/login')}
                fullWidth
                className="mt-8">
                Voltar para login
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
