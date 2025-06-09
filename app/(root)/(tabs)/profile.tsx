import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ContractorsList from '@/components/profile/ContractorsList';
import ProfileActions from '@/components/profile/ProfileActions';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { useProfile } from '@/hooks/useProfile';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, loading, refetch } = useProfile();

  // Controle para evitar múltiplas chamadas do refetch
  const lastFocusTime = useRef(0);

  // Atualiza o perfil sempre que a tela ganhar foco (com throttling)
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      // Throttling: só permite refetch a cada 30 segundos
      if (now - lastFocusTime.current > 30000) {
        console.log('📱 [ProfileScreen] Tela ganhou foco, verificando atualizações...');
        lastFocusTime.current = now;
        refetch();
      } else {
        console.log('📱 [ProfileScreen] Foco detectado, mas throttling ativo');
      }
    }, []) // Dependências vazias para evitar re-criação
  );

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  // Mostrar loading enquanto carrega o perfil
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#18cb96" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />
      <View className="flex-1">
        <ProfileHeader profile={profile} isLoading={loading} onEditPress={handleEditProfile} />

        <View className="flex-1 p-4">
          <ProfileActions />

          <View className="mt-4 flex-1">
            <ContractorsList title="Meus Contratantes" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
