import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as Clipboard from 'expo-clipboard';
import { PrismaClient } from '@prisma/client';
import { router } from 'expo-router';
import { Toast } from '@app/components/ui/Toast';
import { useDialog } from '@app/contexts/DialogContext';

const prisma = new PrismaClient();

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { showDialog } = useDialog();
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
  });

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0);
    return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não informado';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return dateString;
    }
  };

  const showLocalToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info'
  ) => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const copyUserId = async () => {
    if (user?.id) {
      await Clipboard.setStringAsync(user.id);
      showLocalToast('ID do usuário copiado para a área de transferência', 'success');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      showLocalToast('Erro ao fazer logout', 'error');
    }
  };

  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Usuário';
  const userEmail = user?.primaryEmailAddress?.emailAddress || 'email@exemplo.com';
  const userPhone = user?.phoneNumbers?.[0]?.phoneNumber || 'Não informado';
  const userBirthDate = (user?.publicMetadata?.birthDate as string) || undefined;

  const renderDebugSection = () => {
    return (
      <View className="mb-6">
        <Text className="mb-3 text-lg font-bold text-gray-800">Debug e Suporte</Text>

        <TouchableOpacity
          className="mb-3 rounded-lg bg-gray-400 p-3"
          onPress={() => {
            showDialog({
              type: 'info',
              title: 'Informações do Banco',
              message:
                'Esse app utiliza NeonDB (PostgreSQL) em nuvem. Os dados são armazenados online.',
            });
          }}>
          <Text className="font-medium text-white">Ver Informações do Banco de Dados</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <ScrollView className="flex-1 p-4">
        <View className="my-6 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-blue-600">
            <Text className="text-2xl font-bold text-white">
              {user ? getInitials(userName) : '?'}
            </Text>
          </View>
          <Text className="mb-1 text-xl font-bold text-gray-800">{userName}</Text>
          <Text className="text-base text-gray-500">{userEmail}</Text>
        </View>

        <View className="mb-6">
          <Text className="mb-3 text-lg font-bold text-gray-800">Informações Pessoais</Text>
          <View className="rounded-xl bg-white p-4 shadow-sm">
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-base text-gray-800">Telefone</Text>
              <Text className="text-base text-gray-500">{userPhone}</Text>
            </View>
            <View className="h-px bg-gray-200" />
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-base text-gray-800">Data de Nascimento</Text>
              <Text className="text-base text-gray-500">{formatDate(userBirthDate)}</Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="mb-3 text-lg font-bold text-gray-800">Opções</Text>
          <View className="rounded-xl bg-white shadow-sm">
            <TouchableOpacity
              className="flex-row items-center p-4"
              onPress={() => router.push('/profile/edit')}>
              <View className="mr-4 h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Ionicons name="person-outline" size={20} color="#0077B6" />
              </View>
              <Text className="flex-1 text-base text-gray-800">Editar Perfil</Text>
              <Ionicons name="chevron-forward" size={20} color="#8D99AE" />
            </TouchableOpacity>

            <View className="h-px bg-gray-200" />

            <TouchableOpacity className="flex-row items-center p-4">
              <View className="mr-4 h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Ionicons name="document-text-outline" size={20} color="#0077B6" />
              </View>
              <Text className="flex-1 text-base text-gray-800">Formulário de Contabilidade</Text>
              <Ionicons name="chevron-forward" size={20} color="#8D99AE" />
            </TouchableOpacity>

            <View className="h-px bg-gray-200" />

            <TouchableOpacity className="flex-row items-center p-4">
              <View className="mr-4 h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Ionicons name="download-outline" size={20} color="#0077B6" />
              </View>
              <Text className="flex-1 text-base text-gray-800">Exportar Dados</Text>
              <Ionicons name="chevron-forward" size={20} color="#8D99AE" />
            </TouchableOpacity>

            <View className="h-px bg-gray-200" />

            <TouchableOpacity className="flex-row items-center p-4" onPress={copyUserId}>
              <View className="mr-4 h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Ionicons name="copy-outline" size={20} color="#0077B6" />
              </View>
              <Text className="flex-1 text-base text-gray-800">Copiar ID</Text>
              <Text className="text-sm text-gray-500">{user?.id.substring(0, 8) + '...'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {renderDebugSection()}

        <TouchableOpacity
          className="my-4 flex-row items-center justify-center rounded-xl border border-red-500 bg-white p-4"
          onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#E76F51" />
          <Text className="ml-2 text-base font-medium text-red-500">Sair do aplicativo</Text>
        </TouchableOpacity>

        <View className="mb-6 items-center">
          <Text className="text-sm text-gray-500">Versão 1.0.0</Text>
        </View>
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
      />
    </SafeAreaView>
  );
}
