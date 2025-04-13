import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLogin } from '../../hooks/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading } = useLogin();
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

    if (!password.trim()) {
      showToast('Por favor, informe sua senha', 'error');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await login(email.trim(), password.trim());
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : 'Erro ao fazer login. Verifique seus dados e tente novamente.';
      showToast(errorMessage, 'error');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <ScrollView className="flex-1">
        <View className="px-6 py-8">
          <View className="mb-8">
            <Text className="mb-2 text-3xl font-bold text-primary">Entrar</Text>
            <Text className="text-text-light">Faça login para gerenciar seus plantões</Text>
          </View>

          <View className="mb-4">
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

          <View className="mb-6">
            <Text className="mb-1 text-sm font-medium text-text-light">Senha</Text>
            <View className="flex-row items-center rounded-lg border border-gray-300 px-3 py-2">
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#666"
                style={{ marginRight: 8 }}
              />
              <TextInput
                className="flex-1 text-text-dark"
                placeholder="Sua senha"
                value={password}
                onChangeText={setPassword}
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

          <Button
            variant="primary"
            loading={isLoading}
            onPress={handleLogin}
            fullWidth
            className="mb-4">
            Entrar
          </Button>

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} className="mb-6">
            <Text className="text-center font-medium text-primary">Esqueceu sua senha?</Text>
          </TouchableOpacity>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-text-light">Não possui uma conta? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text className="font-medium text-primary">Criar conta</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
