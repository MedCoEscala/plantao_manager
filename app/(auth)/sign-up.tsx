import { useSignUp, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
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
  Dimensions,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import Logo from '../components/auth/Logo';

import { useNotification } from '@/components';
import AuthButton from '@/components/auth/AuthButton';
import AuthInput from '@/components/auth/AuthInput';
import { validatePassword } from '@/services/auth/utils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const GENDER_OPTIONS = [
  { value: 'Masculino', label: 'Masculino', icon: 'male' },
  { value: 'Feminino', label: 'Feminino', icon: 'female' },
  { value: 'Outro', label: 'Outro', icon: 'transgender' },
  { value: 'Não informado', label: 'Prefiro não dizer', icon: 'help-circle' },
];

export default function SignUpScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    birthDate: null as Date | null,
    gender: '',
    phoneNumber: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const { isLoaded, signUp } = useSignUp();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showInfo, showError } = useNotification();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

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
    Animated.spring(stepAnim, {
      toValue: currentStep,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Nome é obrigatório';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Sobrenome é obrigatório';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Email inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message || 'Senha inválida';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password.trim() !== formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'As senhas não conferem';
    }

    if (formData.phoneNumber.trim() && !/^[\d\s\-\(\)]+$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Formato de telefone inválido';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;

    console.log('🔍 [Validação Step 2]', {
      passwordLength: formData.password.length,
      confirmPasswordLength: formData.confirmPassword.length,
      passwordsMatch: formData.password === formData.confirmPassword,
      isValid,
      errors: newErrors,
    });

    return isValid;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      const isStep1Valid = validateStep1();
      if (isStep1Valid) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      const isStep2Valid = validateStep2();
      if (isStep2Valid) {
        handleSubmit();
      } else {
        console.warn('❌ [Signup] Validação step 2 falhou, não prosseguindo');
        showError('Por favor, corrija os erros antes de continuar');
        return;
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!isLoaded) return;

    console.log('🚀 [Signup] Iniciando handleSubmit...');

    const isStep1Valid = validateStep1();
    const isStep2Valid = validateStep2();

    if (!isStep1Valid || !isStep2Valid) {
      console.error('❌ [Signup] Validação final falhou', {
        step1: isStep1Valid,
        step2: isStep2Valid,
        errors,
      });
      showError('Por favor, corrija todos os erros antes de continuar');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📧 [Signup] Criando conta no Clerk...');

      const signUpResult = await signUp.create({
        emailAddress: formData.email.trim(),
        password: formData.password.trim(),
      });

      console.log('✅ [Signup] Conta criada no Clerk, preparando verificação...');

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      showInfo('Código de verificação enviado!');

      const birthDateString = formData.birthDate ? format(formData.birthDate, 'yyyy-MM-dd') : '';

      console.log('🔄 [Signup] Navegando para verificação com dados:', {
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        hasPhoneNumber: !!formData.phoneNumber.trim(),
        hasGender: !!formData.gender,
        hasBirthDate: !!birthDateString,
      });

      const cleanFirstName = formData.firstName.trim();
      const cleanLastName = formData.lastName.trim();
      const cleanPhoneNumber = formData.phoneNumber.trim();
      const cleanGender = formData.gender || '';

      console.log('✅ [Signup] Dados limpos para envio:', {
        firstName: cleanFirstName,
        lastName: cleanLastName,
        phoneNumber: cleanPhoneNumber,
        gender: cleanGender,
        birthDate: birthDateString,
      });

      router.push({
        pathname: '/(auth)/verify-code',
        params: {
          email: formData.email.trim(),
          firstName: cleanFirstName,
          lastName: cleanLastName,
          birthDate: birthDateString,
          gender: cleanGender,
          phoneNumber: cleanPhoneNumber,
        },
      });
    } catch (err: any) {
      console.error('❌ [Signup] Erro de Registro Clerk:', JSON.stringify(err, null, 2));
      const firstError = err.errors?.[0];

      if (firstError?.code === 'form_identifier_exists') {
        showError('Este email já está cadastrado. Tente fazer login ou usar outro email.');
      } else if (firstError?.code === 'form_password_pwned') {
        showError(
          'Esta senha foi encontrada em vazamentos de dados. Por segurança, use uma senha diferente.'
        );
      } else if (firstError?.code === 'form_password_not_strong_enough') {
        showError(
          'Senha muito fraca. Use pelo menos 8 caracteres com maiúscula, minúscula, número e caractere especial.'
        );
      } else if (firstError?.code === 'form_password_too_common') {
        showError('Esta senha é muito comum. Escolha uma senha mais única e segura.');
      } else if (firstError?.message?.includes('password')) {
        showError(
          `Erro na senha: ${firstError.message}. Certifique-se de usar pelo menos 8 caracteres com maiúscula, minúscula, número e caractere especial.`
        );
      } else {
        const errorMessage =
          firstError?.longMessage ||
          firstError?.message ||
          'Erro ao criar conta. Verifique os dados e tente novamente.';
        showError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View className="mb-6 flex-row items-center justify-center gap-2">
      {[1, 2].map((step) => (
        <View
          key={step}
          className={`h-1.5 w-7 rounded-sm ${step <= currentStep ? 'bg-primary' : 'bg-gray-300'}`}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View className="space-y-5">
      <AuthInput
        label="Nome"
        placeholder="Seu primeiro nome"
        value={formData.firstName}
        onChangeText={(text) => updateField('firstName', text)}
        error={errors.firstName}
        required
        autoFocus
        leftIcon="person-outline"
      />

      <AuthInput
        label="Sobrenome"
        placeholder="Seu sobrenome"
        value={formData.lastName}
        onChangeText={(text) => updateField('lastName', text)}
        error={errors.lastName}
        required
        leftIcon="person-outline"
      />

      <AuthInput
        label="Email"
        placeholder="seu@email.com"
        value={formData.email}
        onChangeText={(text) => updateField('email', text)}
        error={errors.email}
        required
        keyboardType="email-address"
        leftIcon="mail"
      />
    </View>
  );

  const renderStep2 = () => (
    <View className="space-y-5">
      <AuthInput
        label="Senha"
        placeholder="Crie uma senha segura"
        value={formData.password}
        onChangeText={(text) => updateField('password', text)}
        error={errors.password}
        required
        helperText="Mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 especial"
        secureTextEntry
        showPasswordStrength
        leftIcon="lock-closed"
      />

      <AuthInput
        label="Confirmar Senha"
        placeholder="Digite a senha novamente"
        value={formData.confirmPassword}
        onChangeText={(text) => updateField('confirmPassword', text)}
        error={errors.confirmPassword}
        required
        secureTextEntry
        leftIcon="lock-closed"
      />

      <View>
        <Text className="mb-2 text-base font-semibold text-gray-900">
          Data de Nascimento <Text className="font-normal text-gray-700">(opcional)</Text>
        </Text>
        <TouchableOpacity
          onPress={() => setDatePickerVisibility(true)}
          className="border-1.5 flex-row items-center justify-between rounded-2xl border-gray-300 bg-gray-50 p-4">
          <View className="flex-row items-center">
            <Ionicons
              name="calendar-outline"
              size={20}
              color="#18cb96"
              style={{ marginRight: 12 }}
            />
            <Text
              className={
                formData.birthDate
                  ? 'text-base font-medium text-gray-900'
                  : 'text-base text-gray-600'
              }>
              {formData.birthDate
                ? format(formData.birthDate, 'dd/MM/yyyy')
                : 'Selecionar data de nascimento'}
            </Text>
          </View>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={(date) => {
            updateField('birthDate', date);
            setDatePickerVisibility(false);
          }}
          onCancel={() => setDatePickerVisibility(false)}
          locale="pt_BR"
          maximumDate={new Date()}
        />
      </View>

      <View>
        <Text className="mb-2 text-base font-semibold text-gray-900">
          Gênero <Text className="font-normal text-gray-700">(opcional)</Text>
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {GENDER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => updateField('gender', option.value)}
              className={`border-1.5 min-w-[45%] flex-row items-center rounded-xl px-4 py-3 ${
                formData.gender === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-300 bg-gray-50'
              }`}>
              <Ionicons
                name={option.icon as any}
                size={16}
                color={formData.gender === option.value ? '#18cb96' : 'rgba(60, 60, 67, 0.6)'}
              />
              <Text
                className={`ml-2 text-sm font-medium ${
                  formData.gender === option.value ? 'text-primary' : 'text-gray-600'
                }`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <AuthInput
        label="Telefone"
        placeholder="(11) 99999-9999"
        value={formData.phoneNumber}
        onChangeText={(text) => updateField('phoneNumber', text)}
        error={errors.phoneNumber}
        helperText="Opcional"
        keyboardType="phone-pad"
        leftIcon="call"
      />
    </View>
  );

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
            onPress={handleBack}
            className="h-11 w-11 items-center justify-center rounded-full bg-gray-200">
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Logo size="sm" animated={false} />
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
              <Text className="text-center text-3xl font-bold tracking-tight text-gray-900">
                Criar Conta
              </Text>
              <Text className="mt-2 text-center text-base font-normal text-gray-600">
                {currentStep === 1
                  ? 'Vamos começar com suas informações básicas'
                  : 'Complete seu cadastro com segurança'}
              </Text>
            </Animated.View>
          </View>

          <Animated.View
            className="mx-5 mb-8 rounded-3xl border border-white/30 bg-white/90 p-7 shadow-xl"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              minHeight: SCREEN_HEIGHT * 0.6,
            }}>
            {renderStepIndicator()}

            <View className="mb-6 items-center">
              <Text className="text-center text-2xl font-bold tracking-tight text-gray-900">
                {currentStep === 1 ? 'Informações Pessoais' : 'Dados de Acesso'}
              </Text>
              <Text className="mt-1.5 text-center text-base font-normal text-gray-700">
                {currentStep === 1 ? 'Como podemos te chamar?' : 'Crie suas credenciais de acesso'}
              </Text>
            </View>

            <Animated.View
              style={{
                transform: [
                  {
                    translateX: stepAnim.interpolate({
                      inputRange: [1, 2],
                      outputRange: [0, -20],
                    }),
                  },
                ],
              }}>
              {currentStep === 1 ? renderStep1() : renderStep2()}
            </Animated.View>

            <View className="mt-7 space-y-4">
              <AuthButton
                title={currentStep === 1 ? 'Continuar' : 'Criar Conta'}
                onPress={currentStep === 1 ? handleNext : handleSubmit}
                loading={isLoading}
                leftIcon={currentStep === 1 ? 'arrow-forward' : 'person-add-outline'}
              />

              <View className="items-center">
                <Text className="text-base text-gray-600">
                  Já tem uma conta?{' '}
                  <Link href="/(auth)/sign-in" asChild>
                    <Text className="text-base font-semibold text-primary underline">
                      Fazer login
                    </Text>
                  </Link>
                </Text>
              </View>
            </View>

            {currentStep === 2 && (
              <View className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                <View className="flex-row items-center">
                  <View className="mr-3 h-8 w-8 items-center justify-center rounded-2xl bg-green-100">
                    <Ionicons name="shield-checkmark" size={16} color="#34C759" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">Dados Protegidos</Text>
                    <Text className="mt-0.5 text-xs text-gray-700">
                      Suas informações são criptografadas e mantidas em segurança
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
