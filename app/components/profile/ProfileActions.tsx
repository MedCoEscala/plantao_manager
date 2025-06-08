import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const ProfileActions: React.FC = () => {
  const router = useRouter();
  const { signOut } = useAuth();

  const actions = [
    {
      title: 'Configurações',
      icon: 'settings-outline',
      color: '#64748b',
      onPress: () => {
        router.push('/settings');
      },
    },
    {
      title: 'Ajuda & Suporte',
      icon: 'help-circle-outline',
      color: '#0891b2',
      onPress: () => {},
    },
    {
      title: 'Sobre o App',
      icon: 'information-circle-outline',
      color: '#0d9488',
      onPress: () => {},
    },
    {
      title: 'Sair',
      icon: 'log-out-outline',
      color: '#ef4444',
      onPress: async () => {
        try {
          await signOut();
        } catch (err) {
          console.error('Erro ao sair:', err);
        }
      },
    },
  ];

  return (
    <View className="rounded-lg bg-white p-2">
      {actions.map((action, index) => (
        <TouchableOpacity
          key={action.title}
          className={`flex-row items-center p-3 ${
            index < actions.length - 1 ? 'border-b border-gray-100' : ''
          }`}
          onPress={action.onPress}>
          <View
            className="mr-3 h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: `${action.color}20` }}>
            <Ionicons name={action.icon as any} size={18} color={action.color} />
          </View>
          <Text
            className={`flex-1 text-base ${
              action.title === 'Sair' ? 'font-medium text-error' : 'text-text-dark'
            }`}>
            {action.title}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ProfileActions;
