import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSignUp, useAuth } from '@clerk/clerk-expo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import apiClient from '@/lib/axios';
import { format } from 'date-fns';

const GENDER_OPTIONS = ['Masculino', 'Feminino', 'Outro', 'Não informado'];

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [gender, setGender] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const { isLoaded, signUp, setActive } = useSignUp();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const validateForm = () => {
    if (!firstName.trim()) {
      showToast('Por favor, informe seu nome', 'error');
      return false;
    }
    if (!lastName.trim()) {
      showToast('Por favor, informe seu sobrenome', 'error');
      return false;
    }
    if (!email.trim()) {
      showToast('Por favor, informe seu email', 'error');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast('Por favor, informe um email válido', 'error');
      return false;
    }
    if (!password.trim()) {
      showToast('Por favor, informe sua senha', 'error');
      return false;
    }
    if (password.length < 8) {
      showToast('A senha deve ter pelo menos 8 caracteres', 'error');
      return false;
    }
    if (password !== confirmPassword) {
      showToast('As senhas não conferem', 'error');
      return false;
    }
    if (phoneNumber.trim() && !/^[\d\s\-\(\)]+$/.test(phoneNumber.trim())) {
      showToast('Formato de telefone inválido', 'error');
      return false;
    }
    return true;
  };

  const handleConfirmDate = (date: Date) => {
    setBirthDate(date);
    hideDatePicker();
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleRegisterAndSync = async () => {
    if (!validateForm() || !isLoaded) {
      return;
    }

    setIsLoading(true);
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password: password.trim(),
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      showToast('Código de verificação enviado!', 'info');

      const birthDateString = birthDate ? format(birthDate, 'yyyy-MM-dd') : '';
      router.push({
        pathname: '/(auth)/verify-code',
        params: {
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          birthDate: birthDateString,
          gender: gender || '',
          phoneNumber: phoneNumber.trim(),
        },
      });
    } catch (err: any) {
      console.error('Erro de Registro Clerk:', JSON.stringify(err, null, 2));
      const firstError = err.errors?.[0];
      const errorMessage =
        firstError?.longMessage ||
        firstError?.message ||
        'Erro ao criar conta. Verifique os dados e tente novamente.';
      if (firstError?.code === 'form_identifier_exists') {
        showToast('Este email já está cadastrado.', 'error');
      } else {
        showToast(errorMessage, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>Criar Conta</Text>
              <Text style={styles.subtitle}>Informe seu email e senha para começar</Text>
            </View>

            <View style={styles.inputGroup}>
              <Input
                label="Nome"
                placeholder="Seu nome"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Input
                label="Sobrenome"
                placeholder="Seu sobrenome"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Data de Nascimento</Text>
              <TouchableOpacity onPress={showDatePicker} style={styles.datePickerButton}>
                <Text style={styles.datePickerText}>
                  {birthDate ? format(birthDate, 'dd/MM/yyyy') : 'Selecione a data'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
                locale="pt_BR"
                maximumDate={new Date()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gênero</Text>
              <View style={styles.genderOptionsContainer}>
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderOptionButton,
                      gender === option && styles.genderOptionButtonSelected,
                    ]}
                    onPress={() => setGender(option)}>
                    <Text
                      style={[
                        styles.genderOptionText,
                        gender === option && styles.genderOptionTextSelected,
                      ]}>
                      {option === 'Não informado' ? 'Prefiro não dizer' : option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Input
                label="Telefone (Opcional)"
                placeholder="(XX) XXXXX-XXXX"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Input
                label="Email"
                placeholder="Seu email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.passwordInputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Sua senha (mínimo 8 caracteres)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <View style={styles.passwordInputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Button
              variant="primary"
              loading={isLoading}
              onPress={handleRegisterAndSync}
              style={styles.actionButton}>
              Criar Conta e Verificar Email
            </Button>

            <View style={styles.linksContainer}>
              <Text style={styles.footerText}>Já possui uma conta? </Text>
              <Link href="/(auth)/sign-in" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Entrar</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  keyboardView: { flex: 1 },
  scrollViewContent: { flexGrow: 1, justifyContent: 'center' },
  container: { paddingHorizontal: 24, paddingVertical: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: { marginBottom: 16, alignSelf: 'flex-start' },
  header: { marginBottom: 32 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#4F46E5', marginBottom: 8 },
  subtitle: { color: '#6B7280' },
  inputGroup: { marginBottom: 20 },
  label: { marginBottom: 8, fontSize: 14, fontWeight: '500', color: '#6B7280' },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
  },
  icon: { marginRight: 8 },
  textInput: { flex: 1, color: '#1F2937', height: 48 },
  eyeIcon: { padding: 5 },
  actionButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  linksContainer: { marginTop: 24, flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: '#6B7280' },
  footerLink: { fontWeight: '500', color: '#4F46E5' },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: 'white',
  },
  datePickerText: {
    color: '#1F2937',
  },
  genderOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  genderOptionButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  genderOptionButtonSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  genderOptionText: {
    color: '#374151',
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
