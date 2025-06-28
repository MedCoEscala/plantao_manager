import { useSignIn } from '@clerk/clerk-expo';
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
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Logo from '../components/auth/Logo';

import AuthButton from '@/components/auth/AuthButton';
import AuthInput from '@/components/auth/AuthInput';
import { useToast } from '@/components/ui/Toast';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (isSubmitted) {
      Animated.spring(successAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [isSubmitted]);

  const validateForm = () => {
    if (!email.trim()) {
      setError('Por favor, informe seu email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Por favor, informe um email válido');
      return false;
    }
    setError('');
    return true;
  };

  const handleRequestReset = async () => {
    if (!validateForm() || !isLoaded) {
      return;
    }

    setIsLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      });
      setIsSubmitted(true);
      showToast('Instruções enviadas para seu email!', 'success');
    } catch (err: any) {
      console.error('Erro ao solicitar reset de senha Clerk:', JSON.stringify(err, null, 2));
      const firstError = err.errors?.[0];
      const errorMessage =
        firstError?.longMessage || firstError?.message || 'Erro ao solicitar recuperação de senha.';

      if (firstError?.code === 'form_identifier_not_found') {
        setError('Este email não está cadastrado.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToReset = () => {
    router.push({
      pathname: '/(auth)/reset-password',
      params: { email: email.trim() },
    });
  };

  const handleTryAgain = () => {
    setIsSubmitted(false);
    setEmail('');
    setError('');

    Animated.timing(successAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
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
    <SafeAreaView className="flex-1" edges={Platform.OS === 'ios' ? ['top'] : []}>
      <StatusBar style="dark" translucent={Platform.OS === 'android'} />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#f8f9fb', '#e8eef7', '#f1f5f9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        enabled
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
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          keyboardDismissMode="interactive">
          {/* Header Section */}
          <View className="flex-1 items-center justify-center px-6 pt-5">
            <Animated.View className="items-center" style={{ opacity: fadeAnim }}>
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Ionicons name="key-outline" size={32} color="#18cb96" />
              </View>
              <Text className="text-center text-3xl font-bold tracking-tight text-gray-900">
                {isSubmitted ? 'Email Enviado!' : 'Esqueceu sua senha?'}
              </Text>
              <Text className="mt-2 text-center text-base font-normal text-gray-600">
                {isSubmitted
                  ? 'Verifique sua caixa de entrada'
                  : 'Não se preocupe, vamos te ajudar a recuperar'}
              </Text>
            </Animated.View>
          </View>

          {/* Form Section */}
          <Animated.View
            className="mx-5 mb-8 rounded-3xl border border-white/30 bg-white/90 p-7 shadow-xl"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              minHeight: Platform.OS === 'android' ? 400 : undefined,
            }}>
            {!isSubmitted ? (
              <>
                {/* Form Title */}
                <View className="mb-6 items-center">
                  <Text className="text-center text-2xl font-bold tracking-tight text-gray-900">
                    Recuperar Senha
                  </Text>
                  <Text className="mt-2 text-center text-base font-normal text-gray-700">
                    Informe seu email para receber as instruções de recuperação
                  </Text>
                </View>

                {/* Email Input */}
                <View className="mb-6">
                  <AuthInput
                    label="Email"
                    placeholder="seu@email.com"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (error) setError('');
                    }}
                    error={error}
                    required
                    autoFocus
                    keyboardType="email-address"
                    leftIcon="mail"
                  />
                </View>

                {/* Send Code Button */}
                <AuthButton
                  title="Enviar Código"
                  onPress={handleRequestReset}
                  loading={isLoading}
                  leftIcon="mail-outline"
                />

                {/* Back to Login Link */}
                <View className="mt-6 items-center">
                  <Text className="text-base text-gray-600">
                    Lembrou sua senha?{' '}
                    <Link href="/(auth)/sign-in" asChild>
                      <Text className="text-base font-semibold text-primary underline">
                        Fazer login
                      </Text>
                    </Link>
                  </Text>
                </View>
              </>
            ) : (
              <Animated.View
                className="items-center"
                style={{
                  opacity: successAnim,
                  transform: [
                    {
                      scale: successAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                }}>
                {/* Success Icon */}
                <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <Ionicons name="checkmark-circle" size={48} color="#34C759" />
                </View>

                {/* Success Message */}
                <Text className="text-center text-2xl font-bold tracking-tight text-gray-900">
                  Código Enviado!
                </Text>
                <Text className="mb-8 mt-2 text-center text-base font-normal text-gray-700">
                  Enviamos um código de recuperação para:
                </Text>
                <Text className="mb-8 text-center text-lg font-semibold text-primary">{email}</Text>

                {/* Action Buttons */}
                <View className="w-full space-y-4">
                  <AuthButton
                    title="Continuar"
                    onPress={handleContinueToReset}
                    leftIcon="arrow-forward"
                  />

                  <TouchableOpacity onPress={handleTryAgain} className="items-center py-3">
                    <Text className="text-base font-medium text-gray-500">
                      Tentar com outro email
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Security Note */}
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
