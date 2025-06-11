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
    console.log('[DEBUG] handleVerifyCodeAndSync called with:', {
      codeLength: codeToVerify?.length || 0,
      hasCode: !!codeToVerify,
      isLoaded,
      isMounted: mountedRef.current,
    });

    if (!codeToVerify || codeToVerify.length !== 6) {
      console.log('[DEBUG] Invalid code format');
      setError('Por favor, insira o código de 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('[DEBUG] Iniciando verificação de código...');

      // 1. Verificar o código
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: codeToVerify,
      });

      if (!mountedRef.current) return;

      console.log('[DEBUG] Clerk verification result:', completeSignUp.status);

      if (completeSignUp.status !== 'complete') {
        throw new Error('Falha na verificação do código.');
      }

      console.log('[SUCCESS] Código verificado com sucesso');

      // 2. Ativar sessão e obter token
      console.log('[DEBUG] Ativando sessão...');
      await setActive({ session: completeSignUp.createdSessionId });

      if (!mountedRef.current) return;

      console.log('[DEBUG] Obtendo token de autenticação...');
      const token = await getToken();

      if (!token) {
        throw new Error('Falha ao obter token de autenticação.');
      }

      console.log('[SUCCESS] Token de autenticação obtido');

      // 3. Preparar dados do perfil para sincronização
      const profileData: any = {};
      if (params.firstName) profileData.firstName = params.firstName;
      if (params.lastName) profileData.lastName = params.lastName;
      if (params.birthDate) profileData.birthDate = params.birthDate;
      if (params.gender) profileData.gender = params.gender;
      if (params.phoneNumber) profileData.phoneNumber = params.phoneNumber;

      console.log('[DEBUG] Profile data to sync:', profileData);

      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      // 4. Sincronização com aguardo de estabilização
      try {
        console.log('[DEBUG] Iniciando sincronização com backend...');

        // Primeiro faz a sincronização básica com retry
        let syncAttempts = 0;
        const maxSyncAttempts = 3;
        let syncSuccess = false;

        while (syncAttempts < maxSyncAttempts && !syncSuccess) {
          try {
            console.log(
              `[DEBUG] Tentativa de sincronização ${syncAttempts + 1}/${maxSyncAttempts}`
            );

            const syncResponse = await apiClient.post('/users/sync', {}, authHeader);
            console.log('[SUCCESS] Sincronização básica concluída:', syncResponse.status);
            syncSuccess = true;
          } catch (syncErr: any) {
            syncAttempts++;
            console.log(
              `[WARN] Falha na tentativa ${syncAttempts}:`,
              syncErr.response?.status || syncErr.message
            );

            if (syncAttempts < maxSyncAttempts) {
              console.log(`[DEBUG] Aguardando antes da próxima tentativa...`);
              await new Promise((resolve) => setTimeout(resolve, 1500));
            } else {
              throw syncErr;
            }
          }
        }

        // Aguarda um pouco para garantir que a sincronização foi processada
        console.log('[DEBUG] Aguardando processamento da sincronização...');
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Se tem dados adicionais, atualiza o perfil
        if (Object.keys(profileData).length > 0 && mountedRef.current) {
          console.log('[DEBUG] Atualizando perfil com dados adicionais...');

          try {
            const updateResponse = await apiClient.patch('/users/me', profileData, authHeader);
            console.log('[SUCCESS] Perfil atualizado com dados adicionais:', updateResponse.status);
          } catch (updateError: any) {
            console.error(
              '[WARN] Erro ao atualizar dados adicionais:',
              updateError.response?.status || updateError.message
            );
            // Não falha o fluxo se os dados adicionais não foram salvos
            if (mountedRef.current) {
              showToast('Conta criada! Alguns dados podem ser atualizados no perfil.', 'success');
            }
          }
        }
      } catch (syncError: any) {
        console.error(
          '[ERROR] Erro na sincronização:',
          syncError.response?.status || syncError.message
        );

        // Se for erro de autenticação, pode ser problema temporário
        if (syncError.response?.status === 401 || syncError.response?.status === 500) {
          console.log(
            '[WARN] Erro temporário na sincronização, usuário será criado no primeiro acesso'
          );
          if (mountedRef.current) {
            showToast(
              'Conta verificada! Alguns dados serão sincronizados no primeiro acesso.',
              'success'
            );
          }
        } else {
          // Para outros erros, mostra aviso mas não falha o fluxo
          if (mountedRef.current) {
            showToast('Conta verificada! Você pode completar seu perfil depois.', 'success');
          }
        }
      }

      // 5. Redirecionamento final
      if (mountedRef.current) {
        showToast('Conta verificada com sucesso!', 'success');
        router.replace('/(root)/(tabs)');
      }
    } catch (err: any) {
      console.error('❌ Erro no fluxo de verificação:', err);

      if (!mountedRef.current) return;

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
