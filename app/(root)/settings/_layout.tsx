import { Stack } from 'expo-router';
import React from 'react';

export default function SettingsLayout() {
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
          title: 'Configurações de Perfil',
        }}
      />
    </Stack>
  );
}
