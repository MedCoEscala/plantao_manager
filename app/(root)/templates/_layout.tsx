import { Stack } from 'expo-router';
import React from 'react';

export default function TemplatesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: '#1e293b',
        },
        contentStyle: {
          backgroundColor: '#FFFFFF',
        },
      }}>
      <Stack.Screen
        name="add"
        options={{
          title: 'Novo Template',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{
          title: 'Detalhes do Template',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="[id]/edit"
        options={{
          title: 'Editar Template',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
