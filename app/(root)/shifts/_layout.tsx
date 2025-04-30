// app/(root)/shifts/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function ShiftsLayout() {
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
          title: 'Novo Plantão',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{
          title: 'Detalhes do Plantão',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="[id]/edit"
        options={{
          title: 'Editar Plantão',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
