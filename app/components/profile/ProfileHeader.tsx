import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '@/hooks/useProfile';
import { getDisplayName, getInitials } from '@/utils/userNameHelper';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  isLoading: boolean;
  onEditPress?: () => void;
  allowEdit?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isLoading,
  onEditPress,
  allowEdit = false,
}) => {
  if (isLoading) {
    return (
      <View className="w-full items-center bg-white py-6">
        <ActivityIndicator size="large" color="#18cb96" />
        <Text className="mt-2 text-sm text-text-light">Carregando perfil...</Text>
      </View>
    );
  }

  const displayName = getDisplayName(profile);
  const userInitials = getInitials(profile);

  console.log('🎨 ProfileHeader renderizando:', {
    displayName,
    userInitials,
    allowEdit,
    profile: profile
      ? {
          name: profile.name,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
        }
      : null,
  });

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

        {allowEdit && onEditPress && (
          <TouchableOpacity
            className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-primary shadow-sm"
            onPress={onEditPress}
            activeOpacity={0.8}>
            <Ionicons name="pencil-outline" size={16} color="#fff" />
          </TouchableOpacity>
        )}
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

      {!allowEdit && (
        <View className="mt-3 rounded-lg bg-gray-50 px-4 py-2">
          <Text className="text-center text-xs text-gray-500">
            Edição temporariamente desabilitada
          </Text>
        </View>
      )}
    </View>
  );
};

export default ProfileHeader;
