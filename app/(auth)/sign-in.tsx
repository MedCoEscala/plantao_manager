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
// Assumindo que Button, Input e useToast existem e funcionam
// Se der erro, precisaremos ajustar ou usar componentes padrão
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { isLoaded, signIn, setActive } = useSignIn();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast(); // Assumindo que useToast está configurado no layout

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
    if (!password.trim()) {
      showToast('Por favor, informe sua senha', 'error');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm() || !isLoaded) {
      return;
    }

    setIsLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: email.trim(),
        password: password.trim(),
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        showToast('Login realizado com sucesso!', 'success');
        router.replace('/(root)/profile'); // Redireciona para o perfil após login
      } else {
        // Status inesperado (ex: 'needs_second_factor') - Tratar se necessário
        console.error(
          'Status inesperado do Clerk Sign In:',
          JSON.stringify(signInAttempt, null, 2)
        );
        showToast('Status de login inesperado.', 'error');
      }
    } catch (err: any) {
      // Erro durante a tentativa de login
      console.error('Erro de Login Clerk:', JSON.stringify(err, null, 2));
      const firstError = err.errors?.[0];
      const errorMessage =
        firstError?.longMessage || firstError?.message || 'Email ou senha inválidos.';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Mostra loading enquanto Clerk inicializa
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
            <View style={styles.header}>
              <Text style={styles.title}>Entrar</Text>
              <Text style={styles.subtitle}>Faça login para gerenciar seus plantões</Text>
            </View>

            <View style={styles.inputGroup}>
              <Input
                label="Email"
                placeholder="Seu email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                // Adapte props se Input for diferente
              />
            </View>

            <View style={styles.inputGroup}>
              {' '}
              // Input de Senha com ícone
              <Text style={styles.label}>Senha</Text>
              <View style={styles.passwordInputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Sua senha"
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

            <Button
              variant="primary" // Adapte se necessário
              loading={isLoading}
              onPress={handleLogin}
              // Adapte props se Button for diferente
              style={styles.loginButton} // Adiciona margem inferior
            >
              Entrar
            </Button>

            <View style={styles.linksContainer}>
              <Link href="/(auth)/sign-up" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkTextPrimary}>Criar conta</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkTextSecondary}>Esqueci minha senha</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Estilos (adaptados para componentes padrão ou mantidos se Input/Button existirem)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 24, // Equivalente a px-6
    paddingVertical: 32, // Equivalente a py-8
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 32, // Equivalente a mb-8
  },
  title: {
    fontSize: 30, // Equivalente a text-3xl
    fontWeight: 'bold',
    color: '#4F46E5', // Cor primária (ajuste se necessário)
    marginBottom: 8, // Equivalente a mb-2
  },
  subtitle: {
    color: '#6B7280', // Equivalente a text-text-light
  },
  inputGroup: {
    marginBottom: 16, // Equivalente a mb-4 ou mb-6
  },
  label: {
    marginBottom: 4, // Equivalente a mb-1
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280', // text-text-light
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8, // rounded-lg
    borderWidth: 1,
    borderColor: '#D1D5DB', // border-gray-300
    paddingHorizontal: 12, // px-3
  },
  icon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: '#1F2937', // text-text-dark
    height: 48, // Ajuste conforme necessário para equivaler a py-2/py-3 implícito no Input
  },
  eyeIcon: {
    padding: 5, // Área de toque para o ícone
  },
  loginButton: {
    marginBottom: 16, // mb-4
  },
  linksContainer: {
    marginTop: 24, // mt-6
    alignItems: 'center',
  },
  linkTextPrimary: {
    fontWeight: '500',
    color: '#4F46E5', // primary
    marginBottom: 10, // Espaçamento entre links
  },
  linkTextSecondary: {
    color: '#6B7280', // text-text-light
  },
});
