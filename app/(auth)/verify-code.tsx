import { useSignUp, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Logo from '../components/auth/Logo';

import AuthButton from '@/components/auth/AuthButton';
import CodeInput from '@/components/auth/CodeInput';
import { useToast } from '@/components/ui/Toast';
import apiClient from '@/lib/axios';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function VerifyCodeScreen() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { isLoaded, signUp, setActive } = useSignUp();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{
    email: string;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    gender?: string;
    phoneNumber?: string;
  }>();
  const router = useRouter();
  const { showToast } = useToast();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!params.email) {
      showToast('Email não fornecido para verificação.', 'error');
      router.replace('/(auth)/sign-up');
      return;
    }

    // Entrance animation
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
    ]).start();

    // Start countdown for resend
    setCountdown(60);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    // Pulse animation for the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleCodeComplete = async (verificationCode: string) => {
    await handleVerifyCodeAndSync(verificationCode);
  };

  const handleVerifyCodeAndSync = async (verificationCode?: string) => {
    if (!isLoaded) return;

    const codeToVerify = verificationCode || code;
    if (!codeToVerify || codeToVerify.length !== 6) {
      setError('Por favor, insira o código de 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError('');

    let sessionActivated = false;
    let token: string | null = null;

    try {
      // 1. Verificar o código
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: codeToVerify,
      });

      if (completeSignUp.status !== 'complete') {
        throw new Error('Falha na verificação do código.');
      }

      // 2. Ativar sessão e obter token
      await setActive({ session: completeSignUp.createdSessionId });
      sessionActivated = true;
      token = await getToken();

      if (!token) {
        throw new Error('Falha ao obter token de autenticação.');
      }

      // 3. Sincronização Básica
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      try {
        console.log('🔄 [1/2] Sincronização básica do usuário...');
        await apiClient.post('/users/sync', {}, authHeader);
        console.log('✅ [1/2] Sincronização básica concluída.');
      } catch (syncError) {
        console.error('❌ Erro na sincronização básica:', syncError);
        showToast('Erro na sincronização inicial. Tente novamente.', 'error');
      }

      // 4. Atualização do Perfil
      const profileData: { [key: string]: string | undefined } = {};
      if (params.firstName) profileData.firstName = params.firstName;
      if (params.lastName) profileData.lastName = params.lastName;
      if (params.birthDate) profileData.birthDate = params.birthDate;
      if (params.gender) profileData.gender = params.gender;
      if (params.phoneNumber) profileData.phoneNumber = params.phoneNumber;

      if (Object.keys(profileData).length > 0) {
        try {
          console.log('🔄 [2/2] Atualizando perfil com dados adicionais...', profileData);
          await apiClient.patch('/users/me', profileData, authHeader);
          console.log('✅ [2/2] Atualização do perfil concluída.');
        } catch (updateError) {
          console.error('❌ Erro ao atualizar perfil:', updateError);
          showToast(
            'Erro ao salvar dados do perfil. Você pode atualizá-los mais tarde.',
            'warning'
          );
        }
      }

      // 5. Redirecionamento Final
      showToast('Conta verificada com sucesso!', 'success');
      router.replace('/(root)/profile');
    } catch (err: any) {
      console.error('Erro no fluxo de verificação:', err);
      const firstError = err.errors?.[0];
      let errorMessage =
        firstError?.longMessage || firstError?.message || err.message || 'Ocorreu um erro.';

      if (firstError?.code === 'form_code_incorrect') {
        errorMessage = 'Código inválido ou expirado';
      } else if (firstError?.code === 'verification_expired') {
        errorMessage = 'Código expirado. Solicite um novo código';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || resendLoading || countdown > 0) return;

    setResendLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      showToast('Novo código enviado!', 'success');
      setCountdown(60);
      setError('');
    } catch (err: any) {
      console.error('Erro ao reenviar código:', err);
      showToast('Erro ao enviar novo código. Tente novamente.', 'error');
    } finally {
      setResendLoading(false);
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
        {/* Header with Back Button */}
        <View className="flex-row items-center justify-between px-5 pt-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-gray-200">
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Logo size="sm" animated={false} showText={false} />
          </View>

          <View className="h-11 w-11" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header Section */}
          <View className="flex-1 items-center justify-center px-6 pt-5">
            <Animated.View className="items-center" style={{ opacity: fadeAnim }}>
              <Animated.View
                className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary/10"
                style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons name="mail-open-outline" size={32} color="#18cb96" />
              </Animated.View>
              <Text className="text-center text-3xl font-bold tracking-tight text-gray-900">
                Verificar Email
              </Text>
              <Text className="mt-2 text-center text-base font-normal text-gray-600">
                Digite o código de 6 dígitos enviado para:
              </Text>
              <Text className="mt-1 text-center text-lg font-semibold text-primary">
                {params.email}
              </Text>
            </Animated.View>
          </View>

          {/* Form Section */}
          <Animated.View
            className="mx-5 mb-8 rounded-3xl border border-white/30 bg-white/90 p-7 shadow-xl"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              minHeight: SCREEN_HEIGHT * 0.45,
            }}>
            {/* Form Title */}
            <View className="mb-6 items-center">
              <Text className="text-center text-2xl font-bold tracking-tight text-gray-900">
                Código de Verificação
              </Text>
              <Text className="mt-2 text-center text-base font-normal text-gray-700">
                Insira o código recebido em seu email
              </Text>
            </View>

            {/* Code Input */}
            <View className="mb-6">
              <CodeInput
                length={6}
                value={code}
                onChangeText={setCode}
                onComplete={handleCodeComplete}
                error={error}
              />
            </View>

            {/* Verify Button */}
            <View className="mb-4">
              <AuthButton
                title="Verificar Código"
                onPress={() => handleVerifyCodeAndSync()}
                loading={isLoading}
                disabled={code.length !== 6}
                leftIcon="checkmark-circle-outline"
              />
            </View>

            {/* Resend Code */}
            <View className="items-center">
              {countdown > 0 ? (
                <Text className="text-base text-gray-500">Enviar novamente em {countdown}s</Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResendCode}
                  disabled={resendLoading}
                  className="py-3">
                  <Text className="text-base font-semibold text-primary">
                    {resendLoading ? 'Enviando...' : 'Reenviar código'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Security Note */}
            <View className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
              <View className="flex-row items-center">
                <View className="mr-3 h-8 w-8 items-center justify-center rounded-2xl bg-green-100">
                  <Ionicons name="shield-checkmark" size={16} color="#34C759" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900">Código Seguro</Text>
                  <Text className="mt-0.5 text-xs text-gray-700">
                    O código expira em 10 minutos por segurança
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
