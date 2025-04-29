import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useToast } from '@/components/ui/Toast';
import { useDialog } from '@/contexts/DialogContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProfile } from '@/hooks/useProfile'; // Novo hook!

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { showDialog } = useDialog();
  const { showToast } = useToast();
  const { profile, isLoading, error, fetchProfile } = useProfile(); // Usando o novo hook
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error2, setError] = useState<string | null>(null);

  // Função para obter iniciais do nome
  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
  };

  // Função para formatar a data
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Não informado';
    try {
      // Considerando que o formato da data pode ser YYYY-MM-DD ou um ISO string
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  // Função para copiar ID do usuário
  const copyUserId = async () => {
    if (profile?.id) {
      await Clipboard.setStringAsync(profile.id);
      showToast('ID do usuário copiado', 'success');
    }
  };

  // Função para logout
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      showToast('Erro ao fazer logout', 'error');
    }
  };

  // Função para buscar dados de teste (mantido do código original)
  const fetchUserData = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    setUserData(null);

    try {
      // Simular uma resposta de API para teste
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUserData({
        id: profile.id,
        name:
          profile.firstName && profile.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : profile.name,
        email: profile.email,
      });
      showToast('Dados buscados com sucesso (placeholder)!', 'success');
    } catch (err: any) {
      console.error('Erro ao buscar dados do usuário:', err);
      setError(`Erro ao buscar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Gerar nome de exibição a partir do firstName e lastName ou do campo name
  const displayName = profile
    ? ((profile.firstName || '') + ' ' + (profile.lastName || '')).trim() ||
      profile.name ||
      'Usuário'
    : 'Usuário';

  const displayPhone = profile?.phoneNumber || 'Não informado';
  const displayBirthDate = profile?.birthDate || null;
  const userEmail = profile?.email || 'email@exemplo.com';

  // Mostrar loading enquanto carrega o perfil
  if (isLoading) {
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
              <TouchableOpacity
                className="flex-row items-center justify-between border-b border-background-300 p-4"
                onPress={() => router.push('/profile/edit')}>
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
                <Text className="text-text-light">{profile?.id?.substring(0, 8) + '...'}</Text>
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
                  {loading ? 'Buscando...' : 'Buscar Dados (Teste)'}
                </Text>
              </TouchableOpacity>
              {loading && <ActivityIndicator size="small" color="#18cb96" className="my-4" />}
              {error2 && <Text className="mt-2 text-sm text-error">{error2}</Text>}
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
