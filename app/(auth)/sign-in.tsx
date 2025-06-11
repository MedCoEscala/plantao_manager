import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Logo from '../components/auth/Logo';

import { useNotification } from '@/components';
import AuthButton from '@/components/auth/AuthButton';
import AuthInput from '@/components/auth/AuthInput';
import apiClient from '@/lib/axios';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { isLoaded, signIn, setActive } = useSignIn();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showError, showSuccess } = useNotification();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
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
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Email inválido';
      }
    }

    if (!password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    console.log('[DEBUG] handleLogin called with:', {
      email: email ? '***' : 'empty',
      password: password ? '***' : 'empty',
      emailLength: email?.length || 0,
      passwordLength: password?.length || 0,
    });

    if (!validateForm() || !isLoaded) {
      console.log('[DEBUG] Form validation failed or Clerk not loaded');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[DEBUG] Attempting Clerk sign in...');

      const signInAttempt = await signIn.create({
        identifier: email.trim(),
        password: password.trim(),
      });

      console.log('[DEBUG] Sign in attempt result:', signInAttempt.status);

      if (signInAttempt.status === 'complete') {
        console.log('[DEBUG] Setting active session...');
        await setActive({ session: signInAttempt.createdSessionId });

        console.log('[DEBUG] Login successful, redirecting...');
        showSuccess('Login realizado com sucesso!');
        router.replace('/(root)/profile');
      } else {
        console.error(
          '[ERROR] Status inesperado do Clerk Sign In:',
          JSON.stringify(signInAttempt, null, 2)
        );
        showError('Status de login inesperado.');
      }
    } catch (err: any) {
      console.error('[ERROR] Erro de Login Clerk:', JSON.stringify(err, null, 2));
      const firstError = err.errors?.[0];

      let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';

      if (firstError?.code === 'form_identifier_not_found') {
        errorMessage = 'Email não cadastrado. Verifique o email ou cadastre-se.';
      } else if (firstError?.code === 'form_password_incorrect') {
        errorMessage = 'Senha incorreta. Tente novamente ou redefina sua senha.';
      } else if (firstError?.code === 'session_exists') {
        errorMessage = 'Você já está logado. Redirecionando...';
        router.replace('/(root)/profile');
        return;
      } else if (firstError?.longMessage || firstError?.message) {
        errorMessage = firstError.longMessage || firstError.message;
      }

      console.log('[DEBUG] Showing error to user:', errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Logo size="lg" />
          <Text className="mt-4 text-gray-900">Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <StatusBar style="dark" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#f8f9fb', '#e8eef7', '#f1f5f9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header Section */}
          <View className="flex-1 items-center justify-center px-6 pt-5">
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

            <Animated.View className="mt-8 items-center" style={{ opacity: fadeAnim }}>
              <Text className="text-center text-3xl font-bold tracking-tight text-gray-900">
                Bem-vindo de volta!
              </Text>
              <Text className="mt-2 text-center text-base font-normal text-gray-600">
                Entre na sua conta para continuar
              </Text>
            </Animated.View>
          </View>

          {/* Form Section */}
          <Animated.View
            className="mx-5 mb-8 rounded-3xl border border-white/30 bg-white/90 p-7 shadow-xl"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              minHeight: SCREEN_HEIGHT * 0.5,
            }}>
            {/* Welcome Message */}
            <View className="mb-7 items-center">
              <Text className="text-center text-3xl font-bold tracking-tight text-gray-900">
                Entrar
              </Text>
              <Text className="mt-2 text-center text-base font-normal text-gray-700">
                Acesse sua conta de forma segura
              </Text>
            </View>

            {/* Form Fields */}
            <View className="space-y-5">
              <AuthInput
                label="Email"
                placeholder="seu@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                error={errors.email}
                required
                autoFocus
                keyboardType="email-address"
                leftIcon="mail"
              />

              <AuthInput
                label="Senha"
                placeholder="Sua senha"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                error={errors.password}
                required
                secureTextEntry
                leftIcon="lock-closed"
              />
            </View>

            {/* Forgot Password Link */}
            <View className="mt-5 items-end">
              <Link href="/(auth)/forgot-password" asChild>
                <Text className="text-sm font-semibold text-primary underline">
                  Esqueci minha senha
                </Text>
              </Link>
            </View>

            {/* Login Button */}
            <View className="mt-7">
              <AuthButton
                title="Entrar"
                onPress={handleLogin}
                loading={isLoading}
                leftIcon="log-in-outline"
              />
            </View>

            {/* Divider */}
            <View className="my-7 flex-row items-center">
              <View className="h-px flex-1 bg-gray-300" />
              <Text className="mx-4 text-sm font-medium text-gray-500">ou</Text>
              <View className="h-px flex-1 bg-gray-300" />
            </View>

            {/* Sign Up Link */}
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

            {/* Additional Info */}
            <View className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
              <View className="flex-row items-center">
                <View className="mr-3 h-8 w-8 items-center justify-center rounded-2xl bg-green-100">
                  <Ionicons name="shield-checkmark" size={16} color="#34C759" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900">Seguro e Protegido</Text>
                  <Text className="mt-0.5 text-xs text-gray-700">
                    Seus dados são protegidos com criptografia de ponta
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
