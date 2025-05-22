import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';
import ContractorsList from '@/components/profile/ContractorsList';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileActions from '@/components/profile/ProfileActions';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, isLoading } = useProfile();

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  // Mostrar loading enquanto carrega o perfil
  if (isLoading) {
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
        <ProfileHeader profile={profile} isLoading={isLoading} onEditPress={handleEditProfile} />

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
