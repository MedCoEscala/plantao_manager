import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef, memo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ContractorsList from '@/components/profile/ContractorsList';
import ProfileActions from '@/components/profile/ProfileActions';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { useProfile } from '@/hooks/useProfile';

const ProfileScreen = memo(() => {
  const router = useRouter();
  const { profile, loading } = useProfile();

  const handleEditProfile = useCallback(() => {
    router.push('/profile/edit');
  }, [router]);

  // Loading state
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
});

ProfileScreen.displayName = 'ProfileScreen';

export default ProfileScreen;
