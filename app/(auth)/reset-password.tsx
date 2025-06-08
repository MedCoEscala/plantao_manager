import { useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
import { SafeAreaView } from 'react-native-safe-area-context';

// Assumindo componentes UI
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function ResetPasswordScreen() {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams();
  const email = params.email as string; // Pega o email passado da tela anterior
  const [isLoading, setIsLoading] = useState(false);

  // Se não houver email (veio direto para cá), volta para o início do fluxo
  if (!email && isLoaded) {
    router.replace('/(auth)/forgot-password');
    return null;
  }

  const validateForm = () => {
    if (!code.trim()) {
      showToast('Por favor, informe o código de verificação', 'error');
      return false;
    }
    if (!newPassword.trim()) {
      showToast('Por favor, informe a nova senha', 'error');
      return false;
    }
    if (newPassword.length < 8) {
      showToast('A nova senha deve ter pelo menos 8 caracteres', 'error');
      return false;
    }
    if (newPassword !== confirmPassword) {
      showToast('As senhas não conferem', 'error');
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm() || !isLoaded) {
      return;
    }

    setIsLoading(true);
    try {
      // Tenta completar o fluxo de reset de senha
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password: newPassword.trim(),
      });

      if (result.status === 'complete') {
        // Senha redefinida com sucesso, ativa a nova sessão
        await setActive({ session: result.createdSessionId });
        showToast('Senha redefinida com sucesso!', 'success');
        router.replace('/(root)/(tabs)'); // Redireciona para a tela principal
      } else {
        // Status inesperado
        console.error('Status inesperado ao resetar senha:', JSON.stringify(result, null, 2));
        showToast('Status inesperado ao redefinir senha.', 'error');
      }
    } catch (err: any) {
      console.error('Erro ao resetar senha Clerk:', JSON.stringify(err, null, 2));
      const firstError = err.errors?.[0];
      const errorMessage =
        firstError?.longMessage || firstError?.message || 'Erro ao redefinir senha.';
      // Tratar código inválido/expirado
      if (firstError?.code === 'form_code_incorrect') {
        showToast('Código de verificação inválido ou expirado.', 'error');
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
              <Text style={styles.title}>Redefinir Senha</Text>
              <Text style={styles.subtitle}>
                Digite o código enviado para {email} e defina sua nova senha.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Input
                label="Código de Verificação"
                placeholder="Código recebido por email"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <View style={styles.inputGroup}>
              {' '}
              // Nova Senha
              <Text style={styles.label}>Nova Senha</Text>
              <View style={styles.passwordInputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nova senha (mínimo 8 caracteres)"
                  value={newPassword}
                  onChangeText={setNewPassword}
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
              // Confirmar Nova Senha
              <Text style={styles.label}>Confirmar Nova Senha</Text>
              <View style={styles.passwordInputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Confirme a nova senha"
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
              onPress={handleResetPassword}
              style={styles.actionButton}>
              Redefinir Senha
            </Button>

            <View style={styles.linksContainer}>
              <Link href="/(auth)/sign-in" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Voltar para Login</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  keyboardView: { flex: 1 },
  scrollViewContent: { flexGrow: 1, justifyContent: 'center' },
  container: { paddingHorizontal: 24, paddingVertical: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: { marginBottom: 16, alignSelf: 'flex-start' },
  header: { marginBottom: 32, alignItems: 'center' },
  title: { fontSize: 30, fontWeight: 'bold', color: '#4F46E5', marginBottom: 8 },
  subtitle: { color: '#6B7280', textAlign: 'center' },
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
    marginTop: 8,
    marginBottom: 16,
  },
  linksContainer: { marginTop: 24, alignItems: 'center' },
  footerLink: { fontWeight: '500', color: '#4F46E5' },
});
