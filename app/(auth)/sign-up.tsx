import { useSignUp, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter, Link } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity, Dimensions } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import { useNotification } from '../components';
import AuthButton from '../components/auth/AuthButton';
import AuthDateInput from '../components/auth/AuthDateInput';
import AuthInput from '../components/auth/AuthInput';
import Logo from '../components/auth/Logo';
import AuthScreenWrapper from '../components/ui/AuthScreenWrapper';
import { validatePassword } from '../services/auth/utils';

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
        showError('Por favor, corrija os erros antes de continuar');
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

    setIsLoading(true);

    try {
      if (currentStep === 1) {
        const isValid = validateStep1();
        if (isValid) {
          setCurrentStep(2);
        }
      } else if (currentStep === 2) {
        const isValid = validateStep2();
        if (!isValid) {
          showError('Por favor, corrija os erros antes de continuar');
          return;
        }

        await signUp?.create({
          emailAddress: formData.email.trim(),
          password: formData.password.trim(),
        });

        await signUp?.prepareEmailAddressVerification({
          strategy: 'email_code',
        });

        const dataToSend: any = {
          email: formData.email.trim(),
        };

        if (formData.firstName.trim()) dataToSend.firstName = formData.firstName.trim();
        if (formData.lastName.trim()) dataToSend.lastName = formData.lastName.trim();
        if (formData.birthDate) dataToSend.birthDate = format(formData.birthDate, 'yyyy-MM-dd');
        if (formData.gender) dataToSend.gender = formData.gender;
        if (formData.phoneNumber.trim()) dataToSend.phoneNumber = formData.phoneNumber.trim();

        router.push({
          pathname: '/verify-code',
          params: dataToSend,
        });
      }
    } catch (err: any) {
      console.error('Erro no signup:', err);
      const errorMessage = err?.errors?.[0]?.message || 'Erro ao criar conta. Tente novamente.';
      showError(errorMessage);
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
    <View style={{ gap: 16 }}>
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
    <View style={{ gap: 16 }}>
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
      <AuthDateInput
        label="Data de Nascimento"
        value={formData.birthDate ? format(formData.birthDate, 'dd/MM/yyyy') : null}
        onPress={() => setDatePickerVisibility(true)}
        placeholder="Selecionar data de nascimento"
        error={errors.birthDate}
        helperText="Opcional"
      />
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
      <View>
        <Text className="mb-2 text-base font-semibold text-gray-900">
          Gênero <Text className="font-normal text-gray-700">(opcional)</Text>
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {GENDER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => updateField('gender', option.value)}
              activeOpacity={0.7}
              className={`flex-row items-center rounded-xl border-2 px-4 py-3 ${
                formData.gender === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 bg-gray-50'
              }`}
              style={{ minWidth: '45%' }}>
              <Ionicons
                name={option.icon as any}
                size={18}
                color={formData.gender === option.value ? '#18cb96' : '#6B7280'}
                style={{ marginRight: 8 }}
              />
              <Text
                className={`text-sm font-medium ${
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
      <AuthScreenWrapper showGradient={false}>
        <View className="flex-1 items-center justify-center">
          <Logo size="lg" />
          <Text className="mt-4 text-gray-900">Carregando...</Text>
        </View>
      </AuthScreenWrapper>
    );
  }

  return (
    <AuthScreenWrapper showGradient>
      <View className="flex-1 px-5 pt-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleBack}
            className="h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white/80">
            <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Logo size="sm" animated={false} />
          </View>

          <View className="h-11 w-11" />
        </View>

        <Animated.View className="mt-6 items-center px-6" style={{ opacity: fadeAnim }}>
          <Text className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Criar Conta
          </Text>
          <Text className="mt-2 text-center text-base font-normal text-gray-600">
            {currentStep === 1
              ? 'Vamos começar com suas informações básicas'
              : 'Complete seu cadastro com segurança'}
          </Text>
        </Animated.View>

        <Animated.View
          className="mt-6 flex-1 rounded-3xl border border-white/20 bg-white/95 p-6 shadow-xl"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
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
      </View>
    </AuthScreenWrapper>
  );
}
