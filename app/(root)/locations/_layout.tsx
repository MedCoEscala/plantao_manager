import { Stack } from 'expo-router';
import React from 'react';

export default function LocationsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="add" />
      <Stack.Screen name="edit" />
    </Stack>
  );
}
