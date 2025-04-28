import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useToast } from '@/components/ui/Toast';
import { useDialog } from '@/contexts/DialogContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import apiClient from '@/lib/axios';

export default function ProfileScreen() {
  const { signOut, getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { showDialog } = useDialog();
  const { showToast } = useToast();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    if (!user || !getToken) return;
    setLoading(true);
    setError(null);
    setUserData(null);

    try {
      const token = await getToken();
      if (!token) {
        showToast('Erro: Não foi possível obter o token de autenticação.', 'error');
        throw new Error('Token não disponível');
      }

      console.log(
        `Buscando dados para usuário: ${user.id} com token: ${token.substring(0, 10)}...`
      );
      const response = await apiClient.get(`/users/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Resposta da API:', response.data);
      setUserData(response.data);
      showToast('Dados buscados com sucesso (placeholder)!', 'success');
    } catch (err: any) {
      console.error('Erro ao buscar dados do usuário:', err);
      let errorMessage = 'Erro desconhecido';
      if (err.response) {
        errorMessage = `Erro ${err.response.status}: ${err.response.data?.message || err.message}`;
      } else if (err.request) {
        errorMessage =
          'Erro de rede. Verifique sua conexão e se o backend está rodando no IP/porta corretos.';
      } else {
        errorMessage = err.message;
      }
      setError(`Erro ao buscar dados: ${errorMessage}`);
      Alert.alert('Erro', `Não foi possível buscar os dados do usuário: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Não informado';
    try {
      const date = new Date(dateString + 'T00:00:00Z');
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  const copyUserId = async () => {
    if (user?.id) {
      await Clipboard.setStringAsync(user.id);
      showToast('ID do usuário copiado', 'success');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      showToast('Erro ao fazer logout', 'error');
    }
  };

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Usuário';
  const displayPhone = user?.phoneNumbers?.[0]?.phoneNumber || 'Não informado';
  const displayBirthDate = (user?.unsafeMetadata?.birthDate as string) || null;
  const userEmail = user?.primaryEmailAddress?.emailAddress || 'email@exemplo.com';

  if (!isUserLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#18cb96" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <ScrollView className="flex-1 px-4">
        <View className="py-6">
          <View className="items-center pb-6">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-primary">
              <Text className="text-4xl font-bold text-white">{getInitials(displayName)}</Text>
            </View>
            <Text className="mt-4 text-xl font-bold text-text-dark">{displayName}</Text>
            <Text className="text-base text-text-light">{userEmail}</Text>
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-base font-medium text-text-dark">Informações Pessoais</Text>
            <View className="overflow-hidden rounded-xl bg-white shadow-sm">
              <View className="border-b border-background-300 p-4">
                <Text className="text-sm font-medium text-text-light">Telefone</Text>
                <Text className="text-base text-text-dark">{displayPhone}</Text>
              </View>
              <View className="p-4">
                <Text className="text-sm font-medium text-text-light">Data de Nascimento</Text>
                <Text className="text-base text-text-dark">{formatDate(displayBirthDate)}</Text>
              </View>
            </View>
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-base font-medium text-text-dark">Opções</Text>
            <View className="overflow-hidden rounded-xl bg-white shadow-sm">
              <TouchableOpacity className="flex-row items-center justify-between border-b border-background-300 p-4">
                <View className="flex-row items-center">
                  <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                    <Ionicons name="person-outline" size={18} color="#18cb96" />
                  </View>
                  <Text className="text-base text-text-dark">Editar Perfil</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center justify-between p-4"
                onPress={copyUserId}>
                <View className="flex-row items-center">
                  <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                    <Ionicons name="copy-outline" size={18} color="#18cb96" />
                  </View>
                  <Text className="text-base text-text-dark">Copiar ID</Text>
                </View>
                <Text className="text-text-light">{user?.id?.substring(0, 8) + '...'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-base font-medium text-text-dark">Teste Backend</Text>
            <View className="rounded-xl bg-white p-4 shadow-sm">
              <TouchableOpacity
                className="rounded-lg bg-primary px-4 py-2"
                onPress={fetchUserData}
                disabled={loading}>
                <Text className="text-center font-medium text-white">
                  {loading ? 'Buscando...' : 'Buscar Dados (Deve dar 404)'}
                </Text>
              </TouchableOpacity>
              {loading && <ActivityIndicator size="small" color="#18cb96" className="my-4" />}
              {error && <Text className="mt-2 text-sm text-error">{error}</Text>}
              {userData && (
                <View className="mt-4 rounded-lg bg-background-100 p-3">
                  <Text className="mb-2 font-medium text-text-dark">Dados Recebidos:</Text>
                  <Text className="font-mono text-xs">{JSON.stringify(userData, null, 2)}</Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            className="mb-6 flex-row items-center justify-center rounded-xl border border-error bg-white p-4"
            onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="ml-2 font-medium text-error">Sair do aplicativo</Text>
          </TouchableOpacity>

          <View className="mb-8 items-center">
            <Text className="text-sm text-text-light">Versão 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
