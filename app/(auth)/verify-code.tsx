import React, { useState, useEffect } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// Assumindo componentes UI
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function VerifyCodeScreen() {
  const [code, setCode] = useState('');
  const { isLoaded, signUp, setActive } = useSignUp();
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      showToast('Email não fornecido para verificação.', 'error');
      router.replace('/(auth)/sign-up');
    }
  }, [email]);

  const handleVerifyCode = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status !== 'complete') {
        // Status inesperado (ex: 'missing_requirements') - Tratar se necessário
        console.error('Status inesperado da verificação:', JSON.stringify(completeSignUp, null, 2));
        throw new Error('Status inesperado durante a verificação.');
      }

      // Verificação bem-sucedida, define a sessão como ativa
      await setActive({ session: completeSignUp.createdSessionId });
      showToast('Conta verificada com sucesso!', 'success');
      router.replace('/(root)/profile'); // Vai para a tela principal após verificação
    } catch (err: any) {
      console.error('Erro ao verificar código:', JSON.stringify(err, null, 2));
      const firstError = err.errors?.[0];
      const errorMessage =
        firstError?.longMessage || firstError?.message || 'Código inválido ou expirado.';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) return;

    setResendLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      showToast('Novo código enviado para seu email.', 'success');
    } catch (err: any) {
      console.error('Erro ao reenviar código:', JSON.stringify(err, null, 2));
      const firstError = err.errors?.[0];
      showToast(firstError?.longMessage || 'Erro ao reenviar código.', 'error');
    } finally {
      setResendLoading(false);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>Verificar Email</Text>
              <Text style={styles.subtitle}>Insira o código de 6 dígitos enviado para {email}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Input
                label="Código de Verificação"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
                placeholder="_ _ _ _ _ _"
                maxLength={6}
                // Adicionar estilo para centralizar texto se Input não fizer
                style={styles.codeInput}
              />
            </View>

            <Button
              variant="primary"
              loading={isLoading}
              onPress={handleVerifyCode}
              style={styles.actionButton}>
              Verificar Código e Entrar
            </Button>

            <TouchableOpacity
              onPress={handleResendCode}
              disabled={resendLoading}
              style={styles.resendButton}>
              <Text style={styles.resendText}>
                {resendLoading ? 'Enviando...' : 'Reenviar Código'}
              </Text>
            </TouchableOpacity>
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
  codeInput: {
    // Estilos específicos para o input de código, se necessário
    // Ex: textAlign: 'center', fontSize: 20, letterSpacing: 10
  },
  actionButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  resendButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    color: '#4F46E5', // primary color
    fontWeight: '500',
  },
});
