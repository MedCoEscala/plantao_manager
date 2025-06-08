import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

export default function SettingsLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#1f2937',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 rounded-full p-2"
            style={{ backgroundColor: '#f3f4f6' }}>
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
        ),
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Configurações',
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: 'Notificações',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Perfil',
        }}
      />
    </Stack>
  );
}
