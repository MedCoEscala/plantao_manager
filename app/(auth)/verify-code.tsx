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
import { useSignUp, useAuth } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// Assumindo componentes UI
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import apiClient from '@/lib/axios';

export default function VerifyCodeScreen() {
  const [code, setCode] = useState('');
  const { isLoaded, signUp, setActive } = useSignUp();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{
    email: string;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    gender?: string;
    phoneNumber?: string;
  }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!params.email) {
      showToast('Email não fornecido para verificação.', 'error');
      router.replace('/(auth)/sign-up');
    }
  }, [params.email]);

  const handleVerifyCodeAndSync = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    let sessionActivated = false; // Flag para controle
    let token: string | null = null;

    try {
      // 1. Verificar o código
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      if (completeSignUp.status !== 'complete') {
        throw new Error('Falha na verificação do código.'); // Simplificar erro
      }

      // 2. Ativar sessão e obter token
      await setActive({ session: completeSignUp.createdSessionId });
      sessionActivated = true;
      token = await getToken();
      if (!token) {
        throw new Error('Falha ao obter token de autenticação.');
      }

      // -- Chamadas Backend --
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      // 3. Sincronização Básica (Cria/Atualiza user com email)
      try {
        console.log('🔄 [1/2] Sincronização básica do usuário...');
        await apiClient.post('/users/sync', {}, authHeader);
        console.log('✅ [1/2] Sincronização básica concluída.');
      } catch (syncError) {
        console.error('❌ Erro na sincronização básica:', syncError);
        // Erro crítico? Talvez não, o usuário pode tentar logar de novo?
        // Por ora, apenas logamos e mostramos um toast, mas continuamos.
        showToast('Erro na sincronização inicial. Tente novamente.', 'error');
        // Poderia lançar um erro aqui para parar o fluxo se necessário
      }

      // 4. Atualização do Perfil (Envia dados extras)
      const profileData: { [key: string]: string | undefined } = {};
      if (params.firstName) profileData.firstName = params.firstName;
      if (params.lastName) profileData.lastName = params.lastName;
      if (params.birthDate) profileData.birthDate = params.birthDate;
      if (params.gender) profileData.gender = params.gender;
      if (params.phoneNumber) profileData.phoneNumber = params.phoneNumber;

      if (Object.keys(profileData).length > 0) {
        try {
          console.log('🔄 [2/2] Atualizando perfil com dados adicionais...', profileData);
          await apiClient.patch('/users/me', profileData, authHeader);
          console.log('✅ [2/2] Atualização do perfil concluída.');
        } catch (updateError) {
          console.error('❌ Erro ao atualizar perfil:', updateError);
          // Erro aqui pode ser mais problemático, pois os dados extras não foram salvos.
          showToast(
            'Erro ao salvar dados do perfil. Você pode atualizá-los mais tarde.',
            'warning'
          );
          // Continuar mesmo com erro?
        }
      } else {
        console.log('ℹ️ [2/2] Nenhum dado adicional recebido via params.');
      }

      // 5. Redirecionamento Final
      showToast('Conta verificada com sucesso!', 'success');
      router.replace('/(root)/profile');
    } catch (err: any) {
      // Erro na verificação, ativação ou obtenção de token
      console.error('Erro no fluxo de verificação/ativação/token:', err);
      const firstError = err.errors?.[0];
      const errorMessage =
        firstError?.longMessage || firstError?.message || err.message || 'Ocorreu um erro.';
      showToast(errorMessage, 'error');

      // Se a sessão foi ativada mas algo falhou depois (ex: sync/update),
      // o usuário pode ficar num estado logado mas inconsistente.
      // Considerar deslogar? Por ora, deixamos logado.
      // if (sessionActivated) { ... }
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
              <Text style={styles.subtitle}>
                Insira o código de 6 dígitos enviado para {params.email}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Input
                label="Código de Verificação"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
                placeholder="_ _ _ _ _ _"
                maxLength={6}
                style={styles.codeInput}
              />
            </View>

            <Button
              variant="primary"
              loading={isLoading}
              onPress={handleVerifyCodeAndSync}
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
