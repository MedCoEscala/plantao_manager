import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '@/hooks/useProfile';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  isLoading: boolean;
  onEditPress: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, isLoading, onEditPress }) => {
  // Função para obter iniciais do nome
  const getInitials = (name?: string) => {
    if (!name) return '?';

    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  };

  const userInitials = profile ? getInitials(profile.firstName || profile.name) : '?';

  if (isLoading) {
    return (
      <View className="w-full items-center bg-white py-6">
        <ActivityIndicator size="large" color="#18cb96" />
      </View>
    );
  }

  const displayName = profile
    ? profile.firstName
      ? `${profile.firstName} ${profile.lastName || ''}`
      : profile.name || 'Usuário'
    : 'Usuário';

  return (
    <View className="w-full items-center bg-white py-6">
      <View className="relative">
        {profile?.imageUrl ? (
          <Image
            source={{ uri: profile.imageUrl }}
            className="h-24 w-24 rounded-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary/20">
            <Text className="text-2xl font-bold text-primary">{userInitials}</Text>
          </View>
        )}

        <TouchableOpacity
          className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-primary shadow-sm"
          onPress={onEditPress}>
          <Ionicons name="pencil-outline" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text className="mt-4 text-xl font-bold text-text-dark">{displayName}</Text>

      {profile?.email && (
        <View className="mt-1 flex-row items-center">
          <Ionicons name="mail-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
          <Text className="text-sm text-text-light">{profile.email}</Text>
        </View>
      )}

      {profile?.phoneNumber && (
        <View className="mt-1 flex-row items-center">
          <Ionicons name="call-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
          <Text className="text-sm text-text-light">{profile.phoneNumber}</Text>
        </View>
      )}
    </View>
  );
};

export default ProfileHeader;
