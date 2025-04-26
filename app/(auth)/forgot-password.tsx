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
import { useSignIn } from '@clerk/clerk-expo';
// Assumindo componentes UI
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      showToast('Por favor, informe seu email', 'error');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast('Por favor, informe um email válido', 'error');
      return false;
    }
    return true;
  };

  const handleRequestReset = async () => {
    if (!validateForm() || !isLoaded) {
      return;
    }

    setIsLoading(true);
    try {
      // Inicia o fluxo de reset de senha no Clerk
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
      // Tratar especificamente se o email não for encontrado
      if (firstError?.code === 'form_identifier_not_found') {
        showToast('Este email não está cadastrado.', 'error');
      } else {
        showToast(errorMessage, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Navega para a tela de inserir o código e a nova senha
  const handleContinueToReset = () => {
    router.push({
      pathname: '/(auth)/reset-password',
      params: { email: email.trim() }, // Passa o email como parâmetro
    });
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
              <Text style={styles.title}>Esqueceu sua senha?</Text>
              <Text style={styles.subtitle}>
                {!isSubmitted
                  ? 'Enviaremos instruções de redefinição para seu email.'
                  : 'Instruções enviadas! Verifique seu email e clique abaixo para continuar.'}
              </Text>
            </View>

            {!isSubmitted ? (
              <>
                <View style={styles.inputGroup}>
                  <Input
                    label="Email"
                    placeholder="Seu email cadastrado"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <Button
                  variant="primary"
                  loading={isLoading}
                  onPress={handleRequestReset}
                  style={styles.actionButton}>
                  Enviar Instruções
                </Button>
              </>
            ) : (
              <View style={styles.submittedContainer}>
                <Ionicons
                  name="mail-open-outline"
                  size={64}
                  color="#4F46E5"
                  style={styles.iconSubmitted}
                />
                <Text style={styles.infoText}>
                  Verifique seu email e siga as instruções para obter o código de redefinição.
                </Text>
                <Button
                  variant="primary"
                  onPress={handleContinueToReset}
                  style={styles.actionButton}>
                  Já tenho o código, continuar
                </Button>
                <Button
                  variant="outline" // Ou secondary
                  onPress={() => setIsSubmitted(false)}
                  style={{ marginTop: 10 }} // Espaçamento adicional
                >
                  Tentar com outro email
                </Button>
              </View>
            )}

            <View style={styles.linksContainer}>
              <Text style={styles.footerText}>Lembrou sua senha? </Text>
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
  submittedContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  iconSubmitted: {
    marginBottom: 20,
  },
  infoText: {
    textAlign: 'center',
    marginBottom: 25,
    color: '#374151', // text-gray-700
    fontSize: 16,
    lineHeight: 24,
  },
  actionButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  linksContainer: { marginTop: 24, flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: '#6B7280' },
  footerLink: { fontWeight: '500', color: '#4F46E5' },
});
