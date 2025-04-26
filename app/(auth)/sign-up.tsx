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
import { useSignUp } from '@clerk/clerk-expo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Adicione outros campos se quiser coletá-los aqui (nome, etc.)
  // const [firstName, setFirstName] = useState('');
  // const [lastName, setLastName] = useState('');

  const { isLoaded, signUp, setActive } = useSignUp();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const validateForm = () => {
    // Adicione validações para nome, se coletar
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
      // Clerk exige 8 caracteres por padrão
      showToast('A senha deve ter pelo menos 8 caracteres', 'error');
      return false;
    }
    if (password !== confirmPassword) {
      showToast('As senhas não conferem', 'error');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm() || !isLoaded) {
      return;
    }

    setIsLoading(true);
    try {
      // Cria o usuário no Clerk
      await signUp.create({
        emailAddress: email.trim(),
        password: password.trim(),
        // firstName: firstName.trim(), // Adicione se coletar
        // lastName: lastName.trim(), // Adicione se coletar
      });

      // Prepara e envia o código de verificação por email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // Redireciona para a tela de verificação
      showToast('Código de verificação enviado!', 'info');
      router.push({ pathname: '/(auth)/verify-code', params: { email: email.trim() } });
    } catch (err: any) {
      console.error('Erro de Registro Clerk:', JSON.stringify(err, null, 2));
      const firstError = err.errors?.[0];
      const errorMessage =
        firstError?.longMessage ||
        firstError?.message ||
        'Erro ao criar conta. Verifique os dados e tente novamente.';
      // Tratar erro de email já existente especificamente se necessário
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

            {/* Adicionar campos de nome aqui se necessário */}
            {/* <View style={styles.inputGroup}>
              <Input label="Nome" ... />
            </View> */}

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
              {' '}
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
              {' '}
              // Confirmar Senha
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
              onPress={handleRegister}
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

// Estilos (similares ao sign-in, ajustar conforme necessidade)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  keyboardView: { flex: 1 },
  scrollViewContent: { flexGrow: 1, justifyContent: 'center' },
  container: { paddingHorizontal: 24, paddingVertical: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: { marginBottom: 16, alignSelf: 'flex-start' }, // Ajuste para botão voltar
  header: { marginBottom: 32 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#4F46E5', marginBottom: 8 },
  subtitle: { color: '#6B7280' },
  inputGroup: { marginBottom: 16 },
  label: { marginBottom: 4, fontSize: 14, fontWeight: '500', color: '#6B7280' },
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
    marginTop: 8, // Espaço antes do botão
    marginBottom: 16,
  },
  linksContainer: { marginTop: 24, flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: '#6B7280' },
  footerLink: { fontWeight: '500', color: '#4F46E5' },
});
