import { useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';

import AuthButton from '../components/auth/AuthButton';
import AuthInput from '../components/auth/AuthInput';
import Logo from '../components/auth/Logo';
import AuthScreenWrapper from '../components/ui/AuthScreenWrapper';
import { useToast } from '../components/ui/Toast';

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
      pathname: '/reset-password',
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
      <View className="flex-1 px-5 pt-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white/80"
            style={{}}>
            <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Logo size="sm" animated={false} showText={false} />
          </View>
          <View className="h-11 w-11" />
        </View>

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
      </View>

      <View className="px-5 pb-5">
        <Animated.View
          className="rounded-3xl border border-white/20 bg-white/95 p-6 shadow-xl"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}>
          {!isSubmitted ? (
            <>
              <View className="mb-6 items-center">
                <Text className="text-center text-2xl font-bold tracking-tight text-gray-900">
                  Recuperar Senha
                </Text>
                <Text className="mt-2 text-center text-base font-normal text-gray-700">
                  Informe seu email para receber as instruções
                </Text>
              </View>
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
              <AuthButton
                title="Enviar Código"
                onPress={handleRequestReset}
                loading={isLoading}
                leftIcon="mail-outline"
              />
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
              <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <Ionicons name="checkmark-circle" size={48} color="#34C759" />
              </View>
              <Text className="text-center text-2xl font-bold tracking-tight text-gray-900">
                Código Enviado!
              </Text>
              <Text className="mb-8 mt-2 text-center text-base font-normal text-gray-700">
                Enviamos um código de recuperação para:
              </Text>
              <Text className="mb-8 text-center text-lg font-semibold text-primary">{email}</Text>
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
      </View>
    </AuthScreenWrapper>
  );
}
