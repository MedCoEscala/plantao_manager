import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSignUp, useUser } from '@clerk/clerk-expo';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useDialog } from '../contexts/DialogContext';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default function VerifyCodeScreen() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const router = useRouter();
  const { showToast } = useToast();
  const { showDialog } = useDialog();
  const params = useLocalSearchParams();
  const { email, phoneNumber, birthDate } = params;

  const { isLoaded, signUp, setActive } = useSignUp();
  const { user } = useUser();

  useEffect(() => {
    if (!email) {
      showDialog({
        type: 'error',
        title: 'Erro',
        message: 'Email não fornecido. Retorne à tela de cadastro.',
        onConfirm: () => router.replace('/(auth)/sign-up'),
      });
    }
  }, [email]);

  const saveUserMetadata = async () => {
    if (!user) return;

    try {
      const userMetadata = {
        birthDate: birthDate || undefined,
      };

      await user.update({
        unsafeMetadata: userMetadata,
      });

      console.log('Metadados do usuário atualizados com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar metadados do usuário:', error);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      showToast('Por favor, informe o código de verificação', 'error');
      return;
    }

    if (!isLoaded || !signUp) {
      showToast('Serviço de autenticação não inicializado', 'error');
      return;
    }

    try {
      setIsLoading(true);

      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });

        if (user) {
          try {
            if (phoneNumber) {
              try {
                await user.createPhoneNumber({
                  phoneNumber: phoneNumber as string,
                });
                console.log('Telefone adicionado com sucesso');
              } catch (phoneError) {
                console.error('Erro ao adicionar telefone:', phoneError);
              }
            }

            await saveUserMetadata();

            try {
              const existingUser = await prisma.user.findUnique({
                where: { id: user.id },
              });

              const userData = {
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                email: user.primaryEmailAddress?.emailAddress || (email as string),
                phoneNumber: (phoneNumber as string) || null,
                birthDate: (birthDate as string) || null,
              };

              if (existingUser) {
                await prisma.user.update({
                  where: { id: user.id },
                  data: userData,
                });
              } else {
                await prisma.user.create({
                  data: {
                    id: user.id,
                    ...userData,
                  },
                });
              }

              console.log('Usuário salvo no banco com sucesso');
            } catch (dbError) {
              console.error('Erro ao salvar usuário no banco:', dbError);
            }
          } catch (error) {
            console.error('Erro ao atualizar dados do usuário:', error);
          }
        }

        showToast('Conta verificada com sucesso!', 'success');
        router.replace('/(root)');
      } else {
        showToast('Código inválido. Tente novamente.', 'error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar código';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signUp) {
      showToast('Serviço de autenticação não inicializado', 'error');
      return;
    }

    try {
      setResending(true);
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      showToast('Novo código enviado para seu email', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao reenviar código';
      showToast(errorMessage, 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <ScrollView className="flex-1">
        <View className="px-6 py-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4 h-10 w-10 items-center justify-center">
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View className="mb-8">
            <Text className="mb-2 text-3xl font-bold text-primary">Verificação</Text>
            <Text className="text-text-light">
              Enviamos um código de verificação para {email}. Por favor, insira-o abaixo para
              confirmar sua conta.
            </Text>
          </View>

          <View className="mb-6">
            <Text className="mb-1 text-sm font-medium text-text-light">Código de Verificação</Text>
            <View className="flex-row items-center rounded-lg border border-gray-300 px-3 py-2">
              <Ionicons name="key-outline" size={20} color="#666" style={{ marginRight: 8 }} />
              <TextInput
                className="flex-1 text-text-dark"
                placeholder="Código de verificação"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Button
            variant="primary"
            loading={isLoading}
            onPress={handleVerify}
            fullWidth
            className="mb-4">
            Verificar
          </Button>

          <TouchableOpacity onPress={handleResendCode} disabled={resending} className="mb-6">
            <Text className="text-center font-medium text-primary">
              {resending ? 'Enviando...' : 'Reenviar código'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
