import { useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNotification } from '../components';
import AuthButton from '../components/auth/AuthButton';
import AuthInput from '../components/auth/AuthInput';
import Logo from '../components/auth/Logo';
import { validatePassword } from '../services/auth/utils';

export default function ResetPasswordScreen() {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { showError, showSuccess } = useNotification();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Se não houver email, volta para o início do fluxo
    if (!email && isLoaded) {
      router.replace('/(auth)/forgot-password');
      return;
    }

    // Entrada animada
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
  }, [email, isLoaded]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) {
      newErrors.code = 'Código de verificação é obrigatório';
    } else if (code.trim().length !== 6) {
      newErrors.code = 'Código deve ter 6 dígitos';
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      newErrors.newPassword = passwordValidation.message || 'Senha inválida';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não conferem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field: string, value: string) => {
    if (field === 'code') setCode(value);
    else if (field === 'newPassword') setNewPassword(value);
    else if (field === 'confirmPassword') setConfirmPassword(value);

    // Limpar erro do campo quando o usuário digitar
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleResetPassword = async () => {
    if (!validateForm() || !isLoaded) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password: newPassword.trim(),
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        showSuccess('Senha redefinida com sucesso!');
        router.replace('/(root)/(tabs)');
      } else {
        console.error('Status inesperado ao resetar senha:', JSON.stringify(result, null, 2));
        showError('Status inesperado ao redefinir senha.');
      }
    } catch (err: any) {
      console.error('Erro ao resetar senha Clerk:', JSON.stringify(err, null, 2));
      const firstError = err.errors?.[0];

      let errorMessage = 'Erro ao redefinir senha.';

      if (firstError?.code === 'form_code_incorrect') {
        errorMessage = 'Código de verificação inválido ou expirado.';
      } else if (firstError?.code === 'form_password_pwned') {
        errorMessage = 'Esta senha foi encontrada em vazamentos de dados. Use uma senha diferente.';
      } else if (firstError?.code === 'form_password_not_strong_enough') {
        errorMessage =
          'Senha muito fraca. Use pelo menos 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 especial.';
      } else if (firstError?.longMessage || firstError?.message) {
        errorMessage = firstError.longMessage || firstError.message;
      }

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
    <SafeAreaView className="flex-1" edges={Platform.OS === 'ios' ? ['top'] : ['top', 'bottom']}>
      <StatusBar
        style="dark"
        backgroundColor={Platform.OS === 'android' ? '#f8f9fb' : 'transparent'}
        translucent={Platform.OS === 'android'}
      />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#f8f9fb', '#e8eef7', '#f1f5f9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
        style={{
          top: 0,
        }}
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
            className="h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white/80"
            style={{}}>
            <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Logo size="sm" animated={false} showText={false} />
          </View>

          <View className="h-12 w-12" />
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
                <Ionicons name="lock-closed-outline" size={32} color="#18cb96" />
              </View>
              <Text className="text-center text-3xl font-bold tracking-tight text-gray-900">
                Nova Senha
              </Text>
              <Text className="mt-2 text-center text-base font-normal text-gray-600">
                Digite o código e defina sua nova senha
              </Text>
              <Text className="mt-1 text-center text-sm font-medium text-gray-500">
                Código enviado para: {email}
              </Text>
            </Animated.View>
          </View>

          {/* Form Section */}
          <Animated.View
            className="mx-5 mb-8 rounded-3xl border border-white/20 bg-white/95 p-6 shadow-xl"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}>
            <View className="mb-6 items-center">
              <Text className="text-center text-2xl font-bold tracking-tight text-gray-900">
                Redefinir Senha
              </Text>
              <Text className="mt-2 text-center text-base font-normal text-gray-700">
                Complete o processo de recuperação
              </Text>
            </View>
            <View style={{ gap: 20 }}>
              <AuthInput
                label="Código de Verificação"
                placeholder="Digite o código de 6 dígitos"
                value={code}
                onChangeText={(text) => updateField('code', text)}
                error={errors.code}
                required
                autoFocus
                keyboardType="number-pad"
                maxLength={6}
                leftIcon="mail-outline"
              />
              <AuthInput
                label="Nova Senha"
                placeholder="Crie uma senha segura"
                value={newPassword}
                onChangeText={(text) => updateField('newPassword', text)}
                error={errors.newPassword}
                required
                helperText="Mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 especial"
                secureTextEntry
                showPasswordStrength
                leftIcon="lock-closed"
              />
              <AuthInput
                label="Confirmar Nova Senha"
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChangeText={(text) => updateField('confirmPassword', text)}
                error={errors.confirmPassword}
                required
                secureTextEntry
                leftIcon="lock-closed"
              />
            </View>
            <View className="mt-7">
              <AuthButton
                title="Redefinir Senha"
                onPress={handleResetPassword}
                loading={isLoading}
                disabled={!code || !newPassword || !confirmPassword}
                leftIcon="checkmark-circle-outline"
              />
            </View>
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
            <View className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
              <View className="flex-row items-center">
                <View className="mr-3 h-8 w-8 items-center justify-center rounded-2xl bg-green-100">
                  <Ionicons name="shield-checkmark" size={16} color="#34C759" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900">Senha Segura</Text>
                  <Text className="mt-0.5 text-xs text-gray-700">
                    Sua nova senha será criptografada e protegida
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
