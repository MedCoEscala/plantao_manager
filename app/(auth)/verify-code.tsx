import { useSignUp, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const mountedRef = useRef(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    mountedRef.current = true;

    if (!params.email) {
      showToast('Email não fornecido para verificação.', 'error');
      router.replace('/(auth)/sign-up');
      return;
    }

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

    setCountdown(60);

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && mountedRef.current) {
      timer = setTimeout(() => {
        if (mountedRef.current) {
          setCountdown(countdown - 1);
        }
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    // Pulse animation for the icon
    const animation = Animated.loop(
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
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  const handleCodeComplete = useCallback(
    async (verificationCode: string) => {
      // Evita múltiplas chamadas simultâneas
      if (isLoading || !mountedRef.current) return;
      await handleVerifyCodeAndSync(verificationCode);
    },
    [isLoading]
  );

  const handleVerifyCodeAndSync = async (verificationCode?: string) => {
    if (!isLoaded || !mountedRef.current) return;

    const codeToVerify = verificationCode || code;
    console.log('🔐 [VerifyCode] Iniciando verificação com código:', {
      codeLength: codeToVerify?.length || 0,
      hasCode: !!codeToVerify,
      isLoaded,
      isMounted: mountedRef.current,
    });

    if (!codeToVerify || codeToVerify.length !== 6) {
      console.log('❌ [VerifyCode] Código inválido');
      setError('Por favor, insira o código de 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('📧 [VerifyCode] Verificando código no Clerk...');

      // 1. Verificar o código
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: codeToVerify,
      });

      if (!mountedRef.current) return;

      console.log('✅ [VerifyCode] Resultado da verificação:', completeSignUp.status);

      if (completeSignUp.status !== 'complete') {
        throw new Error('Falha na verificação do código.');
      }

      console.log('🎉 [VerifyCode] Código verificado com sucesso');

      // 2. Ativar sessão e obter token
      console.log('🔑 [VerifyCode] Ativando sessão...');
      await setActive({ session: completeSignUp.createdSessionId });

      if (!mountedRef.current) return;

      console.log('🎫 [VerifyCode] Obtendo token de autenticação...');
      const token = await getToken();

      if (!token) {
        throw new Error('Falha ao obter token de autenticação.');
      }

      console.log('✅ [VerifyCode] Token obtido com sucesso');

      // 3. Sincronização básica primeiro (garantir que o usuário existe no DB)
      console.log('🔄 [VerifyCode] Iniciando sincronização básica...');

      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      try {
        await apiClient.post('/users/sync', {}, authHeader);
        console.log('✅ [VerifyCode] Sincronização básica concluída');
      } catch (syncError: any) {
        console.error('❌ [VerifyCode] Erro na sincronização básica:', syncError);
        throw new Error('Falha na sincronização inicial');
      }

      // 4. Aguardar um pouco para garantir processamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 5. Atualizar com dados adicionais se fornecidos
      const hasAdditionalData =
        params.firstName ||
        params.lastName ||
        params.birthDate ||
        params.gender ||
        params.phoneNumber;

      if (hasAdditionalData && mountedRef.current) {
        console.log('📝 [VerifyCode] Atualizando com dados adicionais...');

        const profileData: any = {};

        if (params.firstName?.trim()) {
          profileData.firstName = params.firstName.trim();
        }
        if (params.lastName?.trim()) {
          profileData.lastName = params.lastName.trim();
        }
        if (params.birthDate) {
          profileData.birthDate = params.birthDate;
        }
        if (params.gender) {
          profileData.gender = params.gender;
        }
        if (params.phoneNumber?.trim()) {
          profileData.phoneNumber = params.phoneNumber.trim();
        }

        console.log('📊 [VerifyCode] Dados do perfil a serem enviados:', profileData);

        try {
          await apiClient.patch('/users/me', profileData, authHeader);
          console.log('✅ [VerifyCode] Dados adicionais atualizados com sucesso');
        } catch (updateError: any) {
          console.error('⚠️ [VerifyCode] Erro ao atualizar dados adicionais:', updateError);
          // Não falhar o fluxo por causa dos dados adicionais
          if (mountedRef.current) {
            showToast('Conta criada! Alguns dados serão atualizados no seu perfil.', 'success');
          }
        }
      }

      // 6. Aguardar mais um pouco para garantir que tudo foi processado
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 7. Redirecionamento final
      if (mountedRef.current) {
        console.log('🎯 [VerifyCode] Redirecionando para o app...');
        showToast('Conta verificada com sucesso!', 'success');
        router.replace('/(root)/(tabs)');
      }
    } catch (err: any) {
      console.error('❌ [VerifyCode] Erro no fluxo de verificação:', err);

      if (!mountedRef.current) return;

      const firstError = err.errors?.[0];
      let errorMessage =
        firstError?.longMessage || firstError?.message || err.message || 'Ocorreu um erro.';

      if (firstError?.code === 'form_code_incorrect') {
        errorMessage = 'Código inválido ou expirado';
      } else if (firstError?.code === 'verification_expired') {
        errorMessage = 'Código expirado. Solicite um novo código';
      } else if (err.message?.includes('sincronização')) {
        errorMessage = 'Erro na sincronização de dados. Tente fazer login novamente.';
      }

      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || resendLoading || countdown > 0 || !mountedRef.current) return;

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

      <LinearGradient
        colors={['#f8f9fb', '#e8eef7', '#f1f5f9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
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

          <Animated.View
            className="mx-5 mb-8 rounded-3xl border border-white/30 bg-white/90 p-7 shadow-xl"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              minHeight: SCREEN_HEIGHT * 0.45,
            }}>
            <View className="mb-6 items-center">
              <Text className="text-center text-2xl font-bold tracking-tight text-gray-900">
                Código de Verificação
              </Text>
              <Text className="mt-2 text-center text-base font-normal text-gray-700">
                Insira o código recebido em seu email
              </Text>
            </View>

            <View className="mb-6">
              <CodeInput
                length={6}
                value={code}
                onChangeText={setCode}
                onComplete={handleCodeComplete}
                error={error}
              />
            </View>

            <View className="mb-4">
              <AuthButton
                title="Verificar Código"
                onPress={() => handleVerifyCodeAndSync()}
                loading={isLoading}
                disabled={code.length !== 6}
                leftIcon="checkmark-circle-outline"
              />
            </View>

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
