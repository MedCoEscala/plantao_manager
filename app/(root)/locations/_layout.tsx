import React from "react";
import { Stack } from "expo-router";

export default function LocationsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="add" />
      <Stack.Screen name="edit" />
    </Stack>
  );
}
