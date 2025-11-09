import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Platform, Animated } from 'react-native';

import { useNotification } from '../components';
import AuthButton from '../components/auth/AuthButton';
import AuthInput from '../components/auth/AuthInput';
import Logo from '../components/auth/Logo';
import AuthScreenWrapper from '../components/ui/AuthScreenWrapper';
import apiClient from '../lib/axios';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { isLoaded, signIn, setActive } = useSignIn();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showError, showSuccess } = useNotification();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(300, [
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 8) {
      newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!isLoaded || isLoading) return;

    if (!validateForm()) {
      showError('Por favor, corrija os erros no formulário');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });

        const token = await getToken({ template: 'medescala' });
        if (token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        showSuccess('Login realizado com sucesso!');
        router.replace('/(root)/');
      } else {
        showError('Erro inesperado durante o login. Tente novamente.');
      }
    } catch (err: any) {
      console.error('Login error:', err);

      if (err.errors && err.errors.length > 0) {
        const errorMessage = err.errors[0].message;
        if (errorMessage.includes('password')) {
          setErrors({ password: 'Senha incorreta' });
        } else if (errorMessage.includes('identifier')) {
          setErrors({ email: 'Email não encontrado' });
        } else {
          showError(errorMessage);
        }
      } else {
        showError('Erro de conexão. Verifique sua internet e tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <AuthScreenWrapper showGradient={false}>
        <View className="flex-1 items-center justify-center">
          <Logo size="lg" />
          <Text className="mt-4 text-gray-900">Carregando...</Text>
        </View>
      </AuthScreenWrapper>
    );
  }

  return (
    <AuthScreenWrapper>
      <View className="flex-1 items-center justify-center px-6">
        <Animated.View
          style={{
            opacity: logoAnim,
            transform: [
              {
                scale: logoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          }}>
          <Logo size="lg" animated />
        </Animated.View>
      </View>

      <View className="px-5 pb-5">
        <Animated.View
          className="rounded-3xl border border-white/20 bg-white/95 p-6 shadow-xl"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}>
          <View className="mb-6 items-center">
            <Text className="text-center text-2xl font-bold tracking-tight text-gray-900">
              Faça seu login
            </Text>
            <Text className="mt-1.5 text-center text-base font-normal text-gray-700">
              Acesse sua conta do MedEscala
            </Text>
          </View>

          <View style={{ gap: 16 }}>
            <AuthInput
              label="Email"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              leftIcon="mail"
              autoFocus
            />

            <AuthInput
              label="Senha"
              placeholder="Digite sua senha"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
              leftIcon="lock-closed"
            />
          </View>

          <View className="mt-6 space-y-4">
            <AuthButton
              title="Entrar"
              onPress={handleLogin}
              loading={isLoading}
              leftIcon="log-in-outline"
            />

            <View className="items-center">
              <Link href="/(auth)/forgot-password" asChild>
                <Text className="text-base font-semibold text-primary underline">
                  Esqueci minha senha
                </Text>
              </Link>
            </View>

            <View className="items-center">
              <Text className="text-base text-gray-600">
                Não tem uma conta?{' '}
                <Link href="/(auth)/sign-up" asChild>
                  <Text className="text-base font-semibold text-primary underline">
                    Criar conta
                  </Text>
                </Link>
              </Text>
            </View>
          </View>

          <View className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
            <View className="flex-row items-center">
              <View className="mr-3 h-8 w-8 items-center justify-center rounded-2xl bg-green-100">
                <Ionicons name="shield-checkmark" size={16} color="#34C759" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">Seguro e Protegido</Text>
                <Text className="mt-1 text-xs text-gray-700">
                  Seus dados são protegidos com criptografia de ponta
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </AuthScreenWrapper>
  );
}
